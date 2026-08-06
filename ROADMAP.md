# GuardIon Integration Roadmap

Phased plan for backend, mobile app, firmware, and production ops.

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Freeze MQTT contract, docs | See `backend_guardion/docs/MQTT_CONTRACT.md` |
| 1 | Broker env, TLS, registration, handler hardening, firmware alignment | See `docs/FIRMWARE_INTEGRATION.md` |
| 2 | WebSocket hooks in mobile app | `guardIon/hooks/use-*-websocket.ts` |
| 3 | Auth route guard + onboarding flag | Splash routing |
| 4 | Product APIs (guardians, contacts, prefs, profile photo) | `/api/v1/guardians`, etc. |
| 5 | Push notifications (Expo + backend) | `/api/v1/notifications/register-token` |
| 6 | Production hardening | `docs/PRODUCTION.md` |

## Quick links

- [MQTT contract](backend_guardion/docs/MQTT_CONTRACT.md)
- [Device registration](backend_guardion/docs/DEVICE_REGISTRATION.md)
- [Firmware integration](docs/FIRMWARE_INTEGRATION.md)
- [Production checklist](docs/PRODUCTION.md)
- [Project README](README.md)

## Priority if time is limited

**Must-have demo:** Phase 1 (broker + registration + telemetry + SOS) + Phase 3 auth guard.

**High value next:** Phase 2 WebSockets.

**Defer:** Native Google sign-in, full OAuth verification, advanced session analytics.
