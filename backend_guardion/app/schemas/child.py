"""
Child Schemas
Pydantic models for child-related requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class ChildBase(BaseModel):
    """Base child schema"""
    name: str = Field(..., min_length=1, max_length=255)
    age: Optional[int] = Field(None, ge=0, le=18)
    profile_photo: Optional[str] = Field(None, max_length=500)


class ChildCreate(ChildBase):
    """Schema for creating a child profile"""
    pass


class ChildUpdate(BaseModel):
    """Schema for updating a child profile"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    age: Optional[int] = Field(None, ge=0, le=18)
    profile_photo: Optional[str] = Field(None, max_length=500)


class ChildResponse(ChildBase):
    """Schema for child response"""
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
