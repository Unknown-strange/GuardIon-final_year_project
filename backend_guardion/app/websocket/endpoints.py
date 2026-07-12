"""
WebSocket Endpoints
Real-time location and alert updates
"""

import logging
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import ExpiredSignatureError, JWTError, jwt
from sqlalchemy import desc
from sqlalchemy.orm import Session
from typing import Optional

from app.websocket.manager import manager
from app.database import SessionLocal
from app.models.user import User
from app.models.device import Device
from app.api.child_access import user_can_access_child
from app.models.location import LocationHistory
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


def authenticate_websocket(token: str, db: Session) -> Optional[User]:
    """Authenticate WebSocket connection via JWT token."""
    try:
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except ExpiredSignatureError:
            logger.warning("WebSocket authentication failed: access token expired")
            return None
        except JWTError:
            logger.warning("WebSocket authentication failed: invalid access token")
            return None

        if payload.get("type") != "access":
            logger.warning("WebSocket authentication failed: token is not an access token")
            return None

        user_id = payload.get("sub")
        if not user_id:
            logger.warning("WebSocket authentication failed: token missing subject")
            return None

        user = db.query(User).filter(User.id == UUID(str(user_id))).first()
        if not user:
            logger.warning(f"WebSocket authentication failed: user {user_id} not found")
            return None

        return user

    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        return None


def _authorize_device_access(db: Session, user: User, device_id: str) -> bool:
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        logger.warning(f"Device {device_id} not found")
        return False

    if not user_can_access_child(user, device.child_id, db):
        logger.warning(f"User {user.id} does not have access to device {device_id}")
        return False

    return True


def _latest_location_payload(db: Session, device_id: str) -> Optional[dict]:
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        return None

    location = (
        db.query(LocationHistory)
        .filter(LocationHistory.device_id == device.id)
        .order_by(desc(LocationHistory.timestamp))
        .first()
    )
    if not location:
        return None

    return {
        "latitude": location.latitude,
        "longitude": location.longitude,
        "accuracy": location.accuracy,
        "altitude": location.altitude,
        "speed": location.speed,
        "battery_level": location.battery_level,
        "timestamp": location.timestamp.isoformat(),
    }


@router.websocket("/ws/location/{device_id}")
async def websocket_location_endpoint(
    websocket: WebSocket,
    device_id: str,
    token: str = Query(..., description="JWT access token"),
):
    """WebSocket endpoint for real-time location updates."""
    db = SessionLocal()
    latest_location: Optional[dict] = None

    try:
        user = authenticate_websocket(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(f"Unauthorized WebSocket connection attempt for device {device_id}")
            return

        if not _authorize_device_access(db, user, device_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        latest_location = _latest_location_payload(db, device_id)
    finally:
        db.close()

    try:
        await manager.connect_location(device_id, websocket)

        await manager.send_personal_message(websocket, {
            "type": "connected",
            "message": f"Connected to location updates for device {device_id}",
        })

        if latest_location:
            await manager.send_personal_message(websocket, {
                "type": "location_update",
                "device_id": device_id,
                "data": latest_location,
            })

        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await manager.send_personal_message(websocket, {"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect_location(device_id, websocket)
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
        manager.disconnect_location(device_id, websocket)


@router.websocket("/ws/alerts/{user_id}")
async def websocket_alerts_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(..., description="JWT access token"),
):
    """WebSocket endpoint for real-time alert notifications."""
    db = SessionLocal()

    try:
        user = authenticate_websocket(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(f"Unauthorized WebSocket connection attempt for user {user_id}")
            return

        if str(user.id) != user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(f"User {user.id} attempted to connect to alerts for user {user_id}")
            return
    finally:
        db.close()

    try:
        await manager.connect_alerts(user_id, websocket)

        await manager.send_personal_message(websocket, {
            "type": "connected",
            "message": f"Connected to alert notifications for user {user_id}",
        })

        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await manager.send_personal_message(websocket, {"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect_alerts(user_id, websocket)
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
        manager.disconnect_alerts(user_id, websocket)
