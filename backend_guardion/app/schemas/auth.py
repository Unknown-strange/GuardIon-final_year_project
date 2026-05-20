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


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class GoogleAuthRequest(BaseModel):
    id_token: str


class GoogleCodeExchangeRequest(BaseModel):
    code: str
    redirect_uri: str
    code_verifier: str | None = None


# Token data (what's inside the JWT)
class TokenData(BaseModel):
    user_id: str
    email: str
