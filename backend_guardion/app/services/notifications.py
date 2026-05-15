"""
Notification Service
Handles creation and delivery of notifications to users
"""

import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.child import Child
from app.models.device import Device
from app.models.alert import Alert, AlertType
from app.models.notification import Notification

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
        
        # Create notification
        notification = Notification(
            user_id=child.user_id,
            alert_id=alert.id,
            type="alert",
            title=title,
            message=message,
            read=False
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        logger.info(f"[OK] Notification created for user {child.user_id}: {title}")
        
        # TODO: Send push notification via FCM/APNS
        # TODO: Send SMS if critical alert
        
        return notification
        
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
    
    elif alert.alert_type == AlertType.GEOFENCE_BREACH:
        return (
            f"Geofence Breach: {child_name}",
            f"{child_name} has left their designated safe zone. Current location is being tracked."
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
