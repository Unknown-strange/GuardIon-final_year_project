"""Emergency contact schemas"""

from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class EmergencyContactCreate(BaseModel):
    child_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=5, max_length=30)
    relationship: Optional[str] = Field(None, max_length=100)


class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, min_length=5, max_length=30)
    relationship: Optional[str] = Field(None, max_length=100)


class EmergencyContactResponse(BaseModel):
    id: UUID
    child_id: UUID
    name: str
    phone: str
    relationship: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EmergencyContactListResponse(BaseModel):
    contacts: List[EmergencyContactResponse]
