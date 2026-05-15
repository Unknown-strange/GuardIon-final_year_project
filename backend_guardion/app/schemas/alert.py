"""
Alert Schemas
Pydantic models for alert-related requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class AlertTypeEnum(str, Enum):
    """Alert type enum"""
    SOS = "SOS"
    GEOFENCE_BREACH = "geofence_breach"
    LOW_BATTERY = "low_battery"
    DEVICE_OFFLINE = "device_offline"
    DEVICE_TAMPER = "device_tamper"


class AlertStatusEnum(str, Enum):
    """Alert status enum"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class AlertResponse(BaseModel):
    """Schema for alert response"""
    id: UUID
    child_id: UUID
    device_id: UUID
    alert_type: AlertTypeEnum
    location_lat: Optional[float]
    location_lng: Optional[float]
    status: AlertStatusEnum
    confidence: float
    unprocessed: bool
    resolved_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AlertAcknowledge(BaseModel):
    """Schema for acknowledging an alert"""
    response_text: Optional[str] = Field(None, max_length=1000)


class AlertResolve(BaseModel):
    """Schema for resolving an alert"""
    response_text: Optional[str] = Field(None, max_length=1000)


class AlertResponseRecord(BaseModel):
    """Schema for alert response record"""
    id: UUID
    alert_id: UUID
    user_id: UUID
    response_type: str
    response_text: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    """Schema for list of alerts"""
    alerts: List[AlertResponse]
    total_count: int
