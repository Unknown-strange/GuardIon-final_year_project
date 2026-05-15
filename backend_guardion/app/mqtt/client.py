"""
MQTT Client for GuardIOn Backend
Connects to MQTT broker and subscribes to device messages
"""

import asyncio
import json
import logging
import threading
from typing import Optional
import paho.mqtt.client as mqtt
from app.config import settings

logger = logging.getLogger(__name__)


class MQTTClient:
    """
    MQTT client for subscribing to device messages
    """
    
    def __init__(self):
        self.client: Optional[mqtt.Client] = None
        self.is_connected = False
        self.message_handler = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        
    def set_message_handler(self, handler):
        """Set the message handler callback"""
        self.message_handler = handler
        
    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        """Set the asyncio event loop for scheduling async handlers"""
        self.loop = loop
        
    def connect(self):
        """Connect to MQTT broker"""
        try:
            # Create MQTT client with callback API version
            # Use clean_session=True for anonymous connections
            # Use empty client_id to let broker auto-generate unique ID
            try:
                # Try new API first (paho-mqtt >= 2.0)
                self.client = mqtt.Client(
                    callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
                    client_id="",
                    clean_session=True,
                    protocol=mqtt.MQTTv311
                )
            except TypeError:
                # Fall back to old API (paho-mqtt < 2.0)
                self.client = mqtt.Client(
                    client_id="",
                    clean_session=True,
                    protocol=mqtt.MQTTv311
                )
            
            # Set callbacks
            self.client.on_connect = self._on_connect
            self.client.on_message = self._on_message
            self.client.on_disconnect = self._on_disconnect
            
            # Only set username/password if both are provided and not empty
            if settings.MQTT_USERNAME and settings.MQTT_PASSWORD:
                self.client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
                logger.info("MQTT authentication enabled")
            else:
                logger.info("MQTT connecting with anonymous access")
            
            # Connect to broker
            self.client.connect(
                settings.MQTT_BROKER_HOST,
                settings.MQTT_BROKER_PORT,
                keepalive=60
            )
            
            # Start network loop in background
            self.client.loop_start()
            
            logger.info(f"MQTT client connecting to {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
            
        except Exception as e:
            logger.error(f"MQTT connection failed: {e}")
            self.is_connected = False
            raise
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to broker"""
        if rc == 0:
            self.is_connected = True
            logger.info("[OK] Connected to MQTT broker successfully")
            
            # Subscribe to all device topics
            topics = [
                ("guardion/devices/+/telemetry", 1),  # QoS 1
                ("guardion/devices/+/alerts", 2),      # QoS 2 (critical)
                ("guardion/devices/+/status", 1),      # QoS 1
            ]
            
            for topic, qos in topics:
                client.subscribe(topic, qos)
                logger.info(f"[OK] Subscribed to {topic} (QoS {qos})")
        else:
            self.is_connected = False
            logger.error(f"[ERROR] MQTT connection failed with code {rc}")
    
    def _on_message(self, client, userdata, message):
        """Callback when message received"""
        try:
            topic = message.topic
            payload = json.loads(message.payload.decode())
            
            logger.info(f"[OK] Received message on {topic}")
            
            # Call the message handler if set
            if self.message_handler and self.loop:
                # Schedule the coroutine in the FastAPI event loop
                asyncio.run_coroutine_threadsafe(
                    self.message_handler(topic, payload),
                    self.loop
                )
            
        except json.JSONDecodeError:
            logger.error(f"[ERROR] Invalid JSON payload on {topic}: {message.payload}")
        except Exception as e:
            logger.exception(f"[ERROR] Error processing message: {e}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from broker"""
        self.is_connected = False
        if rc != 0:
            logger.warning(f"[WARNING] Unexpected MQTT disconnect. Code: {rc}")
        else:
            logger.info("[OK] MQTT client disconnected")
    
    def publish(self, topic: str, payload: dict, qos: int = 1):
        """Publish message to MQTT broker"""
        try:
            if not self.is_connected:
                logger.warning("[WARNING] Cannot publish: MQTT client not connected")
                return False
            
            message = json.dumps(payload)
            result = self.client.publish(topic, message, qos=qos)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"[OK] Published to {topic}")
                return True
            else:
                logger.error(f"[ERROR] Failed to publish to {topic}")
                return False
            
        except Exception as e:
            logger.error(f"[ERROR] Publish error: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("[OK] MQTT client disconnected")


# Global MQTT client instance
mqtt_client = MQTTClient()
