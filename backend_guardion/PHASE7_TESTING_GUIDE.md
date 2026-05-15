# Phase 7: Geofencing Logic - Testing Guide

## Overview
Phase 7 has been successfully implemented! The backend now includes **automatic geofence breach detection** and **smart alerting**. Every time a device sends location data, the system automatically checks if the child is outside their safe zones and creates alerts.

## What Was Implemented

### 1. Geofencing Service (`app/services/geofencing.py`)
- **`calculate_distance()`** - Haversine formula for GPS distance calculation
- **`is_location_in_safezone()`** - Check if a location is within a specific safe zone
- **`check_geofence_breach()`** - Main function that:
  - Checks if device is outside ALL safe zones
  - Implements cooldown logic (default: 5 minutes)
  - Creates geofence breach alerts automatically
  - Logs distance from nearest safe zone
- **`check_low_battery_alert()`** - Automatically creates low battery alerts
  - Threshold: 20%
  - Cooldown: 1 hour

### 2. Notification Service (`app/services/notifications.py`)
- **`create_notification_for_alert()`** - Creates notifications for alerts
- Automatically generates appropriate messages for each alert type:
  - SOS alerts
  - Geofence breaches
  - Low battery
  - Device offline
  - Device tamper

### 3. MQTT Handler Integration
Updated `app/mqtt/handlers.py` to:
- **Automatically check geofences** on every telemetry message
- **Automatically check battery levels** on every telemetry message
- **Create notifications** for all alerts (SOS, breach, low battery)
- All monitoring happens in real-time as devices send data

## How Geofencing Works

### Automatic Monitoring Flow:
```
Device sends GPS → Backend saves location → Check all safe zones → 
If outside ALL zones → Check cooldown → Create breach alert → Create notification
```

### Cooldown Logic:
- **Geofence breach**: 5 minutes (configured in `.env` as `GEOFENCE_BREACH_COOLDOWN_MINUTES`)
- **Low battery**: 1 hour
- Prevents alert spam when child is moving in/out of zone boundaries

## Testing Phase 7

### Prerequisites:
1. FastAPI backend running
2. Mosquitto broker running
3. Device simulator running
4. At least one child with a safe zone configured

### Test 1: Setup Safe Zone

**1. Login and get token:**
```bash
POST http://127.0.0.1:8000/api/v1/auth/login
{
  "email": "test@example.com",
  "password": "sim123"
}
```

**2. Create a safe zone (e.g., Home):**
```bash
POST http://127.0.0.1:8000/api/v1/safezones
Authorization: Bearer <token>
{
  "child_id": "<your_child_id>",
  "zone_name": "Home",
  "center_lat": 6.5244,
  "center_lng": 3.3792,
  "radius": 200.0
}
```

### Test 2: Verify Geofence Breach Detection

**Watch FastAPI logs:**
The simulator sends location data every 30 seconds. Watch for:

```
[OK] Saved telemetry: ESP32-SIM001 | Lat: 6.5244, Lng: 3.3792, Battery: 85%
Device ESP32-SIM001 is within safe zone: Home
```

**If device moves outside the zone (simulator simulates movement):**
```
[WARNING] GEOFENCE BREACH: Device ESP32-SIM001 is outside all safe zones! 
Distance from nearest zone (Home): 250.5m
[OK] Notification created for user <user_id>: Geofence Breach: Sarah Doe
```

### Test 3: Check Alerts Created

**Get active alerts:**
```bash
GET http://127.0.0.1:8000/api/v1/alerts/active
Authorization: Bearer <token>
```

You should see alerts with `alert_type: "geofence_breach"`

### Test 4: Check Notifications

**Get notifications:**
```bash
GET http://127.0.0.1:8000/api/v1/notifications/
Authorization: Bearer <token>
```

You should see notifications for the breach:
```json
{
  "title": "Geofence Breach: Sarah Doe",
  "message": "Sarah Doe has left their designated safe zone...",
  "type": "alert",
  "read": false
}
```

### Test 5: Verify Cooldown Logic

After a breach alert is created, the simulator continues sending locations. 

**Expected behavior:**
- First breach → Alert created
- Next 5 minutes → No new alerts (cooldown active)
- After 5 minutes → New alert can be created if still outside zone

**Check logs:**
```
Geofence breach detected for ESP32-SIM001, but alert already exists within cooldown period
```

### Test 6: Low Battery Alert

If the simulator sends battery level below 20%, you should see:
```
[WARNING] LOW BATTERY: Device ESP32-SIM001 at 15%
[OK] Notification created for user <user_id>: Low Battery: Sarah Doe's Device
```

### Test 7: Manual Breach Testing with Swagger UI

1. Go to http://127.0.0.1:8000/docs
2. Use `/api/v1/safezones/{safezone_id}/check` endpoint
3. Test different locations:

**Inside safe zone:**
```json
{
  "latitude": 6.5244,
  "longitude": 3.3792
}
```
Response: `"is_within_safezone": true`

**Outside safe zone:**
```json
{
  "latitude": 6.5300,
  "longitude": 3.3900
}
```
Response: `"is_within_safezone": false, "distance_from_center": 1234.5`

## Configuration

Adjust settings in `.env`:

```env
# Geofencing Settings
DEFAULT_GEOFENCE_RADIUS=200.0
GEOFENCE_BREACH_COOLDOWN_MINUTES=5

# Alert Settings
ALERT_RETRY_ATTEMPTS=3
ALERT_ESCALATION_MINUTES=5
```

## Real-World Usage

In production:
1. Parent creates safe zones (Home, School, etc.) via mobile app
2. Child wears device that sends GPS every 30 seconds
3. Backend automatically monitors all zones in real-time
4. If child leaves any safe zone → Instant breach alert
5. Parent receives push notification on mobile app
6. Parent can view child's current location on Google Maps

## Database Tables Used

- `safe_zones` - Stores geofence definitions
- `location_history` - GPS breadcrumb trail
- `alerts` - All alerts (SOS, breach, battery, etc.)
- `notifications` - User notifications

## What's Next?

✅ **Phase 7 Complete!**

**Next phases:**
- **Phase 8:** WebSocket for real-time updates (push location updates to mobile app)
- **Phase 9:** End-to-End testing

Your backend now has intelligent, automatic geofence monitoring! 🎯
