# GuardIon — System Overview & Handoff

This document describes the **mobile app**, **backend API**, and **firmware integration contract** for GuardIon — a child safety and real-time location monitoring system. Share this with anyone working on firmware, backend, or frontend.

---

## 1. Project overview

**GuardIon** tracks children via wearable devices (ESP32) and a parent/guardian mobile app.

| Layer | Stack | Path |
|--------|--------|------|
| **Mobile app** | Expo SDK 54, React Native, TypeScript, expo-router | `guardIon/` |
| **Backend API** | FastAPI, PostgreSQL, SQLAlchemy, Alembic, MQTT, WebSockets | `backend_guardion/` |
| **Wearable firmware** | ESP32 (expected) — publishes MQTT to backend | *Firmware project* |

**App identifiers**

- Android package / iOS bundle: `com.guardion.app`
- URL scheme: `guardion`
- Expo owner/slug: `@tekmart-boys/guardIon`

---

## 2. High-level architecture

```
┌─────────────────┐     HTTPS REST      ┌──────────────────────┐
│  GuardIon App   │◄──────────────────►│  FastAPI Backend     │
│  (React Native) │     JWT auth        │  backend_guardion/   │
└─────────────────┘                     └──────────┬───────────┘
                                                   │
                                      MQTT subscribe│
                                                   ▼
                                        ┌──────────────────────┐
                                        │  MQTT Broker         │
                                        │  (Mosquitto / HiveMQ)│
                                        └──────────┬───────────┘
                                                   │
                                      MQTT publish │
                                                   ▼
                                        ┌──────────────────────┐
                                        │  ESP32 Wearable      │
                                        │  (Firmware)          │
                                        └──────────────────────┘
```

**Data flow (firmware → app):**

1. ESP32 publishes GPS/battery/alerts over **MQTT**
2. Backend ingests messages, saves to **PostgreSQL**, runs **geofencing**
3. Backend pushes real-time updates via **WebSocket** (backend ready; app not wired yet)
4. Mobile app reads data via **REST API** (polling on refresh)

---

## 3. Backend (`backend_guardion/`)

### 3.1 Tech stack

- **FastAPI** — REST API at `/api/v1`
- **PostgreSQL** — primary database
- **Alembic** — migrations
- **JWT** — access (15 min) + refresh (7 days) tokens
- **paho-mqtt** — MQTT client on startup
- **WebSockets** — real-time location/alerts
- **bcrypt** — password hashing (direct bcrypt, not passlib)
- **Resend** — OTP emails (optional; dev logs OTP to terminal if empty)
- **google-auth** — Google ID token verification

### 3.2 API routes (`/api/v1`)

| Module | Prefix | Purpose |
|--------|--------|---------|
| `auth.py` | `/auth` | Login, signup OTP, password reset, Google OAuth, refresh, `/me` |
| `users.py` | `/users` | Profile update |
| `children.py` | `/children` | CRUD for children linked to parent user |
| `devices.py` | `/devices` | Register/list/update/delete wearable devices |
| `locations.py` | `/locations` | Current location + history per device/child |
| `safezones.py` | `/safezones` | Geofence zones per child |
| `alerts.py` | `/alerts` | List/acknowledge/resolve alerts |
| `notifications.py` | `/notifications` | In-app notifications |

**Auth endpoints (completed):**

- `POST /auth/signup/request` + `/signup/verify` — email OTP signup
- `POST /auth/login` — email/password
- `POST /auth/forgot-password` + `/reset-password` + `/resend-otp`
- `POST /auth/google` — sign in with Google **ID token**
- `POST /auth/google/code` — Expo Go flow: exchange OAuth **code** server-side (uses `GOOGLE_CLIENT_SECRET`)
- `POST /auth/refresh` — refresh JWT
- `GET /auth/me` — current user

**API docs:** `http://localhost:8000/docs`

### 3.3 Database models (key ones for firmware)

**`devices`**

- `device_id` (string) — **ESP32 identifier** used in MQTT (e.g. `ESP32-SIM001`)
- `child_id` — linked child
- `status` — `active | inactive | lost | charging`
- `battery_level`, `signal_strength`, `last_seen`

**`location_history`**

- GPS: `latitude`, `longitude`, `accuracy`, `altitude`, `speed`
- `battery_level`, `timestamp`
- Linked to internal device UUID (not the string `device_id`)

**`alerts`**

- Types: `SOS`, `geofence_breach`, `low_battery`, `device_offline`, `device_tamper`
- Status: `active`, `acknowledged`, `resolved`
- Optional `location_lat`, `location_lng`

**`safezones`**

- Per child: `zone_name`, `center_lat`, `center_lng`, `radius` (meters)

> **Important:** Firmware `device_id` must be **registered first** via `POST /api/v1/devices/register` (parent app links device to a child). Unregistered devices are **ignored** by MQTT handlers.

### 3.4 MQTT — firmware integration contract

**Broker config** (`backend_guardion/.env`):

```env
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_TLS_ENABLED=false
```

**Topics the backend subscribes to:**

| Topic | QoS | Handler |
|-------|-----|---------|
| `guardion/devices/{device_id}/telemetry` | 1 | GPS + battery → DB + geofencing + WebSocket |
| `guardion/devices/{device_id}/alerts` | 2 | SOS, tamper, etc. → DB + notifications |
| `guardion/devices/{device_id}/status` | 1 | Online/offline heartbeat |

**Telemetry payload** (reference — matches `simulators/device_simulator.py`):

```json
{
  "device_id": "ESP32-SIM001",
  "timestamp": "2026-05-19T12:00:00Z",
  "location": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "accuracy": 10.5,
    "altitude": 50.0,
    "speed": 0.0
  },
  "battery": {
    "level": 85,
    "voltage": 4.1,
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

**Alert payload:**

```json
{
  "device_id": "ESP32-SIM001",
  "timestamp": "2026-05-19T12:00:00Z",
  "alert_type": "SOS",
  "priority": "critical",
  "location": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "accuracy": 10.5
  },
  "metadata": {
    "button_press_count": 1,
    "battery_level": 85
  }
}
```

**Supported `alert_type` values from firmware:**

- `SOS`
- `LOW_BATTERY`
- `DEVICE_TAMPER`
- `DEVICE_OFFLINE`

> `geofence_breach` is generated **server-side** when telemetry exits a safe zone — firmware does not need to send it.

**Status payload:**

```json
{
  "device_id": "ESP32-SIM001",
  "timestamp": "2026-05-19T12:00:00Z",
  "status": "online",
  "uptime_seconds": 3600
}
```

### 3.5 Backend processing on telemetry

1. Lookup device by `device_id` string
2. Insert `location_history` row
3. Update device `last_seen`, `battery_level`, `signal_strength`
4. **Geofence check** — if outside all safe zones → create `geofence_breach` alert
5. **Low battery check** — create alert if below threshold
6. **WebSocket broadcast** to connected app clients

### 3.6 WebSocket (backend ready, app not connected yet)

| Endpoint | Purpose |
|----------|---------|
| `WS /ws/location/{device_id}?token=JWT` | Live GPS updates |
| `WS /ws/alerts?token=JWT` | Live alert push |

Message format example:

```json
{
  "type": "location_update",
  "data": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "battery_level": 85,
    "timestamp": "..."
  }
}
```

### 3.7 Device simulator (testing without hardware)

Path: `backend_guardion/simulators/device_simulator.py`

Simulates 3 devices publishing telemetry every 10s. Use as the **reference implementation** for firmware MQTT messages.

Also: `backend_guardion/register_simulator_devices.py` — registers sim device IDs in DB.

### 3.8 Backend environment variables

```env
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=...
GOOGLE_WEB_CLIENT_ID=...
GOOGLE_ANDROID_CLIENT_ID=...
GOOGLE_IOS_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...        # backend only, for Google code exchange
RESEND_API_KEY=                 # empty = OTP printed to uvicorn terminal
DEBUG=true
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
```

See `backend_guardion/.env.example` for the full list.

---

## 4. Frontend (`guardIon/`)

### 4.1 Tech stack

- **Expo 54** + **expo-router** (file-based routing)
- **TypeScript**
- **react-native-maps** — Google Maps
- **expo-secure-store** — JWT storage
- **expo-auth-session** — Google Sign-In (Expo Go + dev build)
- **AsyncStorage** — guardian profile photo (local only)

### 4.2 App structure

```
app/
  splash-screen/     → onboarding + splash
  authentication/    → signin, sign-up, OTP, forgot/reset password
  (tabs)/            → home, map, alerts, history, settings
  settings/          → profile, family devices, guardians, etc.
  child/[id].tsx     → child detail
  add-safe-zone.tsx  → create safe zone
api/                 → all backend HTTP clients
contexts/            → AuthProvider, GuardianDataProvider, profile photo
hooks/               → safe zones, alerts, activity history, Google sign-in
```

### 4.3 API layer (`guardIon/api/`)

Central HTTP client: `api/client.ts`

- Base URL: `EXPO_PUBLIC_API_URL` (ngrok for physical device testing)
- Sends `Authorization: Bearer <access_token>` when `auth: true`
- Sends `ngrok-skip-browser-warning: true` header

Modules mirror backend: `auth`, `users`, `children`, `devices`, `locations`, `safezones`, `alerts`, `notifications`

UI mappers in `api/mappers.ts` convert API snake_case → UI types.

See `guardIon/api/README.md` for field mapping details.

### 4.4 Authentication (completed)

| Method | Status |
|--------|--------|
| Email/password signup with OTP | Done |
| Email/password login | Done |
| Forgot/reset password with OTP | Done |
| Google Sign-In (Expo Go) | Done — browser OAuth via `auth.expo.io`, code exchanged on backend |
| Google Sign-In (dev build) | Partial — uses native redirect URI path |
| JWT stored in SecureStore | Done |
| Auto refresh on app boot | Done |

**Google OAuth env** (`guardIon/.env`):

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_REDIRECT_URI=https://auth.expo.io/@tekmart-boys/guardIon
EXPO_PUBLIC_API_URL=https://<ngrok>/api/v1
```

See also: `guardIon/docs/AUTH_SETUP.md`, `guardIon/docs/MAPS_SETUP.md`

### 4.5 Screens wired to backend API

| Screen | API used |
|--------|----------|
| Home (`(tabs)/index`) | children, devices, locations |
| Map (`(tabs)/map`) | locations, safe zones |
| Alerts (`(tabs)/alerts`) | alerts |
| History (`(tabs)/history`) | location history |
| Settings / edit profile | users |
| Family devices | devices |
| Safe zones / add zone | safezones |
| Child detail | children, locations |
| Register child modal | children + devices/register |

### 4.6 Still mocked / local-only (no backend API yet)

- Guardians (`settings/guardians.tsx`)
- Emergency contacts
- Logged-in devices list
- Notification preference toggles
- Check-in simulation
- Guardian profile photo (stored in AsyncStorage per user, not on server)

### 4.7 Key contexts

**`AuthProvider`** — login state, JWT, `signIn`, `signInWithGoogle`, `signInWithGoogleCode`, `signOut`

**`GuardianDataProvider`** — loads children + devices + latest location → `ChildSummary[]` for home/map

**`GuardianProfilePhotoProvider`** — local profile photo for logged-in guardian

### 4.8 Maps setup

Google Maps API keys in `guardIon/.env`:

```env
GOOGLE_MAPS_ANDROID_API_KEY=...
GOOGLE_MAPS_IOS_API_KEY=...
```

Injected via `app.config.js`. Native rebuild required after key changes (`npx expo prebuild --clean`).

---

## 5. What has been completed

### Backend

- Full REST API for users, children, devices, locations, safe zones, alerts, notifications
- JWT auth with refresh tokens
- Email OTP signup / password reset (Resend optional; dev OTP in terminal)
- Google OAuth (ID token + authorization code exchange)
- MQTT ingestion from devices (telemetry, alerts, status)
- Automatic geofence breach + low battery alerts
- WebSocket endpoints for live updates
- Device simulator for testing
- Alembic migrations including `email_verifications` table

### Frontend

- Full auth flow (email + Google)
- API integration layer (`guardIon/api/`)
- Home, map, alerts, history, settings wired to backend
- Child registration with device linking
- Safe zone CRUD
- Profile editing
- Google Sign-In button on sign-in/sign-up

### Not done yet

- WebSocket in mobile app (uses REST polling)
- Auth route guard (splash → tabs routing could be tighter)
- Guardian/emergency contacts backend + UI
- User profile photo on backend
- Native Google Sign-In (`@react-native-google-signin`) for production UX
- Firmware ↔ backend end-to-end on real hardware (simulator exists)
- Push notifications (FCM) — config placeholders only

---

## 6. Firmware developer checklist

To integrate ESP32 with the existing system:

### Step 1 — Choose a unique `device_id`

Example: `ESP32-PROD001` (string, max 100 chars)

### Step 2 — Register device in backend

Parent registers via app (`POST /devices/register`) or manually:

```http
POST /api/v1/devices/register
Authorization: Bearer <parent_jwt>
Content-Type: application/json

{
  "device_id": "ESP32-PROD001",
  "child_id": "<uuid-of-child>"
}
```

### Step 3 — Connect to MQTT broker

Use the same broker as the backend (`MQTT_BROKER_HOST` / `PORT` in `backend_guardion/.env`).

### Step 4 — Publish JSON to topics

- `guardion/devices/ESP32-PROD001/telemetry` — periodic GPS (every 10–30s recommended)
- `guardion/devices/ESP32-PROD001/alerts` — SOS button, tamper, etc.
- `guardion/devices/ESP32-PROD001/status` — boot/heartbeat

Match payload structure in **Section 3.4** (same as `device_simulator.py`).

### Step 5 — Test without hardware

1. Start PostgreSQL + MQTT broker (Mosquitto)
2. Run migrations: `alembic upgrade head`
3. Start API: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
4. Run simulator: `python simulators/device_simulator.py`
5. Register sim device IDs in DB (`register_simulator_devices.py`)
6. Open mobile app → map/home should show location

### Step 6 — Field mapping

| Firmware field | Backend field | Notes |
|----------------|---------------|-------|
| `device_id` in MQTT | `devices.device_id` | Must match exactly |
| `location.latitude/longitude` | `location_history` | Decimal degrees |
| `battery.level` | `devices.battery_level` | 0–100 integer |
| `signal.strength` | `devices.signal_strength` | RSSI dBm (e.g. -70) |
| `alert_type: "SOS"` | `alerts.alert_type = SOS` | Uppercase in MQTT |
| ISO8601 `timestamp` | `location_history.timestamp` | UTC with `Z` suffix |

---

## 7. Running the full stack locally

### Backend

```powershell
cd backend_guardion
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile (Expo Go)

```powershell
cd guardIon
npm install
npx expo start -c
```

### API URL for devices

| Target | `EXPO_PUBLIC_API_URL` |
|--------|------------------------|
| Physical phone (same Wi‑Fi) | ngrok URL, e.g. `https://xxxx.ngrok-free.app/api/v1` |
| Android emulator | `http://10.0.2.2:8000/api/v1` |
| iOS simulator | `http://localhost:8000/api/v1` |

Copy `guardIon/.env.example` → `guardIon/.env` and `backend_guardion/.env.example` → `backend_guardion/.env`.

### MQTT simulator

```powershell
cd backend_guardion
python simulators/device_simulator.py
```

---

## 8. Repository layout

```
final_year_project/
├── README.md                 ← this file
├── guardIon/                 # Expo mobile app
│   ├── app/                  # screens (expo-router)
│   ├── api/                  # backend HTTP client
│   ├── contexts/             # auth + guardian data
│   ├── docs/                 # AUTH_SETUP, MAPS_SETUP
│   └── .env.example
├── backend_guardion/         # FastAPI backend
│   ├── app/
│   │   ├── api/v1/           # REST endpoints
│   │   ├── mqtt/             # MQTT client + handlers
│   │   ├── models/           # SQLAlchemy models
│   │   ├── services/         # geofencing, OTP, Google auth
│   │   └── websocket/        # real-time endpoints
│   ├── simulators/           # MQTT device simulator
│   ├── alembic/              # DB migrations
│   └── .env.example
└── (firmware project TBD)
```

---

## 9. Cross-team notes

1. **`device_id` is the firmware↔backend join key** — not the Postgres UUID.
2. **Device must be registered** before MQTT data appears in the app.
3. **Geofencing is server-side** — firmware only sends GPS; backend compares to safe zones.
4. **Mobile app uses WebSocket hooks** for live location/alerts when authenticated; REST remains the fallback.
5. **Google Sign-In in Expo Go** uses browser OAuth via `auth.expo.io`; production should use a dev build + native sign-in for cleaner UX.
6. **OTP in dev** — with empty `RESEND_API_KEY`, OTP codes print in the uvicorn terminal.
7. **Never commit `.env` files** — they contain secrets (JWT, Google client secret, API keys).

---

## 10. Related docs

| Document | Path |
|----------|------|
| Integration roadmap | `ROADMAP.md` |
| MQTT contract (canonical) | `backend_guardion/docs/MQTT_CONTRACT.md` |
| Device registration | `backend_guardion/docs/DEVICE_REGISTRATION.md` |
| Firmware integration | `docs/FIRMWARE_INTEGRATION.md` |
| Production checklist | `docs/PRODUCTION.md` |
| Frontend API integration | `guardIon/api/README.md` |
| Auth setup | `guardIon/docs/AUTH_SETUP.md` |
| Google Maps setup | `guardIon/docs/MAPS_SETUP.md` |
| Backend dev workflow | `backend_guardion/DEVELOPMENT_WORKFLOW.md` |
| Backend README | `backend_guardion/README.md` |
| Frontend README | `guardIon/README.md` |

---

## 11. MQTT integration checklist

Before firmware telemetry appears in the app:

1. **Environment** — Backend `.env` matches firmware: `MQTT_BROKER_HOST`, `MQTT_BROKER_PORT`, auth, `MQTT_TLS_ENABLED`.
2. **Network** — Broker reachable from cellular (public host/IP, firewall open on 1883 or 8883).
3. **Database** — Device registered: `POST /api/v1/devices/register` with `{ device_id, child_id }`.
4. **Payload** — JSON matches `simulators/device_simulator.py` (see `backend_guardion/docs/MQTT_CONTRACT.md`).
5. **Process** — API running with lifespan so MQTT subscriber starts; `/health` → `mqtt_connected: true`.

Dev shortcut: `python register_simulator_devices.py` then `python simulators/device_simulator.py`.

---

## 12. Firmware implementation status

| Capability | Simulator / backend | Firmware (separate repo) |
|------------|--------------------|---------------------------|
| MQTT telemetry topic + QoS 1 | Done | Required |
| MQTT alerts (SOS) + QoS 2 | Done | Required |
| MQTT status heartbeat | Done | P1 |
| GNSS lat/lon in telemetry | Simulator | Required for map |
| Battery in telemetry | Simulator | Required |
| TLS / port 8883 | Backend wired | Must match env |
| Device registration | REST API | N/A (parent registers in app) |

Full gap table and cellular runbook: [`docs/FIRMWARE_INTEGRATION.md`](docs/FIRMWARE_INTEGRATION.md).

---

## 13. Cellular connectivity runbook

1. Configure SIM7080 **APN** for your carrier.
2. Point firmware at the **same broker hostname** as `MQTT_BROKER_HOST` (must resolve on carrier DNS).
3. Use port **1883** (plain) or **8883** (TLS) consistently with `MQTT_TLS_ENABLED`.
4. Open broker firewall to cellular clients.
5. Register `device_id` in Postgres before testing.
6. Smoke test from internet: `mosquitto_sub -h <host> -p 1883 -t 'guardion/devices/+/telemetry' -v`.
7. Confirm backend log: `[OK] Saved telemetry: <device_id>`.

---

## 14. Roadmap

See [`ROADMAP.md`](ROADMAP.md) for phased backend, app, firmware, and production work.
