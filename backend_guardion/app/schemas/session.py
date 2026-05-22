"""Push token and session schemas"""

from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class PushTokenRegister(BaseModel):
    token: str = Field(..., min_length=10, max_length=512)
    platform: Optional[str] = Field(None, max_length=50)
    device_name: Optional[str] = Field(None, max_length=255)


class PushTokenResponse(BaseModel):
    id: UUID
    token: str
    platform: Optional[str] = None
    device_name: Optional[str] = None
    last_active: datetime

    class Config:
        from_attributes = True


class UserSessionRegister(BaseModel):
    device_name: str = Field(..., min_length=1, max_length=255)
    platform: Optional[str] = Field(None, max_length=50)
    user_agent: Optional[str] = Field(None, max_length=500)


class UserSessionResponse(BaseModel):
    id: UUID
    device_name: str
    platform: Optional[str] = None
    last_active: datetime
    created_at: datetime
    is_current: bool = False

    class Config:
        from_attributes = True


class UserSessionListResponse(BaseModel):
    sessions: List[UserSessionResponse]
