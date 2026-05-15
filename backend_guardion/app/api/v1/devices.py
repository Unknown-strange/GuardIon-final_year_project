"""
Device Management API
Endpoints for managing wearable devices
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.child import Child
from app.models.device import Device, DeviceStatus
from app.schemas.device import DeviceRegister, DeviceUpdate, DeviceResponse, DeviceHealthResponse

router = APIRouter()


@router.post("/register", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    device_data: DeviceRegister,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Register a new device and link it to a child
    """
    # Verify the child belongs to the current user
    child = db.query(Child).filter(
        Child.id == device_data.child_id,
        Child.user_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or does not belong to you"
        )
    
    # Check if device_id already exists
    existing_device = db.query(Device).filter(Device.device_id == device_data.device_id).first()
    if existing_device:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device ID already registered"
        )
    
    # Create device
    db_device = Device(
        device_id=device_data.device_id,
        child_id=device_data.child_id,
        status=DeviceStatus.ACTIVE
    )
    
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    
    return db_device


@router.get("/", response_model=List[DeviceResponse])
def list_devices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all devices for the current user's children
    """
    # Get all children for the user
    child_ids = db.query(Child.id).filter(Child.user_id == current_user.id).all()
    child_ids = [c[0] for c in child_ids]
    
    # Get all devices for these children
    devices = db.query(Device).filter(Device.child_id.in_(child_ids)).all()
    return devices


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific device by device_id (ESP32 identifier)
    """
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
    
    return device


@router.patch("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: str,
    device_data: DeviceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update device information (status, reassign to different child)
    """
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
    
    # If reassigning to a different child, verify the new child belongs to the user
    if device_data.child_id is not None:
        new_child = db.query(Child).filter(
            Child.id == device_data.child_id,
            Child.user_id == current_user.id
        ).first()
        
        if not new_child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target child not found or does not belong to you"
            )
    
    # Update fields
    update_data = device_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)
    
    db.commit()
    db.refresh(device)
    
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(
    device_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Unregister a device (also deletes location history, alerts, etc.)
    """
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
    
    db.delete(device)
    db.commit()
    
    return None
