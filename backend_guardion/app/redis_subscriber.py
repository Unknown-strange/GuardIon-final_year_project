"""
Subscribe to Redis pub/sub and forward events to local WebSocket connections.

Used when MQTT runs in a separate worker (MQTT_ENABLED=false on the API service).
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Optional

from app.redis_store import ALERT_CHANNEL, LOCATION_CHANNEL, get_async_redis
from app.websocket.manager import manager

logger = logging.getLogger(__name__)

_subscriber_task: Optional[asyncio.Task] = None


async def _listen_loop() -> None:
    client = await get_async_redis()
    if not client:
        logger.info("Redis subscriber not started — Redis unavailable")
        return

    pubsub = client.pubsub()
    await pubsub.subscribe(LOCATION_CHANNEL, ALERT_CHANNEL)
    logger.info(
        "[OK] Redis subscriber listening on %s, %s",
        LOCATION_CHANNEL,
        ALERT_CHANNEL,
    )

    try:
        async for message in pubsub.listen():
            if message is None or message.get("type") != "message":
                continue

            channel = message.get("channel")
            if isinstance(channel, bytes):
                channel = channel.decode()
            raw = message.get("data")
            if not raw:
                continue

            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if channel == LOCATION_CHANNEL:
                device_id = payload.get("device_id")
                data = payload.get("data")
                if device_id and isinstance(data, dict):
                    await manager.broadcast_location(device_id, data)
            elif channel == ALERT_CHANNEL:
                user_id = payload.get("user_id")
                data = payload.get("data")
                if user_id and isinstance(data, dict):
                    await manager.broadcast_alert(str(user_id), data)
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        logger.exception("Redis subscriber error: %s", exc)
    finally:
        try:
            await pubsub.unsubscribe(LOCATION_CHANNEL, ALERT_CHANNEL)
            await pubsub.close()
        except Exception:
            pass


def start_redis_subscriber() -> Optional[asyncio.Task]:
    global _subscriber_task
    if _subscriber_task and not _subscriber_task.done():
        return _subscriber_task
    _subscriber_task = asyncio.create_task(_listen_loop())
    return _subscriber_task


async def stop_redis_subscriber() -> None:
    global _subscriber_task
    if _subscriber_task and not _subscriber_task.done():
        _subscriber_task.cancel()
        try:
            await _subscriber_task
        except asyncio.CancelledError:
            pass
    _subscriber_task = None
