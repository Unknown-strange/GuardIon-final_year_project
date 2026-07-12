"""Guardian API schemas"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID


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


class GuardianInviteResponse(BaseModel):
    id: UUID
    child_id: UUID
    child_name: str
    invited_by_name: str
    invited_by_email: str
    status: str = "pending"


class GuardianInviteListResponse(BaseModel):
    invites: List[GuardianInviteResponse]
