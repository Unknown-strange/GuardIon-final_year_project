"""
Missing child alert notifications and broadcasts.
"""

import json
import logging
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.api.child_access import guardian_user_ids_for_child
from app.models.alert import Alert, AlertType
from app.models.child import Child
from app.models.device import Device
from app.models.notification import Notification
from app.models.user import User
from app.services.push import send_push_to_user
from app.websocket.manager import manager

logger = logging.getLogger(__name__)


def _notification_payload(
    *,
    alert: Alert,
    child: Child,
    reporter: User,
    notes: Optional[str],
    last_seen_description: Optional[str],
) -> dict:
    return {
        "alert_id": str(alert.id),
        "child_id": str(child.id),
        "child_name": child.name,
        "image_url": child.profile_photo,
        "reporter_name": reporter.name,
        "notes": notes,
        "last_seen_description": last_seen_description,
        "location_lat": alert.location_lat,
        "location_lng": alert.location_lng,
    }


def create_missing_child_notifications(
    *,
    alert: Alert,
    child: Child,
    reporter: User,
    device: Optional[Device],
    notes: Optional[str],
    last_seen_description: Optional[str],
    db: Session,
) -> int:
    payload = _notification_payload(
        alert=alert,
        child=child,
        reporter=reporter,
        notes=notes,
        last_seen_description=last_seen_description,
    )
    title = f"Missing: {child.name}"
    display_body = f"{reporter.name} reported {child.name} as missing"
    message = json.dumps(payload)

    guardian_ids = guardian_user_ids_for_child(child.id, db)
    notifications: List[Notification] = []

    for user_id_str in guardian_ids:
        user_id = UUID(user_id_str)
        notification = Notification(
            user_id=user_id,
            alert_id=alert.id,
            type="child_missing",
            title=title,
            message=message,
            read=False,
        )
        db.add(notification)
        notifications.append(notification)

    db.commit()

    for user_id_str in guardian_ids:
        send_push_to_user(
            UUID(user_id_str),
            title=title,
            body=display_body,
            data={
                "type": "child_missing",
                "alert_id": str(alert.id),
                "child_id": str(child.id),
                "image_url": child.profile_photo or "",
            },
            image_url=child.profile_photo,
            db=db,
            alert_type=AlertType.CHILD_MISSING,
        )

    logger.info(
        "[OK] Missing child notifications for %s sent to %s guardian(s)",
        child.id,
        len(guardian_ids),
    )
    return len(notifications)


async def broadcast_missing_child_alert(
    *,
    alert: Alert,
    child: Child,
    reporter: User,
    device: Optional[Device],
    notes: Optional[str],
    db: Session,
) -> None:
    guardian_ids = guardian_user_ids_for_child(child.id, db)
    device_id = device.device_id if device else None
    ws_payload = {
        "alert_id": str(alert.id),
        "alert_type": AlertType.CHILD_MISSING.value,
        "child_id": str(child.id),
        "child_name": child.name,
        "device_id": device_id,
        "location_lat": alert.location_lat,
        "location_lng": alert.location_lng,
        "status": alert.status.value,
        "image_url": child.profile_photo,
        "reporter_name": reporter.name,
        "notes": notes,
        "created_at": alert.created_at.isoformat(),
    }

    for user_id_str in guardian_ids:
        await manager.broadcast_alert(user_id_str, ws_payload)


def notify_child_found(
    *,
    alert: Alert,
    child: Child,
    resolver: User,
    db: Session,
) -> int:
    title = f"Found: {child.name}"
    body = f"{resolver.name} marked {child.name} as found and safe"
    guardian_ids = guardian_user_ids_for_child(child.id, db)

    for user_id_str in guardian_ids:
        notification = Notification(
            user_id=UUID(user_id_str),
            alert_id=alert.id,
            type="info",
            title=title,
            message=body,
            read=False,
        )
        db.add(notification)
        send_push_to_user(
            UUID(user_id_str),
            title=title,
            body=body,
            data={
                "type": "child_found",
                "alert_id": str(alert.id),
                "child_id": str(child.id),
            },
            db=db,
        )

    db.commit()
    return len(guardian_ids)
