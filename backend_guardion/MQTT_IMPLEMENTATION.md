# GuardIon MQTT Implementation Guide

## Overview
This document provides comprehensive guidance for implementing MQTT communication between ESP32 wearable devices and the FastAPI backend server. MQTT (Message Queuing Telemetry Transport) is a lightweight publish-subscribe messaging protocol designed for IoT devices with constrained resources.

---

## MQTT Architecture

### System Components

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  ESP32 Wearable │         │   MQTT Broker   │         │  FastAPI Backend│
│  (Publisher)    │◄───────►│   (HiveMQ/      │◄───────►│  (Subscriber)   │
│                 │  MQTT   │   Mosquitto)    │  MQTT   │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
       │                            │                            │
       │                            │                            │
       ▼                            ▼                            ▼
  Publishes to:              Message Routing              Subscribes to:
  - telemetry                & Distribution               - devices/+/telemetry
  - alerts                   - QoS handling               - devices/+/alerts
  - status                   - Persistence                - devices/+/status
```

---

## Topic Structure Design

### Topic Hierarchy
MQTT topics follow a hierarchical structure using forward slashes:

```
guardion/
├── devices/
│   ├── {device_id}/
│   │   ├── telemetry          # Location & sensor data
│   │   ├── alerts             # Emergency/SOS events
│   │   ├── status             # Online/offline, battery critical
│   │   ├── health             # Device health metrics
│   │   └── command            # Backend → Device commands (future)
│   │
│   └── status/
│       ├── online             # Device connection announcements
│       └── offline            # Last will testament messages
│
└── system/
    ├── heartbeat              # Backend service health
    └── stats                  # Broker statistics
```

### Topic Examples
```
guardion/devices/ESP32-ABC123/telemetry
guardion/devices/ESP32-ABC123/alerts
guardion/devices/ESP32-ABC123/status
guardion/devices/status/online
```

---

## Message Payload Formats

All messages use JSON format for structured data with UTF-8 encoding.

### 1. Telemetry Message (Location Updates)

**Topic:** `guardion/devices/{device_id}/telemetry`

**Payload:**
```json
{
  "device_id": "ESP32-ABC123",
  "timestamp": "2026-05-07T13:30:45Z",
  "location": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "accuracy": 10.5,
    "altitude": 45.2,
    "speed": 0.5
  },
  "battery": {
    "level": 85,
    "voltage": 3.95,
    "charging": false
  },
  "signal": {
    "strength": -72,
    "quality": 85
  },
  "metadata": {
    "firmware_version": "1.0.3",
    "update_reason": "periodic"
  }
}
```

**Field Descriptions:**
- `device_id`: Unique ESP32 identifier (matches DB)
- `timestamp`: ISO 8601 UTC timestamp from GPS or RTC
- `location.latitude/longitude`: GPS coordinates (WGS84)
- `location.accuracy`: GPS accuracy in meters
- `battery.level`: Percentage (0-100)
- `battery.voltage`: Raw voltage reading
- `signal.strength`: RSSI in dBm (-120 to -50)
- `update_reason`: "periodic", "movement", "geofence_check"

**QoS Level:** 1 (At least once delivery)

**Publish Frequency:** Every 30 seconds (configurable)

---

### 2. Alert Message (Emergency Events)

**Topic:** `guardion/devices/{device_id}/alerts`

**Payload:**
```json
{
  "device_id": "ESP32-ABC123",
  "timestamp": "2026-05-07T13:35:12Z",
  "alert_type": "SOS",
  "priority": "critical",
  "location": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "accuracy": 8.3
  },
  "metadata": {
    "button_press_count": 3,
    "battery_level": 45
  }
}
```

**Alert Types:**
- `SOS` - Emergency button pressed
- `LOW_BATTERY` - Battery below threshold (20%)
- `DEVICE_TAMPER` - Device removed (accelerometer pattern)
- `FALL_DETECTED` - Sudden acceleration pattern (future)

**Priority Levels:**
- `critical` - Immediate action required
- `high` - Action required soon
- `medium` - Informational alert

**QoS Level:** 2 (Exactly once delivery - critical for alerts)

---

### 3. Status Message (Device State)

**Topic:** `guardion/devices/{device_id}/status`

**Payload:**
```json
{
  "device_id": "ESP32-ABC123",
  "timestamp": "2026-05-07T13:30:00Z",
  "status": "online",
  "uptime_seconds": 7200,
  "network": {
    "operator": "MTN",
    "connection_type": "LTE",
    "ip_address": "10.23.45.67"
  },
  "memory": {
    "free_heap": 45000,
    "total_heap": 320000
  }
}
```

**Status Values:**
- `online` - Device connected and functioning
- `offline` - Device disconnected
- `sleep` - Low-power mode activated
- `charging` - Device in charging state

**QoS Level:** 1

---

### 4. Health Message (Diagnostics)

**Topic:** `guardion/devices/{device_id}/health`

**Payload:**
```json
{
  "device_id": "ESP32-ABC123",
  "timestamp": "2026-05-07T14:00:00Z",
  "diagnostics": {
    "gps_fix_time_ms": 3200,
    "mqtt_reconnections": 0,
    "failed_publishes": 0,
    "average_publish_latency_ms": 145
  },
  "sensors": {
    "gps_status": "fix_3d",
    "accelerometer_ok": true,
    "temperature_c": 32.5
  }
}
```

**QoS Level:** 0 (Fire and forget - non-critical diagnostics)

**Publish Frequency:** Every 5 minutes

---

## MQTT Broker Configuration

### Broker Options

#### Option 1: HiveMQ Cloud (Recommended for Production)
- Managed MQTT service
- Built-in TLS/SSL
- Web console for monitoring
- Free tier: 100 connections, 10 GB/month
- **Website:** https://www.hivemq.com/

**Advantages:**
- No infrastructure management
- High availability
- Built-in security
- Pay-as-you-grow

#### Option 2: Self-Hosted Mosquitto (Development/Cost-Sensitive)
- Open-source MQTT broker
- Runs on any Linux server
- Full control over configuration
- Free but requires maintenance

**Advantages:**
- No usage costs
- Complete control
- Can run locally for testing

---

### Mosquitto Installation & Setup

#### Install Mosquitto (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

#### Configuration File (`/etc/mosquitto/mosquitto.conf`)
```conf
# Port configuration
listener 1883
protocol mqtt

listener 8883
protocol mqtt
certfile /etc/mosquitto/certs/server.crt
keyfile /etc/mosquitto/certs/server.key
cafile /etc/mosquitto/certs/ca.crt

# Security
allow_anonymous false
password_file /etc/mosquitto/passwd

# Persistence
persistence true
persistence_location /var/lib/mosquitto/

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_type all

# Max connections
max_connections 1000

# Message size limit (500KB)
message_size_limit 512000

# Connection timeouts
keepalive_interval 60
```

#### Create User Credentials
```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd backend_user
sudo mosquitto_passwd /etc/mosquitto/passwd device_user

# Restart Mosquitto
sudo systemctl restart mosquitto
```

#### Test Broker
```bash
# Terminal 1: Subscribe
mosquitto_sub -h localhost -p 1883 -u backend_user -P password -t "test/topic"

# Terminal 2: Publish
mosquitto_pub -h localhost -p 1883 -u device_user -P password -t "test/topic" -m "Hello MQTT"
```

---

## TLS/SSL Configuration (Production Security)

### Generate Self-Signed Certificates (Testing)
```bash
# Create certificate directory
sudo mkdir -p /etc/mosquitto/certs
cd /etc/mosquitto/certs

# Generate CA key and certificate
openssl genrsa -out ca.key 2048
openssl req -new -x509 -days 3650 -key ca.key -out ca.crt

# Generate server key and certificate
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 3650

# Set permissions
sudo chown mosquitto:mosquitto /etc/mosquitto/certs/*
sudo chmod 600 /etc/mosquitto/certs/*.key
```

### Production TLS (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot

# Get certificate for your domain
sudo certbot certonly --standalone -d mqtt.guardion.com

# Update mosquitto.conf with Let's Encrypt paths
certfile /etc/letsencrypt/live/mqtt.guardion.com/fullchain.pem
keyfile /etc/letsencrypt/live/mqtt.guardion.com/privkey.pem
```

---

## Backend MQTT Client Implementation

### Python Dependencies
```bash
pip install paho-mqtt asyncio-mqtt
```

### MQTT Client Service (`app/mqtt/client.py`)

```python
import asyncio
import json
import logging
from typing import Callable, Dict
from datetime import datetime

import asyncio_mqtt as aiomqtt
from app.config import settings
from app.mqtt.handlers import MessageHandler

logger = logging.getLogger(__name__)


class MQTTClient:
    """
    Async MQTT client for subscribing to device messages
    """
    
    def __init__(self):
        self.client = None
        self.message_handler = MessageHandler()
        self.is_connected = False
        self.reconnect_interval = 5  # seconds
        
    async def connect(self):
        """Establish connection to MQTT broker"""
        try:
            self.client = aiomqtt.Client(
                hostname=settings.MQTT_BROKER_HOST,
                port=settings.MQTT_BROKER_PORT,
                username=settings.MQTT_USERNAME,
                password=settings.MQTT_PASSWORD,
                tls_context=settings.MQTT_TLS_CONTEXT if settings.MQTT_TLS_ENABLED else None,
                keepalive=60,
                clean_session=False,  # Persistent session
                client_id="guardion_backend"
            )
            
            await self.client.connect()
            self.is_connected = True
            logger.info(f"Connected to MQTT broker at {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
            
        except Exception as e:
            logger.error(f"MQTT connection failed: {e}")
            self.is_connected = False
            raise
    
    async def subscribe_to_topics(self):
        """Subscribe to all relevant device topics"""
        topics = [
            ("guardion/devices/+/telemetry", 1),  # QoS 1
            ("guardion/devices/+/alerts", 2),      # QoS 2 (critical)
            ("guardion/devices/+/status", 1),      # QoS 1
            ("guardion/devices/+/health", 0),      # QoS 0 (diagnostics)
        ]
        
        for topic, qos in topics:
            await self.client.subscribe(topic, qos)
            logger.info(f"Subscribed to {topic} with QoS {qos}")
    
    async def message_loop(self):
        """Main message processing loop"""
        while True:
            try:
                if not self.is_connected:
                    await self.connect()
                    await self.subscribe_to_topics()
                
                async with self.client.messages() as messages:
                    async for message in messages:
                        await self._process_message(message)
                        
            except aiomqtt.MqttError as e:
                logger.error(f"MQTT error: {e}. Reconnecting in {self.reconnect_interval}s...")
                self.is_connected = False
                await asyncio.sleep(self.reconnect_interval)
                
            except Exception as e:
                logger.exception(f"Unexpected error in message loop: {e}")
                await asyncio.sleep(self.reconnect_interval)
    
    async def _process_message(self, message):
        """Route message to appropriate handler"""
        try:
            topic = str(message.topic)
            payload = json.loads(message.payload.decode())
            
            logger.info(f"Received message on {topic}: {payload.get('device_id', 'unknown')}")
            
            # Route to appropriate handler
            if "telemetry" in topic:
                await self.message_handler.handle_telemetry(payload)
            elif "alerts" in topic:
                await self.message_handler.handle_alert(payload)
            elif "status" in topic:
                await self.message_handler.handle_status(payload)
            elif "health" in topic:
                await self.message_handler.handle_health(payload)
            else:
                logger.warning(f"Unknown topic: {topic}")
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON payload on {message.topic}: {message.payload}")
        except Exception as e:
            logger.exception(f"Error processing message: {e}")
    
    async def publish(self, topic: str, payload: Dict, qos: int = 1):
        """Publish message to MQTT broker (for commands)"""
        try:
            if not self.is_connected:
                logger.warning("Cannot publish: MQTT client not connected")
                return False
            
            message = json.dumps(payload)
            await self.client.publish(topic, message, qos=qos)
            logger.info(f"Published to {topic}: {payload}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish message: {e}")
            return False
    
    async def disconnect(self):
        """Clean disconnect from broker"""
        if self.client:
            await self.client.disconnect()
            self.is_connected = False
            logger.info("Disconnected from MQTT broker")


# Global MQTT client instance
mqtt_client = MQTTClient()
```

---

### Message Handlers (`app/mqtt/handlers.py`)

```python
import logging
from datetime import datetime
from typing import Dict

from app.services.location_service import LocationService
from app.services.device_service import DeviceService
from app.services.geofence_service import GeofenceService
from app.services.alert_service import AlertService
from app.services.websocket_service import WebSocketService
from app.database import get_db

logger = logging.getLogger(__name__)


class MessageHandler:
    """
    Handles incoming MQTT messages and routes to appropriate services
    """
    
    def __init__(self):
        self.location_service = LocationService()
        self.device_service = DeviceService()
        self.geofence_service = GeofenceService()
        self.alert_service = AlertService()
        self.websocket_service = WebSocketService()
    
    async def handle_telemetry(self, payload: Dict):
        """
        Process location telemetry data
        1. Save location to database
        2. Update device status
        3. Check geofence breaches
        4. Broadcast to connected WebSocket clients
        """
        try:
            device_id = payload["device_id"]
            timestamp = datetime.fromisoformat(payload["timestamp"].replace('Z', '+00:00'))
            location = payload["location"]
            battery = payload["battery"]
            signal = payload["signal"]
            
            # Save location to database
            await self.location_service.save_location(
                device_id=device_id,
                latitude=location["latitude"],
                longitude=location["longitude"],
                timestamp=timestamp,
                accuracy=location.get("accuracy"),
                altitude=location.get("altitude"),
                speed=location.get("speed")
            )
            
            # Update device status
            await self.device_service.update_device_status(
                device_id=device_id,
                battery_level=battery["level"],
                signal_strength=signal["strength"],
                last_seen=timestamp
            )
            
            # Check for geofence breaches
            device = await self.device_service.get_device_by_id(device_id)
            if device:
                breach = await self.geofence_service.check_geofence_breach(
                    latitude=location["latitude"],
                    longitude=location["longitude"],
                    child_id=device.child_id
                )
                
                if breach:
                    logger.warning(f"Geofence breach detected for device {device_id}")
                    await self.alert_service.create_alert(
                        alert_type="geofence_breach",
                        child_id=device.child_id,
                        device_id=device_id,
                        location_lat=location["latitude"],
                        location_lng=location["longitude"]
                    )
            
            # Broadcast location update to WebSocket clients
            await self.websocket_service.broadcast_location_update(
                child_id=device.child_id,
                location=location,
                battery=battery["level"]
            )
            
            logger.info(f"Processed telemetry from {device_id}")
            
        except KeyError as e:
            logger.error(f"Missing required field in telemetry payload: {e}")
        except Exception as e:
            logger.exception(f"Error handling telemetry: {e}")
    
    async def handle_alert(self, payload: Dict):
        """
        Process emergency alerts
        1. Create high-priority alert in database
        2. Send push notifications to all guardians
        3. Broadcast to WebSocket clients
        """
        try:
            device_id = payload["device_id"]
            alert_type = payload["alert_type"]
            location = payload["location"]
            priority = payload.get("priority", "high")
            
            device = await self.device_service.get_device_by_id(device_id)
            if not device:
                logger.error(f"Alert from unknown device: {device_id}")
                return
            
            # Create alert in database
            alert = await self.alert_service.create_alert(
                alert_type=alert_type,
                child_id=device.child_id,
                device_id=device_id,
                location_lat=location["latitude"],
                location_lng=location["longitude"],
                metadata=payload.get("metadata", {})
            )
            
            # Send notifications to all guardians
            await self.alert_service.notify_guardians(
                child_id=device.child_id,
                alert=alert,
                priority=priority
            )
            
            # Real-time broadcast
            await self.websocket_service.broadcast_alert(
                child_id=device.child_id,
                alert=alert
            )
            
            logger.critical(f"ALERT: {alert_type} from device {device_id} - Location: {location}")
            
        except Exception as e:
            logger.exception(f"Error handling alert: {e}")
    
    async def handle_status(self, payload: Dict):
        """Process device status updates"""
        try:
            device_id = payload["device_id"]
            status = payload["status"]
            
            await self.device_service.update_device_status(
                device_id=device_id,
                status=status,
                last_seen=datetime.utcnow()
            )
            
            logger.info(f"Device {device_id} status: {status}")
            
        except Exception as e:
            logger.exception(f"Error handling status: {e}")
    
    async def handle_health(self, payload: Dict):
        """Process device health diagnostics"""
        try:
            device_id = payload["device_id"]
            diagnostics = payload.get("diagnostics", {})
            
            await self.device_service.save_health_metrics(
                device_id=device_id,
                metrics=diagnostics
            )
            
            logger.debug(f"Health metrics saved for {device_id}")
            
        except Exception as e:
            logger.exception(f"Error handling health data: {e}")
```

---

### Integration with FastAPI (`app/main.py`)

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio

from app.mqtt.client import mqtt_client
from app.api.v1 import auth, children, devices, locations, safezones, alerts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup: Connect to MQTT and start message loop
    mqtt_task = asyncio.create_task(mqtt_client.message_loop())
    
    yield
    
    # Shutdown: Disconnect MQTT
    mqtt_task.cancel()
    await mqtt_client.disconnect()


app = FastAPI(
    title="GuardIon API",
    version="1.0.0",
    description="Child safety and location monitoring backend",
    lifespan=lifespan
)

# Register API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(children.router, prefix="/api/v1/children", tags=["Children"])
app.include_router(devices.router, prefix="/api/v1/devices", tags=["Devices"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["Locations"])
app.include_router(safezones.router, prefix="/api/v1/safezones", tags=["Safe Zones"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "mqtt_connected": mqtt_client.is_connected
    }
```

---

## ESP32 Firmware MQTT Implementation

### Arduino Libraries Required
```cpp
// Install via Arduino Library Manager
#include <WiFi.h>
#include <PubSubClient.h>  // MQTT client
#include <ArduinoJson.h>   // JSON parsing/generation
#include <TinyGPS++.h>     // GPS parsing
```

### ESP32 MQTT Client Code (`main.ino`)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>

// Device Configuration
const char* DEVICE_ID = "ESP32-ABC123";

// MQTT Configuration
const char* MQTT_BROKER = "mqtt.guardion.com";
const int MQTT_PORT = 8883;
const char* MQTT_USERNAME = "device_user";
const char* MQTT_PASSWORD = "secure_password";

// Topics
String TOPIC_TELEMETRY = "guardion/devices/" + String(DEVICE_ID) + "/telemetry";
String TOPIC_ALERTS = "guardion/devices/" + String(DEVICE_ID) + "/alerts";
String TOPIC_STATUS = "guardion/devices/" + String(DEVICE_ID) + "/status";

// MQTT Client
WiFiClientSecure wifiClient;
PubSubClient mqttClient(wifiClient);

// GPS Serial (connected to SIM7080G)
HardwareSerial gpsSerial(1);

// Timing
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 30000;  // 30 seconds

// SOS Button
const int SOS_BUTTON_PIN = 4;
bool sosPressed = false;


void setup() {
  Serial.begin(115200);
  
  // Initialize GPS serial
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);  // RX=16, TX=17
  
  // SOS button setup
  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(SOS_BUTTON_PIN), handleSOSPress, FALLING);
  
  // Connect to mobile network via SIM7080G
  connectNetwork();
  
  // Connect to MQTT broker
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();
  
  // Publish online status
  publishStatus("online");
}


void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
  // Periodic telemetry
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    publishTelemetry();
    lastTelemetryTime = millis();
  }
  
  // Check for SOS button press
  if (sosPressed) {
    publishAlert("SOS");
    sosPressed = false;
  }
}


void connectNetwork() {
  Serial.println("Connecting to mobile network...");
  
  // Send AT commands to SIM7080G
  gpsSerial.println("AT");
  delay(1000);
  
  gpsSerial.println("AT+CPIN?");  // Check SIM
  delay(1000);
  
  gpsSerial.println("AT+CGATT=1");  // Attach to GPRS
  delay(2000);
  
  gpsSerial.println("AT+CGACT=1,1");  // Activate PDP context
  delay(2000);
  
  Serial.println("Network connected");
}


void connectMQTT() {
  Serial.print("Connecting to MQTT broker...");
  
  // Set Last Will Testament (sent when device disconnects unexpectedly)
  String willTopic = "guardion/devices/" + String(DEVICE_ID) + "/status";
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  
  // Connect with credentials
  if (mqttClient.connect(DEVICE_ID, MQTT_USERNAME, MQTT_PASSWORD, 
                         willTopic.c_str(), 1, true, "{\"status\":\"offline\"}")) {
    Serial.println("connected!");
  } else {
    Serial.print("failed, rc=");
    Serial.println(mqttClient.state());
  }
}


void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (mqttClient.connect(DEVICE_ID, MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("reconnected");
    } else {
      Serial.print("failed, rc=");
      Serial.println(mqttClient.state());
      delay(5000);
    }
  }
}


void publishTelemetry() {
  // Get GPS data from SIM7080G
  float latitude = 0.0;
  float longitude = 0.0;
  
  gpsSerial.println("AT+CGNSINF");  // Get GPS info
  delay(500);
  
  // Parse GPS response (simplified - actual implementation more complex)
  if (gpsSerial.available()) {
    String gpsData = gpsSerial.readStringUntil('\n');
    // Parse latitude/longitude from response
    // Format: +CGNSINF: 1,1,20260507133000.000,6.5244,3.3792,45.2,...
    // (Implementation details omitted for brevity)
  }
  
  // Get battery level
  int batteryLevel = getBatteryLevel();
  float batteryVoltage = getBatteryVoltage();
  
  // Get signal strength
  int signalStrength = getSignalStrength();
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = getISOTimestamp();
  
  JsonObject location = doc.createNestedObject("location");
  location["latitude"] = latitude;
  location["longitude"] = longitude;
  location["accuracy"] = 10.5;
  
  JsonObject battery = doc.createNestedObject("battery");
  battery["level"] = batteryLevel;
  battery["voltage"] = batteryVoltage;
  battery["charging"] = false;
  
  JsonObject signal = doc.createNestedObject("signal");
  signal["strength"] = signalStrength;
  signal["quality"] = map(signalStrength, -120, -50, 0, 100);
  
  // Serialize and publish
  char buffer[512];
  serializeJson(doc, buffer);
  
  mqttClient.publish(TOPIC_TELEMETRY.c_str(), buffer, false);
  Serial.println("Telemetry published");
}


void publishAlert(const char* alertType) {
  // Get current location
  float latitude = 6.5244;  // Get from GPS
  float longitude = 3.3792;
  
  // Create alert JSON
  DynamicJsonDocument doc(512);
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = getISOTimestamp();
  doc["alert_type"] = alertType;
  doc["priority"] = "critical";
  
  JsonObject location = doc.createNestedObject("location");
  location["latitude"] = latitude;
  location["longitude"] = longitude;
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["button_press_count"] = 1;
  metadata["battery_level"] = getBatteryLevel();
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  // Publish with QoS 2 (exactly once)
  mqttClient.publish(TOPIC_ALERTS.c_str(), buffer, true);
  Serial.println("ALERT PUBLISHED!");
}


void publishStatus(const char* status) {
  DynamicJsonDocument doc(256);
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = getISOTimestamp();
  doc["status"] = status;
  doc["uptime_seconds"] = millis() / 1000;
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  mqttClient.publish(TOPIC_STATUS.c_str(), buffer, true);
}


void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Handle incoming messages (commands from backend)
  Serial.print("Message received on ");
  Serial.println(topic);
  
  // Future: Handle configuration updates, remote commands, etc.
}


void IRAM_ATTR handleSOSPress() {
  sosPressed = true;
}


int getBatteryLevel() {
  // Read battery voltage via ADC
  int adcValue = analogRead(35);  // ADC pin connected to battery voltage divider
  float voltage = (adcValue / 4095.0) * 3.3 * 2;  // Assuming voltage divider
  
  // Map voltage to percentage (3.0V = 0%, 4.2V = 100%)
  int percentage = map(voltage * 100, 300, 420, 0, 100);
  return constrain(percentage, 0, 100);
}


float getBatteryVoltage() {
  int adcValue = analogRead(35);
  return (adcValue / 4095.0) * 3.3 * 2;
}


int getSignalStrength() {
  // Query SIM7080G for signal strength
  gpsSerial.println("AT+CSQ");
  delay(100);
  
  if (gpsSerial.available()) {
    String response = gpsSerial.readStringUntil('\n');
    // Parse CSQ response: +CSQ: 25,99 (0-31 range, 99=unknown)
    // Convert to dBm: dBm = -113 + (csq * 2)
    // (Implementation omitted for brevity)
  }
  
  return -72;  // Placeholder
}


String getISOTimestamp() {
  // Get timestamp from GPS or RTC
  // Format: 2026-05-07T13:30:45Z
  return "2026-05-07T13:30:45Z";  // Placeholder
}
```

---

## Quality of Service (QoS) Levels

### QoS 0: At Most Once
- Fire and forget
- No acknowledgment
- Fastest but least reliable
- **Use for:** Health diagnostics, non-critical status

### QoS 1: At Least Once
- Message acknowledged
- May receive duplicates
- Good reliability
- **Use for:** Location telemetry, status updates

### QoS 2: Exactly Once
- Four-way handshake
- No duplicates
- Highest reliability, slowest
- **Use for:** SOS alerts, critical commands

---

## Testing MQTT Flow

### 1. Test with MQTT Client Tools

#### Using Mosquitto CLI
```bash
# Subscribe to all device topics
mosquitto_sub -h mqtt.guardion.com -p 8883 \
  -u backend_user -P password \
  -t "guardion/devices/#" \
  --cafile ca.crt \
  -v

# Simulate ESP32 publishing telemetry
mosquitto_pub -h mqtt.guardion.com -p 8883 \
  -u device_user -P password \
  -t "guardion/devices/ESP32-TEST/telemetry" \
  --cafile ca.crt \
  -m '{"device_id":"ESP32-TEST","timestamp":"2026-05-07T13:30:00Z","location":{"latitude":6.5244,"longitude":3.3792},"battery":{"level":85},"signal":{"strength":-70}}'
```

#### Using MQTT Explorer (GUI)
- Download: http://mqtt-explorer.com/
- Connect to broker with credentials
- Subscribe to `guardion/#`
- Manually publish test messages
- View message flow in real-time

---

## Performance Optimization

### 1. Connection Persistence
- Use persistent sessions (clean_session=False)
- Reduces reconnection overhead
- Broker stores subscriptions

### 2. Message Batching (Backend)
```python
# Instead of saving each location immediately
async def batch_location_saver():
    buffer = []
    
    while True:
        await asyncio.sleep(5)  # Batch every 5 seconds
        
        if buffer:
            async with get_db() as db:
                await db.bulk_insert_mappings(LocationHistory, buffer)
                await db.commit()
            
            buffer.clear()
```

### 3. Keep-Alive Optimization
- Set keepalive to 60 seconds
- Balance between connection stability and battery life

### 4. Payload Compression
For bandwidth-constrained scenarios:
```cpp
// ESP32: Compress JSON before publishing
#include <Compress.h>

void publishCompressed() {
  char json[512];
  // ... create JSON ...
  
  char compressed[256];
  int compressedSize = compress(json, compressed);
  
  mqttClient.publish(TOPIC_TELEMETRY.c_str(), compressed, compressedSize);
}
```

---

## Monitoring & Debugging

### Backend MQTT Monitoring
```python
# Add metrics collection
from prometheus_client import Counter, Histogram

mqtt_messages_received = Counter('mqtt_messages_total', 'Total MQTT messages', ['topic_type'])
mqtt_processing_time = Histogram('mqtt_processing_seconds', 'Message processing time')

async def _process_message(self, message):
    start_time = time.time()
    
    # ... process message ...
    
    mqtt_messages_received.labels(topic_type=topic_type).inc()
    mqtt_processing_time.observe(time.time() - start_time)
```

### Logging Best Practices
```python
# Structured logging with context
logger.info(
    "MQTT message processed",
    extra={
        "device_id": device_id,
        "topic": topic,
        "payload_size": len(payload),
        "processing_time_ms": processing_time * 1000
    }
)
```

---

## Security Best Practices

### 1. Device Authentication
- Each device has unique credentials
- Rotate passwords periodically
- Use TLS 1.2+ for all connections

### 2. Topic Access Control (ACL)
```conf
# /etc/mosquitto/acl
user device_user
topic write guardion/devices/ESP32-ABC123/#
topic read guardion/devices/ESP32-ABC123/command

user backend_user
topic read guardion/devices/#
topic write guardion/devices/+/command
```

### 3. Payload Validation
```python
# Validate all incoming messages
from pydantic import BaseModel, validator

class TelemetryPayload(BaseModel):
    device_id: str
    timestamp: datetime
    location: dict
    
    @validator('device_id')
    def device_id_format(cls, v):
        if not v.startswith('ESP32-'):
            raise ValueError('Invalid device ID format')
        return v
```

---

## Troubleshooting Guide

### Common Issues

#### 1. ESP32 Not Connecting to Broker
**Symptoms:** `failed, rc=-2` or `rc=5`

**Solutions:**
- Check network connectivity: `AT+CGATT?`
- Verify credentials
- Ensure broker is reachable: `ping mqtt.guardion.com`
- Check TLS certificate validity

#### 2. Messages Not Received by Backend
**Symptoms:** Backend logs show no incoming messages

**Solutions:**
- Verify subscription topics match publish topics
- Check QoS levels
- Ensure MQTT client is connected: check `/health` endpoint
- Test with `mosquitto_sub` to isolate issue

#### 3. High Latency
**Symptoms:** Delays between publish and receive

**Solutions:**
- Check network latency: ping broker
- Monitor broker resource usage
- Reduce message frequency
- Use QoS 0 for non-critical data

#### 4. Memory Leaks on ESP32
**Symptoms:** Device crashes after running for hours

**Solutions:**
- Use `StaticJsonDocument` instead of `DynamicJsonDocument`
- Disconnect/reconnect periodically
- Monitor heap memory: `ESP.getFreeHeap()`

---

## Production Deployment Checklist

- [ ] TLS/SSL enabled on broker
- [ ] Strong passwords for all MQTT users
- [ ] ACL configured for topic restrictions
- [ ] Monitoring dashboard set up (Grafana + Prometheus)
- [ ] Alert system for broker downtime
- [ ] Log aggregation configured
- [ ] Backup MQTT broker configured (failover)
- [ ] Rate limiting on broker (prevent DDoS)
- [ ] Message retention policy defined
- [ ] Device provisioning process documented
- [ ] OTA firmware update mechanism (future)

---

## Conclusion

This MQTT implementation provides real-time, reliable communication between ESP32 wearable devices and the FastAPI backend. The architecture supports:

- **Scalability:** Handles thousands of concurrent devices
- **Reliability:** QoS levels ensure critical messages aren't lost
- **Security:** TLS encryption and authentication
- **Efficiency:** Lightweight protocol optimized for IoT
- **Flexibility:** Easy to add new message types and commands

Next steps:
1. Implement the backend MQTT client as outlined
2. Flash firmware to ESP32 with MQTT code
3. Test end-to-end message flow
4. Monitor performance and optimize as needed

For questions or issues, refer to:
- Paho MQTT Documentation: https://www.eclipse.org/paho/
- asyncio-mqtt: https://sbtinstruments.github.io/asyncio-mqtt/
- ESP32 Arduino Core: https://docs.espressif.com/
