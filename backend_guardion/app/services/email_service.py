"""
Email delivery via Resend API.
"""

import logging
from typing import Optional

import httpx

from app.config import settings
from app.services.email_templates import otp_email_html, otp_email_text

logger = logging.getLogger(__name__)


def send_otp_email(
    *,
    to_email: str,
    recipient_name: str,
    otp_code: str,
    purpose: str,
) -> bool:
    subject = (
        "Your GuardIon verification code"
        if purpose == "signup"
        else "Reset your GuardIon password"
    )

    html = otp_email_html(
        recipient_name=recipient_name,
        otp_code=otp_code,
        purpose=purpose,
        expires_minutes=settings.OTP_EXPIRE_MINUTES,
    )
    text = otp_email_text(
        recipient_name=recipient_name,
        otp_code=otp_code,
        purpose=purpose,
        expires_minutes=settings.OTP_EXPIRE_MINUTES,
    )

    if not settings.RESEND_API_KEY:
        logger.warning(
            "[DEV] RESEND_API_KEY not set. OTP for %s (%s): %s",
            to_email,
            purpose,
            otp_code,
        )
        return True

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html,
                "text": text,
            },
            timeout=20.0,
        )
        response.raise_for_status()
        return True
    except Exception as exc:
        logger.exception("Failed to send OTP email to %s: %s", to_email, exc)
        return False
