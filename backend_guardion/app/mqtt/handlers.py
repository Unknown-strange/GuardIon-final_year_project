"""
MQTT Message Handlers
Processes incoming MQTT messages from devices
"""

import logging
from datetime import datetime
from typing import Dict
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.device import Device
from app.models.location import LocationHistory
from app.models.alert import Alert, AlertType, AlertStatus
from app.models.child import Child
from app.services.geofencing import check_geofence_breach, check_low_battery_alert
from app.services.notifications import create_notification_for_alert
from app.websocket.manager import manager

logger = logging.getLogger(__name__)


async def handle_mqtt_message(topic: str, payload: Dict):
    """
    Route MQTT messages to appropriate handlers
    """
    try:
        if "telemetry" in topic:
            await handle_telemetry(payload)
        elif "alerts" in topic:
            await handle_alert(payload)
        elif "status" in topic:
            await handle_status(payload)
        else:
            logger.warning(f"Unknown topic: {topic}")
            
    except Exception as e:
        logger.exception(f"Error handling MQTT message: {e}")


async def handle_telemetry(payload: Dict):
    """
    Handle location telemetry messages
    Saves GPS location and battery data to database
    Automatically checks for geofence breaches and low battery
    """
    try:
        device_id = payload.get("device_id")
        timestamp_str = payload.get("timestamp")
        location = payload.get("location", {})
        battery = payload.get("battery", {})
        
        if not device_id:
            logger.error("Missing device_id in telemetry")
            return
        
        # Parse timestamp
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except:
            timestamp = datetime.utcnow()
        
        # Create database session
        db = SessionLocal()
        
        try:
            # Find device in database
            device = db.query(Device).filter(Device.device_id == device_id).first()
            
            if not device:
                logger.warning(f"Device {device_id} not registered in database")
                return
            
            # Save location to history
            latitude = location.get("latitude")
            longitude = location.get("longitude")
            battery_level = battery.get("level")
            
            location_record = LocationHistory(
                device_id=device.id,
                latitude=latitude,
                longitude=longitude,
                accuracy=location.get("accuracy"),
                altitude=location.get("altitude"),
                speed=location.get("speed"),
                battery_level=battery_level,
                timestamp=timestamp
            )
            
            db.add(location_record)
            
            # Update device last_seen and battery
            device.last_seen = timestamp
            device.battery_level = battery_level
            device.signal_strength = payload.get("signal", {}).get("strength")
            
            db.commit()
            
            logger.info(f"[OK] Saved telemetry: {device_id} | Lat: {latitude:.4f}, Lng: {longitude:.4f}, Battery: {battery_level}%")
            
            # --- WEBSOCKET BROADCAST ---
            # Broadcast location update to connected WebSocket clients
            if latitude and longitude:
                await manager.broadcast_location(device_id, {
                    "latitude": latitude,
                    "longitude": longitude,
                    "accuracy": location.get("accuracy"),
                    "altitude": location.get("altitude"),
                    "speed": location.get("speed"),
                    "battery_level": battery_level,
                    "timestamp": timestamp.isoformat()
                })
            
            # --- AUTOMATIC MONITORING ---
            
            # 1. Check for geofence breach
            if latitude and longitude:
                breach_alert = check_geofence_breach(device, latitude, longitude, db)
                if breach_alert:
                    # Create notification for breach alert
                    create_notification_for_alert(breach_alert, db)
                    
                    # Broadcast alert to user via WebSocket
                    child = db.query(Child).filter(Child.id == device.child_id).first()
                    if child:
                        await manager.broadcast_alert(str(child.user_id), {
                            "alert_id": str(breach_alert.id),
                            "alert_type": breach_alert.alert_type.value,
                            "child_id": str(breach_alert.child_id),
                            "device_id": device_id,
                            "location_lat": breach_alert.location_lat,
                            "location_lng": breach_alert.location_lng,
                            "status": breach_alert.status.value,
                            "created_at": breach_alert.created_at.isoformat()
                        })
            
            # 2. Check for low battery
            if battery_level is not None:
                low_battery_alert = check_low_battery_alert(device, battery_level, db)
                if low_battery_alert:
                    # Create notification for low battery alert
                    create_notification_for_alert(low_battery_alert, db)
                    
                    # Broadcast alert to user via WebSocket
                    child = db.query(Child).filter(Child.id == device.child_id).first()
                    if child:
                        await manager.broadcast_alert(str(child.user_id), {
                            "alert_id": str(low_battery_alert.id),
                            "alert_type": low_battery_alert.alert_type.value,
                            "child_id": str(low_battery_alert.child_id),
                            "device_id": device_id,
                            "status": low_battery_alert.status.value,
                            "created_at": low_battery_alert.created_at.isoformat(),
                            "battery_level": battery_level
                        })
            
        finally:
            db.close()
            
    except Exception as e:
        logger.exception(f"Error handling telemetry: {e}")


async def handle_alert(payload: Dict):
    """
    Handle alert messages (SOS, low battery, etc.)
    Creates alert in database and sends notification
    """
    try:
        device_id = payload.get("device_id")
        alert_type_str = payload.get("alert_type")
        location = payload.get("location", {})
        priority = payload.get("priority", "high")
        
        if not device_id:
            logger.error("Missing device_id in alert")
            return
        
        # Map alert type string to enum
        alert_type_map = {
            "SOS": AlertType.SOS,
            "LOW_BATTERY": AlertType.LOW_BATTERY,
            "DEVICE_TAMPER": AlertType.DEVICE_TAMPER,
            "DEVICE_OFFLINE": AlertType.DEVICE_OFFLINE
        }
        
        alert_type = alert_type_map.get(alert_type_str, AlertType.SOS)
        
        # Create database session
        db = SessionLocal()
        
        try:
            # Find device
            device = db.query(Device).filter(Device.device_id == device_id).first()
            
            if not device:
                logger.warning(f"Device {device_id} not registered")
                return
            
            # Create alert
            alert = Alert(
                child_id=device.child_id,
                device_id=device.id,
                alert_type=alert_type,
                location_lat=location.get("latitude"),
                location_lng=location.get("longitude"),
                status=AlertStatus.ACTIVE
            )
            
            db.add(alert)
            db.commit()
            db.refresh(alert)
            
            logger.warning(f"[WARNING] ALERT CREATED: {alert_type_str} from {device_id} | Priority: {priority}")
            
            # Create notification for the parent/guardian
            create_notification_for_alert(alert, db)
            
            # Broadcast alert to user via WebSocket
            child = db.query(Child).filter(Child.id == device.child_id).first()
            if child:
                await manager.broadcast_alert(str(child.user_id), {
                    "alert_id": str(alert.id),
                    "alert_type": alert.alert_type.value,
                    "child_id": str(alert.child_id),
                    "device_id": device_id,
                    "location_lat": alert.location_lat,
                    "location_lng": alert.location_lng,
                    "status": alert.status.value,
                    "priority": priority,
                    "created_at": alert.created_at.isoformat()
                })
            
        finally:
            db.close()
            
    except Exception as e:
        logger.exception(f"Error handling alert: {e}")


async def handle_status(payload: Dict):
    """
    Handle device status messages
    Updates device online/offline status
    """
    try:
        device_id = payload.get("device_id")
        status = payload.get("status")
        
        if not device_id:
            logger.error("Missing device_id in status")
            return
        
        db = SessionLocal()
        
        try:
            device = db.query(Device).filter(Device.device_id == device_id).first()
            
            if device:
                device.last_seen = datetime.utcnow()
                db.commit()
                logger.info(f"[OK] Device {device_id} status: {status}")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.exception(f"Error handling status: {e}")
