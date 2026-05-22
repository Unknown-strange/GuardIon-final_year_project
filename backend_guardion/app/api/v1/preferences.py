"""
Notification preferences and user sessions API
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.notification_preference import NotificationPreference
from app.models.user_session import UserSession
from app.schemas.notification_preference import (
    NotificationPreferenceUpdate,
    NotificationPreferenceResponse,
)
from app.schemas.session import (
    UserSessionRegister,
    UserSessionResponse,
    UserSessionListResponse,
)

router = APIRouter()


def _get_or_create_preferences(user: User, db: Session) -> NotificationPreference:
    prefs = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user.id
    ).first()
    if prefs:
        return prefs

    prefs = NotificationPreference(user_id=user.id)
    db.add(prefs)
    db.commit()
    db.refresh(prefs)
    return prefs


@router.get("/me/preferences", response_model=NotificationPreferenceResponse)
def get_notification_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _get_or_create_preferences(current_user, db)


@router.patch("/me/preferences", response_model=NotificationPreferenceResponse)
def update_notification_preferences(
    payload: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    prefs = _get_or_create_preferences(current_user, db)

    if payload.sos_enabled is not None:
        prefs.sos_enabled = payload.sos_enabled
    if payload.geofence_enabled is not None:
        prefs.geofence_enabled = payload.geofence_enabled
    if payload.battery_enabled is not None:
        prefs.battery_enabled = payload.battery_enabled
    if payload.weekly_summary_enabled is not None:
        prefs.weekly_summary_enabled = payload.weekly_summary_enabled

    prefs.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(prefs)
    return prefs


@router.get("/me/sessions", response_model=UserSessionListResponse)
def list_user_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id
    ).order_by(UserSession.last_active.desc()).all()

    if not sessions:
        return UserSessionListResponse(sessions=[])

    latest_id = sessions[0].id
    return UserSessionListResponse(
        sessions=[
            UserSessionResponse(
                id=s.id,
                device_name=s.device_name,
                platform=s.platform,
                last_active=s.last_active,
                created_at=s.created_at,
                is_current=s.id == latest_id,
            )
            for s in sessions
        ]
    )


@router.post("/me/sessions", response_model=UserSessionResponse, status_code=status.HTTP_201_CREATED)
def register_user_session(
    payload: UserSessionRegister,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    session = UserSession(
        user_id=current_user.id,
        device_name=payload.device_name.strip(),
        platform=payload.platform,
        user_agent=payload.user_agent,
        last_active=now,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return UserSessionResponse(
        id=session.id,
        device_name=session.device_name,
        platform=session.platform,
        last_active=session.last_active,
        created_at=session.created_at,
        is_current=True,
    )


@router.delete("/me/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_user_session(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()
    return None
