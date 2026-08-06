# Production Hardening Checklist

Use before demo/production deployment.

## MQTT

- [ ] Enable TLS (`MQTT_TLS_ENABLED=true`, port `8883`)
- [ ] Broker ACLs: each device may only publish to `guardion/devices/{its_id}/#`
- [ ] Backend subscriber uses dedicated credentials (read-only on `guardion/devices/+/+`)
- [ ] Monitor `/health` → `mqtt_connected`; alert on disconnect
- [ ] Document broker hostname for firmware team (`docs/FIRMWARE_INTEGRATION.md`)

## API

- [ ] `DEBUG=false`, `LOG_LEVEL=INFO`
- [ ] HTTPS termination (reverse proxy / load balancer)
- [ ] Restrict `ALLOWED_ORIGINS` to production app domains
- [ ] Strong `JWT_SECRET_KEY` (32+ random bytes)
- [ ] Never commit `.env` files

## Database

- [ ] Run Alembic migrations on deploy
- [ ] Backups enabled
- [ ] Connection pooling configured for expected load

## Mobile

- [ ] `EXPO_PUBLIC_API_URL` points to HTTPS API
- [ ] Dev build for production Google Sign-In (optional vs Expo Go)
- [ ] Push notification credentials configured (Expo / FCM)

## Hardware E2E validation

- [ ] Device registers and publishes telemetry with GNSS
- [ ] SOS alert appears in app (REST + WebSocket + push if enabled)
- [ ] Geofence breach fires when leaving safe zone
- [ ] Low battery alert below threshold
- [ ] `last_seen` updates on status/telemetry

## Monitoring

- [ ] `/health` probed every 1–5 minutes
- [ ] Log aggregation for MQTT errors and failed auth
- [ ] Optional: Prometheus metrics via `prometheus-client`

## Secrets rotation

- [ ] JWT secret, MQTT passwords, Google client secret, Resend/FCM keys documented in vault
- [ ] Rotation procedure tested in staging
