"""
Authentication Pydantic Schemas
"""

from pydantic import BaseModel, EmailStr


# Login request schema
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Token response schema
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Token data (what's inside the JWT)
class TokenData(BaseModel):
    user_id: str
    email: str
