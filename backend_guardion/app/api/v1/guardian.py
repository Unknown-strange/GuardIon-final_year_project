"""
Guardian dashboard endpoints — batched reads to reduce DB pool pressure.
"""

import logging
import time

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List

from app.api.child_access import accessible_child_ids
from app.api.deps import get_current_active_user, get_db
from app.models.child import Child
from app.models.device import Device
from app.models.user import User
from app.schemas.child import ChildResponse
from app.schemas.device import DeviceResponse

logger = logging.getLogger(__name__)

router = APIRouter()


class GuardianHomeResponse(BaseModel):
    children: List[ChildResponse]
    devices: List[DeviceResponse]


@router.get("/home", response_model=GuardianHomeResponse)
def guardian_home(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Return children and devices in one request (single DB session).
    """
    started = time.perf_counter()
    child_ids = accessible_child_ids(current_user, db)
    children: list[Child] = []
    devices: list[Device] = []

    if child_ids:
        children = db.query(Child).filter(Child.id.in_(child_ids)).all()
        devices = db.query(Device).filter(Device.child_id.in_(child_ids)).all()

    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "[OK] GET /guardian/home user=%s children=%d devices=%d in %.0fms",
        current_user.id,
        len(children),
        len(devices),
        elapsed_ms,
    )
    return GuardianHomeResponse(children=children, devices=devices)
