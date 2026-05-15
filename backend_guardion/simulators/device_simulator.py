"""
ESP32 Device Simulator
Simulates wearable devices publishing MQTT messages
"""

import time
import random
import json
from datetime import datetime
import paho.mqtt.client as mqtt


class DeviceSimulator:
    """
    Simulates a single GuardIOn wearable device
    """
    
    def __init__(self, device_id: str, broker_host: str = "localhost", broker_port: int = 1883):
        self.device_id = device_id
        self.broker_host = broker_host
        self.broker_port = broker_port
        
        # Device state
        self.latitude = 6.5244  # Lagos, Nigeria (example starting point)
        self.longitude = 3.3792
        self.battery_level = 100
        self.is_moving = False
        
        # MQTT client
        try:
            # Try new paho-mqtt API (>=2.0)
            self.client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
                client_id=f"simulator_{device_id}"
            )
        except TypeError:
            # Fall back to old API (<2.0)
            self.client = mqtt.Client(client_id=f"simulator_{device_id}")
        
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.connected = False
        
        # Topic names
        self.topic_telemetry = f"guardion/devices/{device_id}/telemetry"
        self.topic_alerts = f"guardion/devices/{device_id}/alerts"
        self.topic_status = f"guardion/devices/{device_id}/status"
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_start()
            time.sleep(1)  # Wait for connection
        except Exception as e:
            print(f"[{self.device_id}] Connection failed: {e}")
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected"""
        if rc == 0:
            self.connected = True
            print(f"[{self.device_id}] ✓ Connected to MQTT broker")
        else:
            print(f"[{self.device_id}] ✗ Connection failed with code {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected"""
        self.connected = False
        print(f"[{self.device_id}] ✗ Disconnected from broker")
    
    def publish_telemetry(self):
        """Publish location and sensor data"""
        # Simulate GPS movement (small random walk)
        if self.is_moving:
            self.latitude += random.uniform(-0.0005, 0.0005)
            self.longitude += random.uniform(-0.0005, 0.0005)
        
        # Simulate battery drain
        self.battery_level = max(0, self.battery_level - random.uniform(0.1, 0.5))
        
        # Create telemetry payload
        payload = {
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "location": {
                "latitude": round(self.latitude, 6),
                "longitude": round(self.longitude, 6),
                "accuracy": round(random.uniform(5, 15), 1),
                "altitude": round(random.uniform(40, 60), 1),
                "speed": round(random.uniform(0, 2), 1) if self.is_moving else 0
            },
            "battery": {
                "level": int(self.battery_level),
                "voltage": round(3.7 + (self.battery_level / 100) * 0.5, 2),
                "charging": False
            },
            "signal": {
                "strength": random.randint(-80, -60),
                "quality": random.randint(70, 100)
            },
            "metadata": {
                "firmware_version": "1.0.0-simulator",
                "update_reason": "periodic"
            }
        }
        
        # Publish message
        result = self.client.publish(self.topic_telemetry, json.dumps(payload), qos=1)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"[{self.device_id}] 📍 Telemetry: Lat={self.latitude:.4f}, Lng={self.longitude:.4f}, Battery={int(self.battery_level)}%")
        else:
            print(f"[{self.device_id}] ✗ Failed to publish telemetry")
    
    def publish_alert(self, alert_type: str = "SOS"):
        """Publish an alert message"""
        payload = {
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "alert_type": alert_type,
            "priority": "critical" if alert_type == "SOS" else "high",
            "location": {
                "latitude": round(self.latitude, 6),
                "longitude": round(self.longitude, 6),
                "accuracy": round(random.uniform(5, 15), 1)
            },
            "metadata": {
                "button_press_count": 1 if alert_type == "SOS" else 0,
                "battery_level": int(self.battery_level)
            }
        }
        
        # Publish with QoS 2 (exactly once) for critical alerts
        result = self.client.publish(self.topic_alerts, json.dumps(payload), qos=2)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"[{self.device_id}] 🚨 ALERT SENT: {alert_type}")
        else:
            print(f"[{self.device_id}] ✗ Failed to publish alert")
    
    def publish_status(self, status: str = "online"):
        """Publish device status"""
        payload = {
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": status,
            "uptime_seconds": int(time.time())
        }
        
        result = self.client.publish(self.topic_status, json.dumps(payload), qos=1)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"[{self.device_id}] ℹ Status: {status}")
        else:
            print(f"[{self.device_id}] ✗ Failed to publish status")
    
    def set_movement(self, is_moving: bool):
        """Enable/disable simulated movement"""
        self.is_moving = is_moving
        print(f"[{self.device_id}] Movement: {'ON' if is_moving else 'OFF'}")
    
    def set_location(self, latitude: float, longitude: float):
        """Set device location"""
        self.latitude = latitude
        self.longitude = longitude
        print(f"[{self.device_id}] Location set to: {latitude:.4f}, {longitude:.4f}")
    
    def disconnect(self):
        """Disconnect from broker"""
        self.client.loop_stop()
        self.client.disconnect()
        print(f"[{self.device_id}] Disconnected")


def main():
    """Run device simulator"""
    print("="*60)
    print("GuardIOn Device Simulator")
    print("="*60)
    
    # Configuration
    BROKER_HOST = "localhost"
    BROKER_PORT = 1883
    
    # Create simulated devices
    devices = [
        DeviceSimulator("ESP32-SIM001", BROKER_HOST, BROKER_PORT),
        DeviceSimulator("ESP32-SIM002", BROKER_HOST, BROKER_PORT),
        DeviceSimulator("ESP32-SIM003", BROKER_HOST, BROKER_PORT),
    ]
    
    # Set different starting locations
    devices[0].set_location(6.5244, 3.3792)  # Lagos
    devices[1].set_location(6.5200, 3.3850)  # Nearby
    devices[2].set_location(6.5300, 3.3700)  # Nearby
    
    # Connect all devices
    print("\nConnecting devices...")
    for device in devices:
        device.connect()
    
    print("\n" + "="*60)
    print("Simulator running. Press Ctrl+C to stop.")
    print("="*60 + "\n")
    
    try:
        counter = 0
        while True:
            # Publish telemetry from all devices every 10 seconds
            for device in devices:
                device.publish_telemetry()
            
            counter += 1
            
            # Every 5th iteration, send an SOS from device 1
            if counter % 5 == 0:
                devices[0].publish_alert("SOS")
            
            # Every 10th iteration, enable movement on device 2
            if counter % 10 == 0:
                devices[1].set_movement(not devices[1].is_moving)
            
            time.sleep(10)  # Publish every 10 seconds
    
    except KeyboardInterrupt:
        print("\n\nShutting down simulators...")
        for device in devices:
            device.disconnect()
        print("Simulators stopped.")


if __name__ == "__main__":
    main()
