"""
Email OTP verification records for signup and password reset.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import ENUM, UUID

from app.database import Base


class OtpPurpose(str, enum.Enum):
    SIGNUP = "signup"
    PASSWORD_RESET = "password_reset"


OTP_PURPOSE_DB_ENUM = ENUM(
    "signup",
    "password_reset",
    name="otppurpose",
    create_type=False,
)


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), nullable=False, index=True)
    purpose = Column(OTP_PURPOSE_DB_ENUM, nullable=False, index=True)
    code_hash = Column(String(255), nullable=False)
    payload_json = Column(Text, nullable=True)
    attempts = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    consumed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<EmailVerification(email={self.email}, purpose={self.purpose})>"
