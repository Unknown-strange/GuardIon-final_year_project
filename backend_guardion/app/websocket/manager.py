"""
WebSocket Connection Manager
Manages WebSocket connections for real-time updates
"""

import logging
from typing import Dict, Set
from fastapi import WebSocket
from uuid import UUID

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time updates
    """
    
    def __init__(self):
        # Map of device_id -> set of WebSocket connections
        self.location_connections: Dict[str, Set[WebSocket]] = {}
        
        # Map of user_id -> set of WebSocket connections
        self.alert_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect_location(self, device_id: str, websocket: WebSocket):
        """
        Connect a WebSocket for location updates
        """
        await websocket.accept()
        
        if device_id not in self.location_connections:
            self.location_connections[device_id] = set()
        
        self.location_connections[device_id].add(websocket)
        logger.info(f"[OK] WebSocket connected for location tracking: {device_id}")
    
    def disconnect_location(self, device_id: str, websocket: WebSocket):
        """
        Disconnect a WebSocket from location updates
        """
        if device_id in self.location_connections:
            self.location_connections[device_id].discard(websocket)
            
            if not self.location_connections[device_id]:
                del self.location_connections[device_id]
        
        logger.info(f"[OK] WebSocket disconnected from location tracking: {device_id}")
    
    async def connect_alerts(self, user_id: str, websocket: WebSocket):
        """
        Connect a WebSocket for alert notifications
        """
        await websocket.accept()
        
        if user_id not in self.alert_connections:
            self.alert_connections[user_id] = set()
        
        self.alert_connections[user_id].add(websocket)
        logger.info(f"[OK] WebSocket connected for alerts: user {user_id}")
    
    def disconnect_alerts(self, user_id: str, websocket: WebSocket):
        """
        Disconnect a WebSocket from alert notifications
        """
        if user_id in self.alert_connections:
            self.alert_connections[user_id].discard(websocket)
            
            if not self.alert_connections[user_id]:
                del self.alert_connections[user_id]
        
        logger.info(f"[OK] WebSocket disconnected from alerts: user {user_id}")
    
    async def broadcast_location(self, device_id: str, location_data: dict):
        """
        Broadcast location update to all connected clients for a device
        
        Args:
            device_id: Device identifier
            location_data: Location data to broadcast
        """
        if device_id not in self.location_connections:
            return
        
        # Get all connections for this device
        connections = list(self.location_connections[device_id])
        
        # Broadcast to all connections
        disconnected = []
        for connection in connections:
            try:
                await connection.send_json({
                    "type": "location_update",
                    "device_id": device_id,
                    "data": location_data
                })
            except Exception as e:
                logger.error(f"Error broadcasting location to WebSocket: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect_location(device_id, connection)
        
        if connections:
            logger.debug(
                "Broadcasted location update for %s to %s client(s)",
                device_id,
                len(connections),
            )
    
    async def broadcast_alert(self, user_id: str, alert_data: dict):
        """
        Broadcast alert to all connected clients for a user
        
        Args:
            user_id: User identifier
            alert_data: Alert data to broadcast
        """
        if user_id not in self.alert_connections:
            return
        
        # Get all connections for this user
        connections = list(self.alert_connections[user_id])
        
        # Broadcast to all connections
        disconnected = []
        for connection in connections:
            try:
                await connection.send_json({
                    "type": "alert",
                    "user_id": user_id,
                    "data": alert_data
                })
            except Exception as e:
                logger.error(f"Error broadcasting alert to WebSocket: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect_alerts(user_id, connection)
        
        if connections:
            logger.info(f"[OK] Broadcasted alert to user {user_id} ({len(connections)} client(s))")
    
    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """
        Send a message to a specific WebSocket connection
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")


# Global connection manager instance
manager = ConnectionManager()
