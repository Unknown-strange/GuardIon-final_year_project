"""
User Pydantic Schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


# Base User schema (shared fields)
class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)


# Schema for creating a new user (registration)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


# Schema for updating user
class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    profile_photo: Optional[str] = Field(None, max_length=500)


# Schema for user response (what API returns)
class UserResponse(UserBase):
    id: UUID
    profile_photo: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True  # Allows Pydantic to work with SQLAlchemy models


# Schema for user in database (internal use)
class UserInDB(UserResponse):
    password: str
    
    class Config:
        from_attributes = True
