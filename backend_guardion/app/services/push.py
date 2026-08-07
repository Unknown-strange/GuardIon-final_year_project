"""
Push notification delivery via Expo Push API (and optional FCM legacy key).
"""

import logging
from typing import Iterable, Optional

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.push_token import PushToken
from app.models.notification_preference import NotificationPreference
from app.models.alert import Alert, AlertType

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

ZONE_ALERT_SOUND = "beep-beep.mp3"
SAFE_ARRIVAL_SOUND = "mixkit-happy-bell-alert-601.wav"
DANGER_ALERT_SOUND = "mixkit-system-beep-buzzer-fail-2964.wav"

CRITICAL_ALERT_TYPES = (
    AlertType.SOS,
    AlertType.GEOFENCE_BREACH,
    AlertType.DANGER_ZONE_ENTRY,
)


def _push_sound_for(alert_type: AlertType | None) -> str:
    if alert_type == AlertType.SAFE_ZONE_ENTRY:
        return SAFE_ARRIVAL_SOUND
    if alert_type in CRITICAL_ALERT_TYPES:
        return DANGER_ALERT_SOUND
    if alert_type == AlertType.CHECK_IN_SAFE:
        return ZONE_ALERT_SOUND
    return "default"


def _push_channel_for(alert_type: AlertType | None) -> Optional[str]:
    """Android routes sound through the channel, so it must match the app's channels."""
    if alert_type == AlertType.SAFE_ZONE_ENTRY:
        return "safe-arrivals"
    if alert_type in CRITICAL_ALERT_TYPES:
        return "critical-alerts"
    if alert_type == AlertType.CHECK_IN_SAFE:
        return "safety-alerts"
    return None


def _preference_allows(alert_type: AlertType, prefs: Optional[NotificationPreference]) -> bool:
    if not prefs:
        return True

    if alert_type == AlertType.SOS:
        return prefs.sos_enabled
    if alert_type == AlertType.GEOFENCE_BREACH:
        return prefs.geofence_enabled
    if alert_type == AlertType.DANGER_ZONE_ENTRY:
        return prefs.geofence_enabled
    if alert_type == AlertType.SAFE_ZONE_ENTRY:
        return prefs.geofence_enabled
    if alert_type == AlertType.LOW_BATTERY:
        return prefs.battery_enabled
    if alert_type == AlertType.CHILD_MISSING:
        return getattr(prefs, "missing_child_enabled", True)
    return True


def send_push_to_user(
    user_id,
    title: str,
    body: str,
    data: Optional[dict] = None,
    db: Optional[Session] = None,
    alert_type: Optional[AlertType] = None,
    image_url: Optional[str] = None,
) -> int:
    """
    Send push notifications to all registered tokens for a user.
    Returns count of messages accepted by Expo.
    """
    if not db:
        return 0

    if alert_type:
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()
        if not _preference_allows(alert_type, prefs):
            logger.info(f"Push skipped for user {user_id} due to notification preferences")
            return 0

    tokens = db.query(PushToken).filter(PushToken.user_id == user_id).all()
    if not tokens:
        return 0

    channel_id = _push_channel_for(alert_type)

    messages = []
    for t in tokens:
        message = {
            "to": t.token,
            "title": title,
            "body": body,
            "sound": _push_sound_for(alert_type),
            "data": {**(data or {}), **({"image_url": image_url} if image_url else {})},
        }
        if channel_id:
            message["channelId"] = channel_id
        if image_url:
            message["mutableContent"] = True
        messages.append(message)

    return _send_expo_messages(messages)


def _send_expo_messages(messages: Iterable[dict]) -> int:
    batch = list(messages)
    if not batch:
        return 0

    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if settings.EXPO_PUSH_ACCESS_TOKEN:
        headers["Authorization"] = f"Bearer {settings.EXPO_PUSH_ACCESS_TOKEN}"

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(EXPO_PUSH_URL, json=batch, headers=headers)
            response.raise_for_status()
            payload = response.json()
            tickets = payload.get("data", [])
            sent = sum(1 for ticket in tickets if ticket.get("status") == "ok")
            logger.info(f"[OK] Expo push sent: {sent}/{len(batch)}")
            return sent
    except Exception as e:
        logger.exception(f"Expo push failed: {e}")
        return 0
