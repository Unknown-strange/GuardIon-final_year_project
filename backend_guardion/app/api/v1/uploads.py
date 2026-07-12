"""
Upload authentication API (ImageKit).
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.imagekit_auth import create_imagekit_upload_auth

router = APIRouter()


@router.get("/imagekit-auth")
def get_imagekit_upload_auth(
    current_user: User = Depends(get_current_active_user),
):
    """Return signed parameters for client-side ImageKit upload."""
    try:
        return create_imagekit_upload_auth()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
