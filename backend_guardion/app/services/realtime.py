"""
Push live location and alert updates to Redis and local WebSocket clients.
"""

from __future__ import annotations

import logging
from typing import Any

from app.config import settings
from app.redis_store import (
    cache_device_location,
    publish_alert_message,
    publish_location_message,
)
from app.websocket.manager import manager

logger = logging.getLogger(__name__)


async def push_location_update(device_id: str, location_data: dict[str, Any]) -> None:
    """Cache latest GPS, pub/sub for split workers, and broadcast to connected clients."""
    cache_device_location(device_id, location_data)
    publish_location_message(device_id, location_data)

    if settings.MQTT_ENABLED:
        await manager.broadcast_location(device_id, location_data)


async def push_alert_update(user_id: str, alert_data: dict[str, Any]) -> None:
    publish_alert_message(user_id, alert_data)

    if settings.MQTT_ENABLED:
        await manager.broadcast_alert(user_id, alert_data)
