# Phase 6 API Endpoints - Testing Guide

## Overview
All Phase 6 API endpoints have been successfully implemented! The backend now includes:

1. **Children Management** (`/api/v1/children`)
2. **Device Management** (`/api/v1/devices`)
3. **Location Queries** (`/api/v1/locations`) - For Google Maps integration
4. **Safe Zones (Geofencing)** (`/api/v1/safezones`)
5. **Alerts** (`/api/v1/alerts`)
6. **Notifications** (`/api/v1/notifications`)

## Quick Start Testing

### 1. Start the Backend
Make sure your backend, Mosquitto, and simulator are running:

```powershell
# Terminal 1: Mosquitto
& "C:\Program Files\mosquitto\mosquitto.exe" -c mosquitto.conf -v

# Terminal 2: FastAPI Backend
uvicorn app.main:app --reload

# Terminal 3: Device Simulator (if needed)
python simulators/device_simulator.py
```

### 2. Access API Documentation
Visit: http://127.0.0.1:8000/docs

You'll see all endpoints organized by tags:
- Authentication
- Users
- Children
- Devices
- Locations
- Safe Zones
- Alerts
- Notifications

## API Endpoint Summary

### Children Management (`/api/v1/children`)
- `POST /` - Create child profile
- `GET /` - List all children for user
- `GET /{child_id}` - Get specific child
- `PATCH /{child_id}` - Update child info
- `DELETE /{child_id}` - Delete child

### Device Management (`/api/v1/devices`)
- `POST /register` - Register new device
- `GET /` - List all devices for user's children
- `GET /{device_id}` - Get device details
- `PATCH /{device_id}` - Update device (reassign, change status)
- `DELETE /{device_id}` - Unregister device

### Location Queries (`/api/v1/locations`) 🗺️
**Key endpoints for Google Maps integration:**

- `GET /{device_id}/current` - Get current GPS location
  - Returns: `{latitude, longitude, accuracy, timestamp, battery_level}`
  - **Use this for real-time tracking on Google Maps!**

- `GET /{device_id}/history` - Get location history
  - Query params: `start_time`, `end_time`, `limit`
  - **Use this for route/path visualization on Google Maps!**

- `GET /child/{child_id}/current` - Get child's current location
  - Convenient endpoint to track by child instead of device

### Safe Zones (`/api/v1/safezones`)
- `POST /` - Create safe zone (geofence)
- `GET /child/{child_id}` - List all safe zones for a child
- `GET /{safezone_id}` - Get specific safe zone
- `PATCH /{safezone_id}` - Update safe zone
- `DELETE /{safezone_id}` - Delete safe zone
- `POST /{safezone_id}/check` - Check if location is within safe zone

### Alerts (`/api/v1/alerts`)
- `GET /active` - Get all active alerts
- `GET /history` - Get alert history (with filters)
- `GET /{alert_id}` - Get specific alert
- `POST /{alert_id}/acknowledge` - Acknowledge alert
- `POST /{alert_id}/resolve` - Resolve alert
- `GET /child/{child_id}/active` - Get active alerts for a child

### Notifications (`/api/v1/notifications`)
- `GET /` - Get notifications (with unread filter)
- `GET /{notification_id}` - Get specific notification
- `POST /mark-read` - Mark notifications as read
- `POST /mark-all-read` - Mark all as read
- `DELETE /{notification_id}` - Delete notification
- `GET /unread/count` - Get unread count (for badges)

## Example API Workflow

### 1. User Registration & Login
```bash
# Register
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "phone_number": "+2348012345678"
}

# Login
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "securepass123"
}
# Returns: {"access_token": "...", "refresh_token": "..."}
```

### 2. Create Child Profile
```bash
POST /api/v1/children
Authorization: Bearer <access_token>
{
  "name": "Sarah Doe",
  "age": 8,
  "profile_photo": "https://example.com/photo.jpg"
}
# Returns: {" id": "...", "name": "Sarah Doe", ...}
```

### 3. Register Device
```bash
POST /api/v1/devices/register
Authorization: Bearer <access_token>
{
  "device_id": "ESP32-PROD001",
  "child_id": "<child_id from step 2>"
}
```

### 4. Get Current Location (For Google Maps)
```bash
GET /api/v1/locations/ESP32-PROD001/current
Authorization: Bearer <access_token>

# Returns:
{
  "latitude": 6.5244,
  "longitude": 3.3792,
  "accuracy": 10.5,
  "timestamp": "2026-05-11T12:00:00Z",
  "battery_level": 85.0
}
```

### 5. Create Safe Zone
```bash
POST /api/v1/safezones
Authorization: Bearer <access_token>
{
  "child_id": "<child_id>",
  "zone_name": "Home",
  "center_lat": 6.5244,
  "center_lng": 3.3792,
  "radius": 200.0
}
```

### 6. Get Active Alerts
```bash
GET /api/v1/alerts/active
Authorization: Bearer <access_token>
```

## Testing with Swagger UI

1. Go to http://127.0.0.1:8000/docs
2. Click "Authorize" button at the top
3. Login via `/api/v1/auth/login` to get access token
4. Paste the token in the authorization dialog
5. Try out any endpoint!

## Google Maps Integration (Frontend)

When building your React Native app, you'll use these endpoints:

```javascript
// Get current location
const response = await fetch(
  'http://your-api.com/api/v1/locations/ESP32-PROD001/current',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
const location = await response.json();

// Display on Google Maps
<MapView
  initialRegion={{
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }}
>
  <Marker 
    coordinate={{
      latitude: location.latitude,
      longitude: location.longitude
    }}
    title="Child's Location"
  />
</MapView>
```

## Next Steps

✅ **Phase 6 Complete!**

**What's next:**
- **Phase 7:** Geofencing Logic (automatic breach detection)
- **Phase 8:** WebSocket Real-Time Updates
- **Phase 9:** End-to-End Testing

Your backend is now fully functional for location tracking, alerts, and notifications!
