"""
Verify Google OAuth ID tokens from the mobile app.
"""

from typing import Any

import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.config import settings


def verify_google_id_token(token: str) -> dict[str, Any]:
    """Validate token signature, expiry, and audience against configured client IDs."""
    audiences = settings.google_client_ids
    if not audiences:
        raise ValueError("Google OAuth is not configured on the server.")

    last_error: Exception | None = None
    for audience in audiences:
        try:
            return id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                audience=audience,
            )
        except ValueError as exc:
            last_error = exc

    raise ValueError(str(last_error or "Invalid Google ID token."))


def exchange_google_authorization_code(
    code: str,
    redirect_uri: str,
    code_verifier: str | None = None,
) -> dict[str, Any]:
    """Exchange an OAuth authorization code for Google tokens (server-side)."""
    if not settings.GOOGLE_WEB_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise ValueError("Google OAuth code exchange is not configured on the server.")

    payload: dict[str, str] = {
        "code": code,
        "client_id": settings.GOOGLE_WEB_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    if code_verifier:
        payload["code_verifier"] = code_verifier

    response = httpx.post(
        "https://oauth2.googleapis.com/token",
        data=payload,
        timeout=15.0,
    )

    try:
        body = response.json()
    except ValueError as exc:
        raise ValueError("Invalid response from Google token endpoint.") from exc

    if response.status_code >= 400:
        error = body.get("error_description") or body.get("error") or "Google token exchange failed."
        raise ValueError(str(error))

    id_token_value = body.get("id_token")
    if not id_token_value:
        raise ValueError("Google token exchange did not return an ID token.")

    return body
