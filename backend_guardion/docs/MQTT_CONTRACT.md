# GuardIon MQTT Contract (Canonical)

**Source of truth:** `simulators/device_simulator.py` and `app/mqtt/handlers.py`.

Firmware, simulators, and backend handlers must match this document. If `MQTT_IMPLEMENTATION.md` disagrees, this file wins.

## Broker connection

| Setting | Backend env | Firmware |
|---------|-------------|----------|
| Host | `MQTT_BROKER_HOST` | Same hostname (must resolve on cellular) |
| Port | `1883` plain / `8883` TLS | Must match `MQTT_TLS_ENABLED` |
| Auth | `MQTT_USERNAME` / `MQTT_PASSWORD` | Same credentials if broker requires |
| TLS | `MQTT_TLS_ENABLED=true` | Enable TLS when port is 8883 |

Backend subscriber starts with FastAPI lifespan (`uvicorn app.main:app`). Verify `/health` → `mqtt_connected: true`.

## Topics (implemented today)

| Topic | QoS | Publisher | Handler |
|-------|-----|-----------|---------|
| `guardion/devices/{device_id}/telemetry` | 1 | Device / simulator | `handle_telemetry` |
| `guardion/devices/{device_id}/alerts` | 2 | Device / simulator | `handle_alert` |
| `guardion/devices/{device_id}/status` | 1 | Device / simulator | `handle_status` |

**Not subscribed yet (future):** `health`, `command`, LWT topics — documented in `MQTT_IMPLEMENTATION.md` only.

## Telemetry payload

```json
{
  "device_id": "ESP32-PROD001",
  "timestamp": "2026-05-19T12:00:00Z",
  "location": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "accuracy": 10.0,
    "altitude": 50.0,
    "speed": 0.0
  },
  "battery": {
    "level": 85,
    "voltage": 3.9,
    "charging": false
  },
  "signal": {
    "strength": -70,
    "quality": 85
  },
  "metadata": {
    "firmware_version": "1.0.0",
    "update_reason": "periodic"
  }
}
```

| Field | Required | Backend behavior |
|-------|----------|------------------|
| `device_id` | Yes | Drop if missing or not registered in Postgres |
| `timestamp` | Recommended | ISO-8601; defaults to server UTC if invalid |
| `location.latitude/longitude` | Recommended | Required for map/geofence; row skipped if both absent |
| `battery.level` | Recommended | Updates `devices.battery_level` |
| `signal.strength` | Optional | Stored on device |
| `signal.quality` | Optional | Ignored |

## Alert payload

```json
{
  "device_id": "ESP32-PROD001",
  "timestamp": "2026-05-19T12:00:00Z",
  "alert_type": "SOS",
  "priority": "critical",
  "location": {
    "latitude": 6.5244,
    "longitude": 3.3792
  },
  "metadata": {
    "trigger": "button_press"
  }
}
```

| `alert_type` | Maps to |
|--------------|---------|
| `SOS` | `AlertType.SOS` |
| `LOW_BATTERY` | `AlertType.LOW_BATTERY` |
| `DEVICE_TAMPER` | `AlertType.DEVICE_TAMPER` |
| `DEVICE_OFFLINE` | `AlertType.DEVICE_OFFLINE` |

Case-insensitive aliases accepted (e.g. `sos`, `low_battery`).

**Note:** `priority` is accepted in the payload (SOS should use `"critical"`) but is **not persisted** in the database today; it is forwarded on WebSocket broadcasts only.

## Status payload

```json
{
  "device_id": "ESP32-PROD001",
  "timestamp": "2026-05-19T12:00:00Z",
  "status": "online",
  "uptime_seconds": 3600
}
```

Updates `devices.last_seen`. `uptime_seconds` is optional and not stored separately today.

## Device registration prerequisite

MQTT messages are ignored until the device is registered:

```http
POST /api/v1/devices/register
Authorization: Bearer <jwt>
{ "device_id": "ESP32-PROD001", "child_id": "<uuid>" }
```

Dev shortcut: `python register_simulator_devices.py`

## Exit check

After registration, publish telemetry → backend log:

```
[OK] Saved telemetry: ESP32-PROD001 | ...
```

Not:

```
Device ESP32-PROD001 not registered in database
```
