"""
Notification Service
Handles creation and delivery of notifications to users
"""

import logging
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.child import Child
from app.models.device import Device
from app.models.alert import Alert, AlertType
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference
from app.services.push import send_push_to_user
from app.api.child_access import guardian_user_ids_for_child

logger = logging.getLogger(__name__)


def create_notification_for_alert(
    alert: Alert,
    db: Session
) -> Optional[Notification]:
    """
    Create a notification for an alert
    Sends to the parent/guardian of the child
    
    Args:
        alert: Alert object
        db: Database session
        
    Returns:
        Notification object if created, None otherwise
    """
    try:
        # Get child to find parent user
        child = db.query(Child).filter(Child.id == alert.child_id).first()
        
        if not child:
            logger.error(f"Child not found for alert {alert.id}")
            return None
        
        # Get device for more info
        device = db.query(Device).filter(Device.id == alert.device_id).first()
        
        # Create notification message based on alert type
        title, message = _get_notification_content(alert, child, device)

        guardian_ids = guardian_user_ids_for_child(child.id, db)
        notifications: List[Notification] = []
        for user_id_str in guardian_ids:
            notification = Notification(
                user_id=UUID(user_id_str),
                alert_id=alert.id,
                type="alert",
                title=title,
                message=message,
                read=False,
            )
            db.add(notification)
            notifications.append(notification)

        db.commit()
        if notifications:
            db.refresh(notifications[0])

        logger.info(
            f"[OK] Notification created for {len(notifications)} guardian(s): {title}"
        )

        for user_id_str in guardian_ids:
            send_push_to_user(
                UUID(user_id_str),
                title=title,
                body=message,
                data={"alert_id": str(alert.id), "alert_type": alert.alert_type.value},
                db=db,
                alert_type=alert.alert_type,
            )

        return notifications[0] if notifications else None
        
    except Exception as e:
        logger.exception(f"Error creating notification: {e}")
        return None


def _get_notification_content(
    alert: Alert,
    child: Child,
    device: Optional[Device]
) -> tuple[str, str]:
    """
    Generate notification title and message based on alert type
    
    Returns:
        Tuple of (title, message)
    """
    child_name = child.name
    device_name = device.device_id if device else "Unknown Device"
    
    if alert.alert_type == AlertType.SOS:
        return (
            f"SOS Alert from {child_name}",
            f"{child_name} has triggered an SOS alert. Please check their location immediately."
        )

    elif alert.alert_type == AlertType.CHECK_IN_SAFE:
        return (
            f"Safe check-in: {child_name}",
            f"{child_name}'s device sent a voluntary safe check-in. No emergency is indicated.",
        )

    elif alert.alert_type == AlertType.GEOFENCE_BREACH:
        return (
            f"Geofence Breach: {child_name}",
            f"{child_name} has left their designated safe zone. Current location is being tracked."
        )

    elif alert.alert_type == AlertType.DANGER_ZONE_ENTRY:
        zone = alert.zone_name or "a danger zone"
        return (
            f"Danger Zone Alert: {child_name}",
            f'{child_name} has entered danger zone "{zone}". Check their location immediately.',
        )
    
    elif alert.alert_type == AlertType.LOW_BATTERY:
        return (
            f"Low Battery: {child_name}'s Device",
            f"The device worn by {child_name} has low battery. Please charge it soon."
        )
    
    elif alert.alert_type == AlertType.DEVICE_OFFLINE:
        return (
            f"Device Offline: {child_name}",
            f"{child_name}'s device ({device_name}) is offline and not sending location updates."
        )
    
    elif alert.alert_type == AlertType.DEVICE_TAMPER:
        return (
            f"Device Tamper Alert: {child_name}",
            f"Possible tampering detected on {child_name}'s device. Please verify device status."
        )

    elif alert.alert_type == AlertType.CHILD_MISSING:
        return (
            f"Missing Child: {child_name}",
            f"A guardian reported {child_name} as missing. Please check the app immediately.",
        )
    
    else:
        return (
            f"Alert: {child_name}",
            f"An alert has been triggered for {child_name}. Please check the app for details."
        )


def mark_notifications_read(
    user_id,
    notification_ids: list,
    db: Session
) -> int:
    """
    Mark multiple notifications as read
    
    Returns:
        Number of notifications marked as read
    """
    try:
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.id.in_(notification_ids)
        ).update({"read": True}, synchronize_session=False)
        
        db.commit()
        return count
        
    except Exception as e:
        logger.exception(f"Error marking notifications as read: {e}")
        return 0
