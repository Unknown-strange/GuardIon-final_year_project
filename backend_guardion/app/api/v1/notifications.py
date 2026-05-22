"""
Notifications API
Endpoints for managing user notifications
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.notification import Notification
from app.models.push_token import PushToken
from app.schemas.notification import (
    NotificationResponse,
    NotificationMarkRead,
    NotificationListResponse
)
from app.schemas.session import PushTokenRegister, PushTokenResponse

router = APIRouter()


@router.post("/register-token", response_model=PushTokenResponse, status_code=status.HTTP_201_CREATED)
def register_push_token(
    payload: PushTokenRegister,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Register Expo / FCM push token for the current user."""
    now = datetime.utcnow()
    existing = db.query(PushToken).filter(PushToken.token == payload.token).first()

    if existing:
        existing.user_id = current_user.id
        existing.platform = payload.platform
        existing.device_name = payload.device_name
        existing.last_active = now
        db.commit()
        db.refresh(existing)
        return existing

    token = PushToken(
        user_id=current_user.id,
        token=payload.token.strip(),
        platform=payload.platform,
        device_name=payload.device_name,
        last_active=now,
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


@router.get("/", response_model=NotificationListResponse)
def get_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get notifications for the current user
    """
    # Build query
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.read == False)
    
    # Get total counts
    total_count = query.count()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).count()
    
    # Get notifications
    notifications = query.order_by(desc(Notification.sent_at)).limit(limit).all()
    
    return NotificationListResponse(
        notifications=notifications,
        unread_count=unread_count,
        total_count=total_count
    )


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific notification
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return notification


@router.post("/mark-read", status_code=status.HTTP_200_OK)
def mark_notifications_as_read(
    notification_data: NotificationMarkRead,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark one or more notifications as read
    """
    # Update notifications
    updated_count = db.query(Notification).filter(
        Notification.id.in_(notification_data.notification_ids),
        Notification.user_id == current_user.id
    ).update({"read": True}, synchronize_session=False)
    
    db.commit()
    
    return {
        "status": "success",
        "updated_count": updated_count
    }


@router.post("/mark-all-read", status_code=status.HTTP_200_OK)
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications as read for the current user
    """
    updated_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True}, synchronize_session=False)
    
    db.commit()
    
    return {
        "status": "success",
        "updated_count": updated_count
    }


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a notification
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return None


@router.get("/unread/count")
def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get count of unread notifications (useful for notification badges)
    """
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).count()
    
    return {
        "unread_count": unread_count
    }
