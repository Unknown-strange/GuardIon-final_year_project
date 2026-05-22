"""Check-in service — device-confirmed wellness checks."""

import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.check_in import CheckIn
from app.models.device import Device
from app.services.geofencing import confirm_child_safe

logger = logging.getLogger(__name__)


def confirm_pending_check_ins_for_child(child_id: UUID, db: Session) -> int:
    """Confirm any parent-initiated check-ins waiting on the device."""
    now = datetime.utcnow()
    pending = (
        db.query(CheckIn)
        .filter(
            CheckIn.child_id == child_id,
            CheckIn.status == "pending",
        )
        .all()
    )
    for check_in in pending:
        check_in.status = "confirmed"
        check_in.confirmed_at = now
    if pending:
        logger.info(
            f"Confirmed {len(pending)} pending check-in(s) for child {child_id} "
            "via device safe check"
        )
    return len(pending)


def confirm_check_in_from_device(
    check_in_id: UUID,
    device: Device,
    db: Session,
) -> Optional[CheckIn]:
    """Mark a pending check-in confirmed after the child's device responds."""
    check_in = (
        db.query(CheckIn)
        .filter(
            CheckIn.id == check_in_id,
            CheckIn.child_id == device.child_id,
            CheckIn.status == "pending",
        )
        .first()
    )
    if not check_in:
        logger.warning(
            f"No pending check-in {check_in_id} for device {device.device_id}"
        )
        return None

    check_in.status = "confirmed"
    check_in.confirmed_at = datetime.utcnow()
    confirm_child_safe(
        check_in.child_id,
        db,
        resolution_note="Child confirmed safe via device check-in",
    )
    db.commit()
    db.refresh(check_in)

    logger.info(
        f"Check-in {check_in_id} confirmed by device {device.device_id}"
    )
    return check_in


def timeout_check_in(check_in: CheckIn, db: Session) -> CheckIn:
    """Parent-side timeout when the device never responded."""
    if check_in.status == "pending":
        check_in.status = "timeout"
        db.commit()
        db.refresh(check_in)
    return check_in
