"""
Guardian invite notifications
"""

import json
import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.models.child import Child
from app.services.push import send_push_to_user

logger = logging.getLogger(__name__)


def create_guardian_invite_notification(
    *,
    invited_user: User,
    inviter: User,
    child: Child,
    guardian_link_id: UUID,
    db: Session,
) -> Notification:
    payload = {
        "guardian_id": str(guardian_link_id),
        "child_id": str(child.id),
        "child_name": child.name,
        "inviter_name": inviter.name,
    }
    title = "Co-guardian invite"
    message = json.dumps(payload)
    display_body = f"{inviter.name} invited you to co-guard {child.name}"

    notification = Notification(
        user_id=invited_user.id,
        alert_id=None,
        type="guardian_invite",
        title=title,
        message=message,
        read=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    send_push_to_user(
        invited_user.id,
        title=title,
        body=display_body,
        data={
            "type": "guardian_invite",
            "guardian_id": str(guardian_link_id),
            "child_id": str(child.id),
        },
        db=db,
    )

    logger.info(
        "[OK] Guardian invite notification sent to user %s for child %s",
        invited_user.id,
        child.id,
    )
    return notification
