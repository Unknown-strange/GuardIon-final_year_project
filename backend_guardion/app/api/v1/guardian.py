"""
Guardian dashboard endpoints — batched reads to reduce DB pool pressure.
"""

import logging
import time
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.child_access import accessible_child_ids
from app.api.deps import get_current_active_user, get_db
from app.models.child import Child
from app.models.device import Device
from app.models.user import User
from app.redis_store import get_cached_device_location
from app.schemas.child import ChildResponse
from app.schemas.device import DeviceResponse

logger = logging.getLogger(__name__)

router = APIRouter()


class LiveLocationItem(BaseModel):
    child_id: UUID
    device_id: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    battery_level: Optional[float] = None
    timestamp: Optional[str] = None


class GuardianHomeResponse(BaseModel):
    children: List[ChildResponse]
    devices: List[DeviceResponse]
    locations: List[LiveLocationItem] = []


class LiveLocationsResponse(BaseModel):
    locations: List[LiveLocationItem]


def _redis_locations(devices: list[Device]) -> list[LiveLocationItem]:
    items: list[LiveLocationItem] = []
    for device in devices:
        if not device.child_id:
            continue
        cached = get_cached_device_location(device.device_id)
        if not cached or cached.get("latitude") is None or cached.get("longitude") is None:
            continue
        ts = cached.get("timestamp")
        items.append(
            LiveLocationItem(
                child_id=device.child_id,
                device_id=device.device_id,
                latitude=float(cached["latitude"]),
                longitude=float(cached["longitude"]),
                accuracy=cached.get("accuracy"),
                speed=cached.get("speed"),
                battery_level=cached.get("battery_level"),
                timestamp=ts.isoformat() if hasattr(ts, "isoformat") else ts,
            )
        )
    return items


@router.get("/home", response_model=GuardianHomeResponse)
def guardian_home(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Return children, devices, and Redis-cached live GPS in one request.
    """
    started = time.perf_counter()
    child_ids = accessible_child_ids(current_user, db)
    children: list[Child] = []
    devices: list[Device] = []

    if child_ids:
        children = db.query(Child).filter(Child.id.in_(child_ids)).all()
        devices = db.query(Device).filter(Device.child_id.in_(child_ids)).all()

    locations = _redis_locations(devices)
    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "[OK] GET /guardian/home user=%s children=%d devices=%d locations=%d in %.0fms",
        current_user.id,
        len(children),
        len(devices),
        len(locations),
        elapsed_ms,
    )
    return GuardianHomeResponse(children=children, devices=devices, locations=locations)


@router.get("/live-locations", response_model=LiveLocationsResponse)
def live_locations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Redis-only GPS snapshot — no location_history query."""
    child_ids = accessible_child_ids(current_user, db)
    if not child_ids:
        return LiveLocationsResponse(locations=[])
    devices = db.query(Device).filter(Device.child_id.in_(child_ids)).all()
    return LiveLocationsResponse(locations=_redis_locations(devices))
