"""
Notification Schemas
Pydantic models for notification-related requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class NotificationResponse(BaseModel):
    """Schema for notification response"""
    id: UUID
    user_id: UUID
    alert_id: Optional[UUID]
    type: str
    title: str
    message: str
    read: bool
    sent_at: datetime
    
    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    """Schema for marking notification as read"""
    notification_ids: List[UUID]


class NotificationListResponse(BaseModel):
    """Schema for list of notifications"""
    notifications: List[NotificationResponse]
    unread_count: int
    total_count: int


class NotificationCreate(BaseModel):
    """Schema for creating a notification (internal use)"""
    user_id: UUID
    alert_id: Optional[UUID]
    type: str
    title: str = Field(..., max_length=255)
    message: str = Field(..., max_length=1000)
