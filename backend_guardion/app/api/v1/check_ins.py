"""
Check-In API
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.api.deps import get_db, get_current_active_user, get_user_child
from app.api.child_access import user_can_access_child
from app.models.user import User
from app.models.child import Child
from app.models.device import Device, DeviceStatus
from app.models.check_in import CheckIn
from app.schemas.check_in import CheckInCreate, CheckInResponse, CheckInListResponse
from app.services.check_in_service import timeout_check_in, cancel_check_in
from app.mqtt.client import mqtt_client

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_user_check_in(
    check_in_id: UUID,
    current_user: User,
    db: Session,
) -> CheckIn:
    check_in = db.query(CheckIn).filter(CheckIn.id == check_in_id).first()
    if not check_in:
        logger.warning("Check-in %s not found in database", check_in_id)
        raise HTTPException(status_code=404, detail="Check-in not found")

    if not user_can_access_child(current_user, check_in.child_id, db):
        logger.warning(
            "Check-in %s denied for user %s (child %s)",
            check_in_id,
            current_user.id,
            check_in.child_id,
        )
        raise HTTPException(status_code=404, detail="Check-in not found")

    return check_in


@router.get("/", response_model=CheckInListResponse)
def list_check_ins(
    child_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(CheckIn).filter(CheckIn.user_id == current_user.id)
    if child_id:
        get_user_child(child_id, current_user, db)
        query = query.filter(CheckIn.child_id == child_id)

    check_ins = query.order_by(CheckIn.requested_at.desc()).limit(50).all()
    return CheckInListResponse(check_ins=check_ins)


@router.post("/", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
def request_check_in(
    payload: CheckInCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    get_user_child(payload.child_id, current_user, db)

    check_in = CheckIn(
        user_id=current_user.id,
        child_id=payload.child_id,
        status="pending",
    )
    db.add(check_in)
    db.commit()
    db.refresh(check_in)

    logger.info(
        "Check-in created id=%s child=%s user=%s",
        check_in.id,
        payload.child_id,
        current_user.id,
    )

    device = (
        db.query(Device)
        .filter(
            Device.child_id == payload.child_id,
            Device.status == DeviceStatus.ACTIVE,
        )
        .order_by(Device.last_seen.desc().nullslast())
        .first()
    )

    if device:
        published = mqtt_client.publish(
            f"guardion/devices/{device.device_id}/command",
            {
                "command": "check_in",
                "check_in_id": str(check_in.id),
                "child_id": str(payload.child_id),
                "timestamp": datetime.utcnow().isoformat() + "Z",
            },
            qos=1,
        )
        if not published:
            logger.warning(
                f"Check-in {check_in.id} created but MQTT command not published"
            )
    else:
        logger.warning(
            f"No active device linked to child {payload.child_id} for check-in command"
        )

    return check_in


@router.get("/child/{child_id}/latest", response_model=CheckInResponse)
def get_latest_check_in(
    child_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    get_user_child(child_id, current_user, db)

    check_in = (
        db.query(CheckIn)
        .filter(
            CheckIn.child_id == child_id,
            CheckIn.user_id == current_user.id,
        )
        .order_by(CheckIn.requested_at.desc())
        .first()
    )

    if not check_in:
        raise HTTPException(status_code=404, detail="No check-in found")

    return check_in


@router.get("/{check_in_id}", response_model=CheckInResponse)
def get_check_in(
    check_in_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _get_user_check_in(check_in_id, current_user, db)


@router.post("/{check_in_id}/timeout", response_model=CheckInResponse)
def mark_check_in_timeout(
    check_in_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mark a pending check-in as timed out when the device never responds."""
    check_in = _get_user_check_in(check_in_id, current_user, db)
    if check_in.status != "pending":
        return check_in
    return timeout_check_in(check_in, db)


@router.post("/{check_in_id}/cancel", response_model=CheckInResponse)
def cancel_check_in_request(
    check_in_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Parent cancelled a pending check-in before the device responded."""
    check_in = _get_user_check_in(check_in_id, current_user, db)
    if check_in.status != "pending":
        return check_in
    return cancel_check_in(check_in, db)
