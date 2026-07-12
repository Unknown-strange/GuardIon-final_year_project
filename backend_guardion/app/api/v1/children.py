"""
Children Management API
Endpoints for managing child profiles
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_db, get_current_active_user, get_user_child, get_owned_child
from app.api.child_access import accessible_child_ids
from app.models.user import User
from app.models.child import Child
from app.models.device import Device
from app.models.location import LocationHistory
from app.models.alert import Alert, AlertType, AlertStatus
from app.schemas.child import ChildCreate, ChildUpdate, ChildResponse
from app.schemas.missing_child import ReportMissingChildRequest, ReportMissingChildResponse
from app.services.missing_child_alerts import (
    broadcast_missing_child_alert,
    create_missing_child_notifications,
)

router = APIRouter()

MISSING_ALERT_COOLDOWN_MINUTES = 30


def _is_https_url(value: Optional[str]) -> bool:
    return bool(value and value.lower().startswith("https://"))


@router.get("/owned", response_model=List[ChildResponse])
def list_owned_children(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Children owned by the current user (primary guardian only)."""
    children = db.query(Child).filter(Child.user_id == current_user.id).all()
    return children


@router.post("/", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
def create_child(
    child_data: ChildCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new child profile for the current user
    """
    db_child = Child(
        user_id=current_user.id,
        name=child_data.name,
        age=child_data.age,
        profile_photo=child_data.profile_photo
    )
    
    db.add(db_child)
    db.commit()
    db.refresh(db_child)
    
    return db_child


@router.get("/", response_model=List[ChildResponse])
def list_children(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all children the current user owns or co-guards
    """
    child_ids = accessible_child_ids(current_user, db)
    if not child_ids:
        return []
    children = db.query(Child).filter(Child.id.in_(child_ids)).all()
    return children


@router.get("/{child_id}", response_model=ChildResponse)
def get_child(
    child_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific child by ID
    """
    return get_user_child(child_id, current_user, db)


@router.post("/{child_id}/report-missing", response_model=ReportMissingChildResponse)
async def report_missing_child(
    child_id: UUID,
    payload: ReportMissingChildRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Primary guardian reports a child as missing and alerts all linked guardians."""
    child = get_owned_child(child_id, current_user, db)

    if not _is_https_url(child.profile_photo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Child must have a cloud profile photo before reporting missing",
        )

    cutoff = datetime.utcnow() - timedelta(minutes=MISSING_ALERT_COOLDOWN_MINUTES)
    existing = (
        db.query(Alert)
        .filter(
            Alert.child_id == child.id,
            Alert.alert_type == AlertType.CHILD_MISSING,
            Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
            Alert.created_at >= cutoff,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="A missing-child alert was already reported recently",
        )

    device = db.query(Device).filter(Device.child_id == child.id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No device linked to this child",
        )

    latitude = None
    longitude = None
    if payload.use_device_location:
        location = (
            db.query(LocationHistory)
            .filter(LocationHistory.device_id == device.id)
            .order_by(desc(LocationHistory.timestamp))
            .first()
        )
        if location:
            latitude = location.latitude
            longitude = location.longitude

    alert = Alert(
        child_id=child.id,
        device_id=device.id,
        alert_type=AlertType.CHILD_MISSING,
        location_lat=latitude,
        location_lng=longitude,
        status=AlertStatus.ACTIVE,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    notified = create_missing_child_notifications(
        alert=alert,
        child=child,
        reporter=current_user,
        device=device,
        notes=payload.notes,
        last_seen_description=payload.last_seen_description,
        db=db,
    )

    await broadcast_missing_child_alert(
        alert=alert,
        child=child,
        reporter=current_user,
        device=device,
        notes=payload.notes,
        db=db,
    )

    return ReportMissingChildResponse(alert=alert, guardians_notified=notified)


@router.patch("/{child_id}", response_model=ChildResponse)
def update_child(
    child_id: UUID,
    child_data: ChildUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a child's information
    """
    child = get_owned_child(child_id, current_user, db)
    
    update_data = child_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(child, field, value)
    
    db.commit()
    db.refresh(child)
    
    return child


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child(
    child_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a child profile (also deletes associated devices, alerts, etc.)
    """
    child = get_owned_child(child_id, current_user, db)
    
    db.delete(child)
    db.commit()
    
    return None
