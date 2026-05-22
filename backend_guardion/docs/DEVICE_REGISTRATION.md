# Device Registration Flow

GuardIon drops all MQTT messages from devices that are not registered in PostgreSQL.

## Prerequisites

1. Parent account exists (sign up / sign in via app or API).
2. At least one child profile exists for that account.
3. Backend MQTT subscriber is running (`uvicorn app.main:app` with lifespan).
4. Broker env matches firmware (`MQTT_BROKER_HOST`, port, auth, TLS).

## Register via API

```http
POST /api/v1/devices/register
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "device_id": "ESP32-PROD001",
  "child_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

- `device_id` — string from firmware (e.g. serial / MAC-based ID). **Not** the Postgres UUID.
- `child_id` — UUID of the child who wears the device.

Success: `201 Created` with device record.

## Register simulator devices (development)

```powershell
cd backend_guardion
# Ensure DATABASE_URL and a test user/child exist
python register_simulator_devices.py
```

This seeds IDs used by `simulators/device_simulator.py` (e.g. `ESP32-SIM001`).

## Verify end-to-end

1. Start broker and backend.
2. Register device (API or script).
3. Publish telemetry (simulator or hardware).
4. Confirm backend log: `[OK] Saved telemetry: <device_id>`.
5. In app: refresh home/map — battery and location appear (location requires lat/lon in payload).

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `not registered in database` | No Postgres row for `device_id` | Run registration API |
| No location on map | Missing lat/lon in telemetry | Enable GNSS on firmware |
| `mqtt_connected: false` | Broker unreachable / wrong env | Check host, port, firewall, TLS |
| App shows stale data | REST only until WS connected | Pull to refresh; WebSocket updates live |

See also: [MQTT_CONTRACT.md](./MQTT_CONTRACT.md), root [docs/FIRMWARE_INTEGRATION.md](../../docs/FIRMWARE_INTEGRATION.md).
