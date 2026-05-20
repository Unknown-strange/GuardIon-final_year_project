"""
OTP-related Pydantic schemas.
"""

from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class OtpPurposeEnum(str, Enum):
    SIGNUP = "signup"
    PASSWORD_RESET = "password_reset"


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    phone_number: str | None = Field(None, max_length=20)


class SignupVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=8)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=8)
    new_password: str = Field(..., min_length=8, max_length=100)


class ResendOtpRequest(BaseModel):
    email: EmailStr
    purpose: OtpPurposeEnum


class MessageResponse(BaseModel):
    message: str
