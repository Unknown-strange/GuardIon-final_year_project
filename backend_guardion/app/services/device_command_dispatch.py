"""
Dispatch outbound device commands via local MQTT or Redis (API → mqtt_worker).
"""

from __future__ import annotations

import logging
from typing import Any

from app.config import settings
from app.mqtt.client import mqtt_client
from app.redis_store import is_redis_configured, publish_device_command

logger = logging.getLogger(__name__)


def device_command_topic(device_id: str) -> str:
    return f"guardion/devices/{device_id}/command"


def dispatch_device_command(
    device_id: str,
    payload: dict[str, Any],
    *,
    qos: int = 1,
) -> bool:
    """
    Publish a command to a device.

    - MQTT_ENABLED=true (monolith / API with MQTT): publish directly.
    - MQTT_ENABLED=false (split API): enqueue on Redis for mqtt_worker.
    """
    topic = device_command_topic(device_id)

    if settings.MQTT_ENABLED:
        if mqtt_client.publish(topic, payload, qos=qos):
            logger.info("Device command published to %s via local MQTT", device_id)
            return True
        logger.warning(
            "Device command publish failed for %s (mqtt_connected=%s)",
            device_id,
            mqtt_client.is_connected,
        )
        return False

    if not is_redis_configured():
        logger.error(
            "Cannot dispatch device command for %s: MQTT disabled and REDIS_URL not set",
            device_id,
        )
        return False

    if publish_device_command(device_id, payload, qos=qos):
        logger.info("Device command queued for %s via Redis", device_id)
        return True

    logger.warning("Device command Redis publish failed for %s", device_id)
    return False
