"""
SafeZone Schemas
Pydantic models for geofence-related requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class ZoneTypeEnum(str, Enum):
    SAFE = "SAFE"
    DANGER = "DANGER"


class SafeZoneBase(BaseModel):
    """Base safezone schema"""
    zone_name: str = Field(..., min_length=1, max_length=255)
    center_lat: float = Field(..., ge=-90, le=90)
    center_lng: float = Field(..., ge=-180, le=180)
    radius: float = Field(..., gt=0, description="Radius in meters")
    zone_type: ZoneTypeEnum = ZoneTypeEnum.SAFE


class SafeZoneCreate(SafeZoneBase):
    """Schema for creating a safe zone"""
    child_id: UUID


class SafeZoneUpdate(BaseModel):
    """Schema for updating a safe zone"""
    zone_name: Optional[str] = Field(None, min_length=1, max_length=255)
    center_lat: Optional[float] = Field(None, ge=-90, le=90)
    center_lng: Optional[float] = Field(None, ge=-180, le=180)
    radius: Optional[float] = Field(None, gt=0)
    zone_type: Optional[ZoneTypeEnum] = None


class SafeZoneResponse(SafeZoneBase):
    """Schema for safe zone response"""
    id: UUID
    child_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class LocationCheckRequest(BaseModel):
    """Schema for checking if a location is within a safe zone"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class LocationCheckResponse(BaseModel):
    """Schema for location check response"""
    is_within_safezone: bool
    safezone_id: Optional[UUID]
    safezone_name: Optional[str]
    distance_from_center: Optional[float]  # meters
