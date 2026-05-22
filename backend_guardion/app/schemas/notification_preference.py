"""Notification preference schemas"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class NotificationPreferenceUpdate(BaseModel):
    sos_enabled: bool | None = None
    geofence_enabled: bool | None = None
    battery_enabled: bool | None = None
    weekly_summary_enabled: bool | None = None


class NotificationPreferenceResponse(BaseModel):
    user_id: UUID
    sos_enabled: bool
    geofence_enabled: bool
    battery_enabled: bool
    weekly_summary_enabled: bool
    updated_at: datetime

    class Config:
        from_attributes = True
