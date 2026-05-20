"""
OTP generation, persistence, and verification.
"""

import json
import logging
import secrets
from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models.email_verification import EmailVerification, OtpPurpose
from app.services.email_service import send_otp_email
from app.utils.security import get_password_hash, verify_password

logger = logging.getLogger(__name__)

MAX_OTP_ATTEMPTS = 5


def generate_otp_code() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(settings.OTP_LENGTH))


def _invalidate_active(db: Session, email: str, purpose: OtpPurpose) -> None:
    now = datetime.utcnow()
    rows = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.email == email.lower(),
            EmailVerification.purpose == purpose.value,
            EmailVerification.consumed_at.is_(None),
            EmailVerification.expires_at > now,
        )
        .all()
    )
    for row in rows:
        row.consumed_at = now


def issue_otp(
    db: Session,
    *,
    email: str,
    purpose: OtpPurpose,
    recipient_name: str,
    payload: Optional[dict[str, Any]] = None,
) -> tuple[bool, Optional[str]]:
    normalized_email = email.strip().lower()
    code = generate_otp_code()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    _invalidate_active(db, normalized_email, purpose)

    record = EmailVerification(
        email=normalized_email,
        purpose=purpose.value,
        code_hash=get_password_hash(code),
        payload_json=json.dumps(payload) if payload else None,
        attempts=0,
        expires_at=expires_at,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    logger.info(
        "OTP created for %s (%s), record=%s, expires_at=%s",
        normalized_email,
        purpose.value,
        record.id,
        expires_at.isoformat(),
    )

    sent = send_otp_email(
        to_email=normalized_email,
        recipient_name=recipient_name,
        otp_code=code,
        purpose=purpose.value,
    )
    if not sent:
        return False, "Unable to send verification email. Please try again later."

    return True, None


def verify_otp(
    db: Session,
    *,
    email: str,
    purpose: OtpPurpose,
    code: str,
) -> tuple[Optional[EmailVerification], Optional[str]]:
    normalized_email = email.strip().lower()
    now = datetime.utcnow()

    record = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.email == normalized_email,
            EmailVerification.purpose == purpose.value,
            EmailVerification.consumed_at.is_(None),
        )
        .order_by(EmailVerification.created_at.desc())
        .first()
    )

    if not record:
        return None, "Invalid or expired verification code."

    if record.expires_at <= now:
        return None, "Verification code has expired. Request a new one."

    if record.attempts >= MAX_OTP_ATTEMPTS:
        return None, "Too many failed attempts. Request a new code."

    if not verify_password(code, record.code_hash):
        record.attempts += 1
        db.commit()
        remaining = MAX_OTP_ATTEMPTS - record.attempts
        if remaining <= 0:
            return None, "Too many failed attempts. Request a new code."
        return None, f"Invalid verification code. {remaining} attempt(s) remaining."

    record.consumed_at = now
    db.commit()
    return record, None


def load_payload(record: EmailVerification) -> dict[str, Any]:
    if not record.payload_json:
        return {}
    try:
        return json.loads(record.payload_json)
    except json.JSONDecodeError:
        return {}
