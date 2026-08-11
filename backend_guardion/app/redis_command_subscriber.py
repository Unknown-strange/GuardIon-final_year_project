"""
Subscribe to Redis device-command channel and publish to MQTT (mqtt_worker only).
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any, Optional

from app.mqtt.client import mqtt_client
from app.redis_store import COMMAND_CHANNEL, get_async_redis

logger = logging.getLogger(__name__)

MQTT_PUBLISH_ATTEMPTS = 4
MQTT_PUBLISH_RETRY_SEC = 2.0

_subscriber_task: Optional[asyncio.Task] = None


def _publish_with_retry(topic: str, payload: dict[str, Any], qos: int) -> bool:
    for attempt in range(1, MQTT_PUBLISH_ATTEMPTS + 1):
        if mqtt_client.publish(topic, payload, qos=qos):
            logger.info(
                "Redis command published to MQTT %s (attempt %s/%s)",
                topic,
                attempt,
                MQTT_PUBLISH_ATTEMPTS,
            )
            return True
        logger.warning(
            "Redis command MQTT publish failed for %s (attempt %s/%s, connected=%s)",
            topic,
            attempt,
            MQTT_PUBLISH_ATTEMPTS,
            mqtt_client.is_connected,
        )
        if attempt < MQTT_PUBLISH_ATTEMPTS:
            time.sleep(MQTT_PUBLISH_RETRY_SEC)
    return False


async def _listen_loop() -> None:
    client = await get_async_redis()
    if not client:
        logger.warning("Redis command subscriber not started — Redis unavailable")
        return

    pubsub = client.pubsub()
    await pubsub.subscribe(COMMAND_CHANNEL)
    logger.info("[OK] Redis command subscriber listening on %s", COMMAND_CHANNEL)

    try:
        async for message in pubsub.listen():
            if message is None or message.get("type") != "message":
                continue

            raw = message.get("data")
            if not raw:
                continue

            try:
                envelope = json.loads(raw)
            except json.JSONDecodeError:
                logger.warning("Invalid Redis command payload (not JSON)")
                continue

            device_id = envelope.get("device_id")
            topic = envelope.get("topic")
            payload = envelope.get("payload")
            qos = int(envelope.get("qos", 1))

            if not device_id or not isinstance(payload, dict):
                logger.warning("Redis command missing device_id or payload: %s", envelope)
                continue

            if not topic:
                topic = f"guardion/devices/{device_id}/command"

            await asyncio.to_thread(_publish_with_retry, topic, payload, qos)
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        logger.exception("Redis command subscriber error: %s", exc)
    finally:
        try:
            await pubsub.unsubscribe(COMMAND_CHANNEL)
            await pubsub.close()
        except Exception:
            pass


def start_redis_command_subscriber() -> Optional[asyncio.Task]:
    global _subscriber_task
    if _subscriber_task and not _subscriber_task.done():
        return _subscriber_task
    _subscriber_task = asyncio.create_task(_listen_loop())
    return _subscriber_task


async def stop_redis_command_subscriber() -> None:
    global _subscriber_task
    if _subscriber_task and not _subscriber_task.done():
        _subscriber_task.cancel()
        try:
            await _subscriber_task
        except asyncio.CancelledError:
            pass
    _subscriber_task = None
