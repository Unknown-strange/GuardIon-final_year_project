"""
Location Queries API
Endpoints for retrieving GPS location data
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.child import Child
from app.models.device import Device
from app.models.location import LocationHistory
from app.schemas.location import (
    LocationResponse,
    LocationHistoryResponse,
    CurrentLocationResponse
)

router = APIRouter()


@router.get("/{device_id}/current", response_model=CurrentLocationResponse)
def get_current_location(
    device_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the current (most recent) location for a device
    This is what the mobile app will use for real-time tracking on Google Maps
    """
    # Get device and verify ownership
    device = db.query(Device).filter(Device.device_id == device_id).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    # Verify the device belongs to one of the user's children
    child = db.query(Child).filter(
        Child.id == device.child_id,
        Child.user_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this device"
        )
    
    # Get most recent location
    location = db.query(LocationHistory).filter(
        LocationHistory.device_id == device.id
    ).order_by(desc(LocationHistory.timestamp)).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No location data available for this device"
        )
    
    return CurrentLocationResponse(
        latitude=location.latitude,
        longitude=location.longitude,
        accuracy=location.accuracy,
        speed=location.speed,
        timestamp=location.timestamp,
        battery_level=location.battery_level
    )


@router.get("/{device_id}/history", response_model=LocationHistoryResponse)
def get_location_history(
    device_id: str,
    start_time: Optional[datetime] = Query(None, description="Start time for query range"),
    end_time: Optional[datetime] = Query(None, description="End time for query range"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of locations to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get location history for a device
    Useful for displaying a route/path on Google Maps
    """
    # Get device and verify ownership
    device = db.query(Device).filter(Device.device_id == device_id).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    # Verify the device belongs to one of the user's children
    child = db.query(Child).filter(
        Child.id == device.child_id,
        Child.user_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this device"
        )
    
    # Build query
    query = db.query(LocationHistory).filter(LocationHistory.device_id == device.id)
    
    # Apply time filters if provided
    if start_time:
        query = query.filter(LocationHistory.timestamp >= start_time)
    if end_time:
        query = query.filter(LocationHistory.timestamp <= end_time)
    
    # Get total count
    total_count = query.count()
    
    # Get locations ordered by most recent first
    locations = query.order_by(desc(LocationHistory.timestamp)).limit(limit).all()
    
    return LocationHistoryResponse(
        locations=locations,
        total_count=total_count
    )


@router.get("/child/{child_id}/current", response_model=CurrentLocationResponse)
def get_child_current_location(
    child_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the current location for a child (via their primary device)
    Convenient endpoint when you want to track by child instead of device
    """
    # Verify the child belongs to the current user
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.user_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or does not belong to you"
        )
    
    # Get the child's device (assume first active device)
    device = db.query(Device).filter(Device.child_id == child_id).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No device found for this child"
        )
    
    # Get most recent location
    location = db.query(LocationHistory).filter(
        LocationHistory.device_id == device.id
    ).order_by(desc(LocationHistory.timestamp)).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No location data available for this child"
        )
    
    return CurrentLocationResponse(
        latitude=location.latitude,
        longitude=location.longitude,
        accuracy=location.accuracy,
        speed=location.speed,
        timestamp=location.timestamp,
        battery_level=location.battery_level
    )
