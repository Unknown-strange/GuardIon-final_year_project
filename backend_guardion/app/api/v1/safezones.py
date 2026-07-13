"""
Safe Zones API
Endpoints for managing geofences
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import math

from app.api.deps import get_db, get_current_active_user, get_user_child, get_owned_child
from app.api.child_access import user_can_access_child, user_owns_child
from app.models.user import User
from app.models.safezone import SafeZone, ZoneType
from app.schemas.safezone import (
    SafeZoneCreate,
    SafeZoneUpdate,
    SafeZoneResponse,
    LocationCheckRequest,
    LocationCheckResponse,
    ZoneTypeEnum,
)

router = APIRouter()


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


@router.post("/", response_model=SafeZoneResponse, status_code=status.HTTP_201_CREATED)
def create_safezone(
    safezone_data: SafeZoneCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new safe zone (geofence) for a child
    """
    get_owned_child(safezone_data.child_id, current_user, db)
    
    # Create safezone
    db_safezone = SafeZone(
        child_id=safezone_data.child_id,
        zone_name=safezone_data.zone_name,
        center_lat=safezone_data.center_lat,
        center_lng=safezone_data.center_lng,
        radius=safezone_data.radius,
        zone_type=ZoneType(safezone_data.zone_type.value),
    )
    
    db.add(db_safezone)
    db.commit()
    db.refresh(db_safezone)
    
    return db_safezone


@router.get("/child/{child_id}", response_model=List[SafeZoneResponse])
def list_safezones(
    child_id: UUID,
    zone_type: Optional[ZoneTypeEnum] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all safe zones for a child
    """
    get_user_child(child_id, current_user, db)

    query = db.query(SafeZone).filter(SafeZone.child_id == child_id)
    if zone_type is not None:
        query = query.filter(SafeZone.zone_type == ZoneType(zone_type.value))
    return query.all()


@router.get("/{safezone_id}", response_model=SafeZoneResponse)
def get_safezone(
    safezone_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific safe zone by ID
    """
    safezone = db.query(SafeZone).filter(SafeZone.id == safezone_id).first()
    
    if not safezone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safe zone not found"
        )
    
    if not user_can_access_child(current_user, safezone.child_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this safe zone"
        )
    
    return safezone


@router.patch("/{safezone_id}", response_model=SafeZoneResponse)
def update_safezone(
    safezone_id: UUID,
    safezone_data: SafeZoneUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a safe zone's properties
    """
    safezone = db.query(SafeZone).filter(SafeZone.id == safezone_id).first()
    
    if not safezone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safe zone not found"
        )
    
    if not user_owns_child(current_user, safezone.child_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this safe zone"
        )
    
    # Update fields
    update_data = safezone_data.model_dump(exclude_unset=True)
    if "zone_type" in update_data and update_data["zone_type"] is not None:
        zt = update_data["zone_type"]
        update_data["zone_type"] = ZoneType(zt.value if hasattr(zt, "value") else zt)
    for field, value in update_data.items():
        setattr(safezone, field, value)
    
    db.commit()
    db.refresh(safezone)
    
    return safezone


@router.delete("/{safezone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_safezone(
    safezone_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a safe zone
    """
    safezone = db.query(SafeZone).filter(SafeZone.id == safezone_id).first()
    
    if not safezone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safe zone not found"
        )
    
    if not user_owns_child(current_user, safezone.child_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this safe zone"
        )
    
    db.delete(safezone)
    db.commit()
    
    return None


@router.post("/{safezone_id}/check", response_model=LocationCheckResponse)
def check_location_in_safezone(
    safezone_id: UUID,
    location: LocationCheckRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Check if a given location is within the safe zone
    Useful for manual checks from the frontend
    """
    safezone = db.query(SafeZone).filter(SafeZone.id == safezone_id).first()
    
    if not safezone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safe zone not found"
        )
    
    if not user_can_access_child(current_user, safezone.child_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this safe zone"
        )
    
    # Calculate distance from safezone center
    distance = calculate_distance(
        location.latitude,
        location.longitude,
        safezone.center_lat,
        safezone.center_lng
    )
    
    is_within = distance <= safezone.radius
    
    return LocationCheckResponse(
        is_within_safezone=is_within,
        safezone_id=safezone.id if is_within else None,
        safezone_name=safezone.zone_name if is_within else None,
        distance_from_center=distance
    )
