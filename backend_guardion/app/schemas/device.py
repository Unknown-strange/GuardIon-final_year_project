"""
Device Schemas
Pydantic models for device-related requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class DeviceStatusEnum(str, Enum):
    """Device status enum"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOST = "lost"
    CHARGING = "charging"


class DeviceRegister(BaseModel):
    """Schema for registering a new device"""
    device_id: str = Field(..., min_length=1, max_length=100)
    child_id: UUID


class DeviceUpdate(BaseModel):
    """Schema for updating device information"""
    status: Optional[DeviceStatusEnum] = None
    child_id: Optional[UUID] = None


class DeviceResponse(BaseModel):
    """Schema for device response"""
    id: UUID
    device_id: str
    child_id: UUID
    status: DeviceStatusEnum
    battery_level: Optional[int]
    signal_strength: Optional[int]
    last_seen: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class DeviceHealthResponse(BaseModel):
    """Schema for device health metrics"""
    battery_level: Optional[int]
    signal_strength: Optional[int]
    timestamp: datetime
    
    class Config:
        from_attributes = True
