"""Guardian API schemas"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class GuardianInvite(BaseModel):
    child_id: UUID
    email: EmailStr
    priority: int = Field(default=2, ge=2, le=5)


class GuardianResponse(BaseModel):
    id: str
    child_id: UUID
    name: str
    email: str
    role: str
    is_primary: bool = False
    status: str = "active"

    class Config:
        from_attributes = True


class GuardianListResponse(BaseModel):
    guardians: List[GuardianResponse]
