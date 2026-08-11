"""
Redis cache and pub/sub for live device locations and cross-service WebSocket fan-out.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Optional

import redis
from redis.asyncio import Redis as AsyncRedis

from app.config import settings

logger = logging.getLogger(__name__)

LOCATION_KEY_PREFIX = "guardion:device:"
LOCATION_CHANNEL = "guardion:location"
ALERT_CHANNEL = "guardion:alert"
COMMAND_CHANNEL = "guardion:device_command"
LOCATION_TTL_SEC = 86_400

_sync_client: Optional[redis.Redis] = None
_async_client: Optional[AsyncRedis] = None
_redis_checked = False
_redis_ok = False


def _redis_url() -> str:
    return (settings.REDIS_URL or "").strip()


def is_redis_configured() -> bool:
    return bool(_redis_url())


def get_sync_redis() -> Optional[redis.Redis]:
    """Lazy sync client; returns None when Redis is unavailable."""
    global _sync_client, _redis_checked, _redis_ok

    if not is_redis_configured():
        return None

    if _sync_client is not None:
        return _sync_client

    if _redis_checked and not _redis_ok:
        return None

    try:
        client = redis.from_url(
            _redis_url(),
            decode_responses=True,
            socket_connect_timeout=3,
            socket_timeout=3,
        )
        client.ping()
        _sync_client = client
        _redis_ok = True
        logger.info("[OK] Redis connected (sync)")
        return _sync_client
    except Exception as exc:
        _redis_checked = True
        _redis_ok = False
        logger.warning("Redis unavailable (sync): %s", exc)
        return None


async def get_async_redis() -> Optional[AsyncRedis]:
    """Lazy async client for pub/sub subscriber."""
    global _async_client, _redis_checked, _redis_ok

    if not is_redis_configured():
        return None

    if _async_client is not None:
        return _async_client

    if _redis_checked and not _redis_ok and _sync_client is None:
        return None

    try:
        client = AsyncRedis.from_url(
            _redis_url(),
            decode_responses=True,
            socket_connect_timeout=3,
            socket_timeout=3,
        )
        await client.ping()
        _async_client = client
        _redis_ok = True
        logger.info("[OK] Redis connected (async)")
        return _async_client
    except Exception as exc:
        logger.warning("Redis unavailable (async): %s", exc)
        return None


def redis_ping() -> bool:
    client = get_sync_redis()
    if not client:
        return False
    try:
        return bool(client.ping())
    except Exception:
        return False


def _location_key(device_id: str) -> str:
    return f"{LOCATION_KEY_PREFIX}{device_id}:location"


def cache_device_location(device_id: str, payload: dict[str, Any]) -> None:
    client = get_sync_redis()
    if not client:
        return
    try:
        client.setex(_location_key(device_id), LOCATION_TTL_SEC, json.dumps(payload))
    except Exception as exc:
        logger.warning("Redis cache write failed for %s: %s", device_id, exc)


def get_cached_device_location(device_id: str) -> Optional[dict[str, Any]]:
    client = get_sync_redis()
    if not client:
        return None
    try:
        raw = client.get(_location_key(device_id))
        if not raw:
            return None
        return json.loads(raw)
    except Exception as exc:
        logger.warning("Redis cache read failed for %s: %s", device_id, exc)
        return None


def publish_location_message(device_id: str, payload: dict[str, Any]) -> None:
    client = get_sync_redis()
    if not client:
        return
    try:
        client.publish(
            LOCATION_CHANNEL,
            json.dumps({"device_id": device_id, "data": payload}),
        )
    except Exception as exc:
        logger.warning("Redis location publish failed for %s: %s", device_id, exc)


def publish_alert_message(user_id: str, payload: dict[str, Any]) -> None:
    client = get_sync_redis()
    if not client:
        return
    try:
        client.publish(
            ALERT_CHANNEL,
            json.dumps({"user_id": user_id, "data": payload}),
        )
    except Exception as exc:
        logger.warning("Redis alert publish failed for user %s: %s", user_id, exc)


def publish_device_command(
    device_id: str,
    payload: dict[str, Any],
    *,
    qos: int = 1,
) -> bool:
    """Enqueue an outbound MQTT device command for mqtt_worker (API → worker)."""
    client = get_sync_redis()
    if not client:
        return False

    topic = f"guardion/devices/{device_id}/command"
    try:
        receivers = client.publish(
            COMMAND_CHANNEL,
            json.dumps(
                {
                    "device_id": device_id,
                    "topic": topic,
                    "payload": payload,
                    "qos": qos,
                }
            ),
        )
        if receivers and receivers > 0:
            logger.info(
                "Redis device command published for %s (%s subscriber(s))",
                device_id,
                receivers,
            )
            return True

        logger.warning(
            "Redis device command published for %s but no mqtt_worker subscribed",
            device_id,
        )
        return False
    except Exception as exc:
        logger.warning("Redis device command publish failed for %s: %s", device_id, exc)
        return False


def parse_cached_timestamp(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.utcnow()


async def close_async_redis() -> None:
    global _async_client
    if _async_client is not None:
        await _async_client.aclose()
        _async_client = None
