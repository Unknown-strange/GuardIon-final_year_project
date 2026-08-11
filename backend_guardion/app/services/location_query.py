"""
Resolve the latest device location from Redis cache or Postgres fallback.
"""

from __future__ import annotations

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.location import LocationHistory
from app.redis_store import get_cached_device_location, parse_cached_timestamp
from app.schemas.location import CurrentLocationResponse


def current_location_for_device(device: Device, db: Session) -> CurrentLocationResponse | None:
    cached = get_cached_device_location(device.device_id)
    if cached and cached.get("latitude") is not None and cached.get("longitude") is not None:
        return CurrentLocationResponse(
            latitude=float(cached["latitude"]),
            longitude=float(cached["longitude"]),
            accuracy=cached.get("accuracy"),
            speed=cached.get("speed"),
            timestamp=parse_cached_timestamp(cached.get("timestamp")),
            battery_level=cached.get("battery_level"),
        )

    location = (
        db.query(LocationHistory)
        .filter(LocationHistory.device_id == device.id)
        .order_by(desc(LocationHistory.timestamp))
        .first()
    )
    if not location:
        return None

    return CurrentLocationResponse(
        latitude=location.latitude,
        longitude=location.longitude,
        accuracy=location.accuracy,
        speed=location.speed,
        timestamp=location.timestamp,
        battery_level=location.battery_level,
    )
