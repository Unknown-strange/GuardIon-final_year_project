"""
WebSocket Endpoints
Real-time location and alert updates
"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.websocket.manager import manager
from app.database import SessionLocal
from app.models.user import User
from app.models.device import Device
from app.models.child import Child
from app.utils.security import decode_token

router = APIRouter()
logger = logging.getLogger(__name__)


def authenticate_websocket(token: str, db: Session) -> Optional[User]:
    """
    Authenticate WebSocket connection via JWT token
    
    Args:
        token: JWT access token
        db: Database session
        
    Returns:
        User object if authenticated, None otherwise
    """
    try:
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = db.query(User).filter(User.id == user_id).first()
        return user
        
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        return None


@router.websocket("/ws/location/{device_id}")
async def websocket_location_endpoint(
    websocket: WebSocket,
    device_id: str,
    token: str = Query(..., description="JWT access token")
):
    """
    WebSocket endpoint for real-time location updates
    
    Usage from mobile app:
    ```javascript
    const ws = new WebSocket(`ws://api.com/ws/location/ESP32-PROD001?token=${accessToken}`);
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // data.type === "location_update"
        // data.data.latitude, data.data.longitude, etc.
        // Update map marker position
    };
    ```
    """
    db = SessionLocal()
    
    try:
        # Authenticate user
        user = authenticate_websocket(token, db)
        
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(f"Unauthorized WebSocket connection attempt for device {device_id}")
            return
        
        # Verify user has access to this device
        device = db.query(Device).filter(Device.device_id == device_id).first()
        
        if not device:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(f"Device {device_id} not found")
            return
        
        # Check if device belongs to one of user's children
        child = db.query(Child).filter(
            Child.id == device.child_id,
            Child.user_id == user.id
        ).first()
        
        if not child:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(f"User {user.id} does not have access to device {device_id}")
            return
        
        # Connect WebSocket
        await manager.connect_location(device_id, websocket)
        
        # Send initial connection success message
        await manager.send_personal_message(websocket, {
            "type": "connected",
            "message": f"Connected to location updates for device {device_id}"
        })
        
        # Keep connection alive
        try:
            while True:
                # Wait for messages from client (e.g., ping/pong)
                data = await websocket.receive_text()
                
                # Echo back (heartbeat)
                if data == "ping":
                    await manager.send_personal_message(websocket, {
                        "type": "pong"
                    })
                    
        except WebSocketDisconnect:
            manager.disconnect_location(device_id, websocket)
            
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
        manager.disconnect_location(device_id, websocket)
        
    finally:
        db.close()


@router.websocket("/ws/alerts/{user_id}")
async def websocket_alerts_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(..., description="JWT access token")
):
    """
    WebSocket endpoint for real-time alert notifications
    
    Usage from mobile app:
    ```javascript
    const ws = new WebSocket(`ws://api.com/ws/alerts/${userId}?token=${accessToken}`);
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // data.type === "alert"
        // data.data.alert_type, data.data.location_lat, etc.
        // Show push notification or alert banner
    };
    ```
    """
    db = SessionLocal()
    
    try:
        # Authenticate user
        user = authenticate_websocket(token, db)
        
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(f"Unauthorized WebSocket connection attempt for user {user_id}")
            return
        
        # Verify user is requesting their own alerts
        if str(user.id) != user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(f"User {user.id} attempted to connect to alerts for user {user_id}")
            return
        
        # Connect WebSocket
        await manager.connect_alerts(user_id, websocket)
        
        # Send initial connection success message
        await manager.send_personal_message(websocket, {
            "type": "connected",
            "message": f"Connected to alert notifications for user {user_id}"
        })
        
        # Keep connection alive
        try:
            while True:
                # Wait for messages from client (e.g., ping/pong)
                data = await websocket.receive_text()
                
                # Echo back (heartbeat)
                if data == "ping":
                    await manager.send_personal_message(websocket, {
                        "type": "pong"
                    })
                    
        except WebSocketDisconnect:
            manager.disconnect_alerts(user_id, websocket)
            
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
        manager.disconnect_alerts(user_id, websocket)
        
    finally:
        db.close()
