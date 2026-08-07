# Firmware Integration Guide

Firmware lives in a separate repository (`guardion-firmware`). This document tracks integration tasks against the **canonical MQTT contract** in `backend_guardion/docs/MQTT_CONTRACT.md`.

## Cellular connectivity runbook

1. **SIM / APN** — Configure SIM7080 with carrier APN (e.g. `internet` or carrier-specific).
2. **Broker hostname** — Use a **public** hostname or IP reachable from cellular egress (not `localhost`).
3. **Port** — `1883` (plain TCP) or `8883` (TLS). Must match backend `MQTT_BROKER_PORT` and `MQTT_TLS_ENABLED`.
4. **DNS** — Verify broker hostname resolves on the carrier network (test from phone hotspot + `mosquitto_sub`).
5. **Firewall** — Open inbound MQTT port on broker host / cloud cluster.
6. **Registration** — Register `device_id` via `POST /api/v1/devices/register` before expecting app data.
7. **Smoke test** — From any internet machine:  
   `mosquitto_sub -h <broker> -p 1883 -t 'guardion/devices/+/telemetry' -v`

## Implementation status vs simulator

| Task | Priority | Status |
|------|----------|--------|
| MQTT connect on SIM7080 to production broker | P0 | Required |
| Telemetry: `device_id`, `timestamp`, `battery` | P0 | Required |
| GNSS → `location.latitude` / `location.longitude` | P0 | Required for map/geofence |
| SOS on alerts topic, `priority: "critical"` | P0 | Required |
| Status heartbeat (`device_id`, `status`, optional `uptime_seconds`) | P1 | Recommended |
| QoS 1 telemetry, QoS 2 alerts | P1 | Match simulator if PubSubClient allows |
| Repo hygiene: `secrets.h`, `.pio`, `env/` gitignored | P0 | Required |

## Payload alignment checklist

- [ ] Topic: `guardion/devices/{device_id}/telemetry`
- [ ] Topic: `guardion/devices/{device_id}/alerts`
- [ ] Topic: `guardion/devices/{device_id}/status`
- [ ] JSON field names match `device_simulator.py` (snake_case)
- [ ] `device_id` in payload matches registered ID
- [ ] Timestamps ISO-8601 with `Z` suffix
- [ ] SOS uses `alert_type: "SOS"` and `priority: "critical"`

## Backend alignment checklist

- [ ] `MQTT_BROKER_HOST` / port / auth / TLS match firmware
- [ ] Device registered in Postgres
- [ ] `/health` shows `mqtt_connected: true`
- [ ] Telemetry appears in app after refresh

## Phase 1 exit criteria

Cellular firmware → broker → backend → Postgres → mobile app shows battery, `last_seen`, and map position (with GNSS) after refresh.
