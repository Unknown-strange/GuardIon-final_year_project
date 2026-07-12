"""
API Dependencies
Dependency injection for database sessions and authentication
"""

from typing import Generator, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.api.child_access import get_accessible_child as _get_accessible_child
from app.api.child_access import get_owned_child as _get_owned_child
from app.database import SessionLocal
from app.models.user import User
from app.models.child import Child
from app.utils.security import decode_token


# Security scheme for JWT
security = HTTPBearer()


def get_db() -> Generator:
    """
    Dependency to get database session
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token
    Usage: current_user: User = Depends(get_current_user)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extract token
    token = credentials.credentials
    
    # Decode token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    # Check token type
    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    # Get user ID from token
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active (future: can add is_active field)
    Usage: current_user: User = Depends(get_current_active_user)
    """
    return current_user


def get_user_child(
    child_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Child:
    """Ensure the current user may access the child (owner or active co-guardian)."""
    return _get_accessible_child(child_id, current_user, db)


def get_owned_child(
    child_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Child:
    """Ensure the child belongs to the current user (primary guardian only)."""
    return _get_owned_child(child_id, current_user, db)
