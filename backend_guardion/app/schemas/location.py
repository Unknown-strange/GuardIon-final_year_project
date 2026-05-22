"""
Location Schemas
Pydantic models for location-related requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class LocationResponse(BaseModel):
    """Schema for location point response"""
    id: UUID
    device_id: UUID
    latitude: float
    longitude: float
    accuracy: Optional[float]
    altitude: Optional[float]
    speed: Optional[float]
    battery_level: Optional[float]
    timestamp: datetime
    
    class Config:
        from_attributes = True


class LocationHistoryQuery(BaseModel):
    """Schema for querying location history"""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    limit: int = Field(default=100, ge=1, le=1000)


class LocationHistoryResponse(BaseModel):
    """Schema for location history response"""
    locations: List[LocationResponse]
    total_count: int


class CurrentLocationResponse(BaseModel):
    """Schema for current (latest) location"""
    latitude: float
    longitude: float
    accuracy: Optional[float]
    speed: Optional[float] = None
    timestamp: datetime
    battery_level: Optional[float]
