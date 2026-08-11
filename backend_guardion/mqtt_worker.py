"""
Standalone MQTT worker for Railway / Render (separate from the HTTP API).

Set MQTT_ENABLED=true on this service and MQTT_ENABLED=false on the API service.
Both services share DATABASE_URL and REDIS_URL.
"""

from __future__ import annotations

import asyncio
import logging
import os

# Ensure worker mode before app imports read settings.
os.environ.setdefault("MQTT_ENABLED", "true")

from app.config import settings  # noqa: E402
from app.mqtt.client import mqtt_client  # noqa: E402
from app.mqtt.handlers import handle_mqtt_message  # noqa: E402
from app.redis_command_subscriber import (  # noqa: E402
    start_redis_command_subscriber,
    stop_redis_command_subscriber,
)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def run_worker() -> None:
    logger.info("[OK] Starting GuardIOn MQTT worker...")
    loop = asyncio.get_running_loop()
    mqtt_client.set_event_loop(loop)
    mqtt_client.set_message_handler(handle_mqtt_message)
    mqtt_client.connect()
    logger.info("[OK] MQTT worker connected to %s", settings.MQTT_BROKER_HOST)

    start_redis_command_subscriber()

    try:
        while True:
            await asyncio.sleep(3600)
    finally:
        await stop_redis_command_subscriber()
        mqtt_client.disconnect()
        logger.info("[OK] MQTT worker stopped")


if __name__ == "__main__":
    asyncio.run(run_worker())
