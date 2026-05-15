"""
Geofencing Service
Handles geofence breach detection and monitoring
"""

import logging
import math
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session

from app.models.child import Child
from app.models.device import Device
from app.models.safezone import SafeZone
from app.models.alert import Alert, AlertType, AlertStatus
from app.config import settings

logger = logging.getLogger(__name__)


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two GPS coordinates using Haversine formula
    Returns distance in meters
    """
    R = 6371000  # Earth's radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    
    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance


def is_location_in_safezone(
    latitude: float,
    longitude: float,
    safezone: SafeZone
) -> Tuple[bool, float]:
    """
    Check if a location is within a safe zone
    
    Args:
        latitude: GPS latitude
        longitude: GPS longitude
        safezone: SafeZone object to check against
        
    Returns:
        Tuple of (is_within, distance_from_center)
    """
    distance = calculate_distance(
        latitude,
        longitude,
        safezone.center_lat,
        safezone.center_lng
    )
    
    is_within = distance <= safezone.radius
    return is_within, distance


def check_geofence_breach(
    device: Device,
    latitude: float,
    longitude: float,
    db: Session
) -> Optional[Alert]:
    """
    Check if device location is outside all safe zones for the child
    Creates a geofence breach alert if:
    1. Device is outside all safe zones
    2. No recent breach alert exists (cooldown period)
    
    Args:
        device: Device object
        latitude: Current GPS latitude
        longitude: Current GPS longitude
        db: Database session
        
    Returns:
        Alert object if breach detected and alert created, None otherwise
    """
    try:
        # Get all safe zones for this child
        safezones = db.query(SafeZone).filter(
            SafeZone.child_id == device.child_id
        ).all()
        
        if not safezones:
            # No safe zones defined, no breach possible
            return None
        
        # Check if location is within ANY safe zone
        is_within_any_zone = False
        closest_zone = None
        min_distance = float('inf')
        
        for safezone in safezones:
            is_within, distance = is_location_in_safezone(latitude, longitude, safezone)
            
            if is_within:
                is_within_any_zone = True
                logger.info(f"Device {device.device_id} is within safe zone: {safezone.zone_name}")
                break
            
            # Track closest zone for logging
            if distance < min_distance:
                min_distance = distance
                closest_zone = safezone
        
        # If within any zone, no breach
        if is_within_any_zone:
            return None
        
        # Device is outside all zones - check cooldown before creating alert
        cooldown_minutes = settings.GEOFENCE_BREACH_COOLDOWN_MINUTES
        cooldown_time = datetime.utcnow() - timedelta(minutes=cooldown_minutes)
        
        # Check for recent breach alerts
        recent_breach = db.query(Alert).filter(
            Alert.device_id == device.id,
            Alert.alert_type == AlertType.GEOFENCE_BREACH,
            Alert.created_at >= cooldown_time
        ).first()
        
        if recent_breach:
            logger.info(
                f"Geofence breach detected for {device.device_id}, "
                f"but alert already exists within cooldown period"
            )
            return None
        
        # Create breach alert
        alert = Alert(
            child_id=device.child_id,
            device_id=device.id,
            alert_type=AlertType.GEOFENCE_BREACH,
            location_lat=latitude,
            location_lng=longitude,
            status=AlertStatus.ACTIVE,
            confidence=1.0
        )
        
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        logger.warning(
            f"[WARNING] GEOFENCE BREACH: Device {device.device_id} is outside all safe zones! "
            f"Distance from nearest zone ({closest_zone.zone_name if closest_zone else 'unknown'}): "
            f"{min_distance:.1f}m"
        )
        
        return alert
        
    except Exception as e:
        logger.exception(f"Error checking geofence breach: {e}")
        return None


def check_low_battery_alert(
    device: Device,
    battery_level: float,
    db: Session
) -> Optional[Alert]:
    """
    Check if device battery is low and create alert if needed
    
    Args:
        device: Device object
        battery_level: Current battery level (0-100)
        db: Database session
        
    Returns:
        Alert object if low battery alert created, None otherwise
    """
    try:
        # Low battery threshold (20%)
        LOW_BATTERY_THRESHOLD = 20
        
        if battery_level > LOW_BATTERY_THRESHOLD:
            return None
        
        # Check for recent low battery alerts (1 hour cooldown)
        cooldown_time = datetime.utcnow() - timedelta(hours=1)
        
        recent_alert = db.query(Alert).filter(
            Alert.device_id == device.id,
            Alert.alert_type == AlertType.LOW_BATTERY,
            Alert.created_at >= cooldown_time
        ).first()
        
        if recent_alert:
            return None
        
        # Create low battery alert
        alert = Alert(
            child_id=device.child_id,
            device_id=device.id,
            alert_type=AlertType.LOW_BATTERY,
            status=AlertStatus.ACTIVE,
            confidence=1.0
        )
        
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        logger.warning(
            f"[WARNING] LOW BATTERY: Device {device.device_id} at {battery_level}%"
        )
        
        return alert
        
    except Exception as e:
        logger.exception(f"Error checking low battery: {e}")
        return None


def get_child_safezones(child_id, db: Session) -> List[SafeZone]:
    """
    Get all safe zones for a child
    
    Args:
        child_id: Child UUID
        db: Database session
        
    Returns:
        List of SafeZone objects
    """
    return db.query(SafeZone).filter(SafeZone.child_id == child_id).all()
