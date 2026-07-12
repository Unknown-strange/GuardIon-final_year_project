"""
ImageKit upload authentication helpers.
"""

import base64
import hashlib
import hmac
import uuid
from datetime import datetime, timedelta

from app.config import settings


def create_imagekit_upload_auth() -> dict:
    if not settings.IMAGEKIT_PUBLIC_KEY or not settings.IMAGEKIT_PRIVATE_KEY:
        raise ValueError("ImageKit is not configured")

    token = str(uuid.uuid4())
    expire = int((datetime.utcnow() + timedelta(minutes=30)).timestamp())
    signature = base64.b64encode(
        hmac.new(
            settings.IMAGEKIT_PRIVATE_KEY.encode("utf-8"),
            f"{token}{expire}".encode("utf-8"),
            hashlib.sha1,
        ).digest()
    ).decode("utf-8")

    return {
        "token": token,
        "expire": expire,
        "signature": signature,
        "publicKey": settings.IMAGEKIT_PUBLIC_KEY,
        "folder": settings.IMAGEKIT_UPLOAD_FOLDER,
        "urlEndpoint": settings.IMAGEKIT_URL_ENDPOINT,
    }
