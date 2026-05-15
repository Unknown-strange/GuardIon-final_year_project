# GuardIon Backend Architecture Plan

## Overview
FastAPI-based backend for the GuardIon smart child security and real-time location monitoring system. This document outlines the complete architecture, implementation strategy, and development roadmap.

---

## Technology Stack

### Core Framework
- **FastAPI** - Modern Python web framework with automatic OpenAPI documentation
- **Python 3.11+** - Async/await support, type hints
- **Uvicorn** - ASGI server for production deployment

### Database & ORM
- **PostgreSQL 15+** - Primary data store
- **SQLAlchemy 2.0** - ORM with async support
- **Alembic** - Database migration management

### Real-Time Communication
- **MQTT (Paho-MQTT)** - IoT device communication protocol
- **WebSockets** - Real-time frontend updates
- **Redis** - Caching and pub/sub for WebSocket broadcasting

### Authentication & Security
- **JWT (PyJWT)** - Token-based authentication
- **Passlib + Bcrypt** - Password hashing
- **Python-JOSE** - JWT token handling
- **CORS middleware** - Cross-origin request handling

### Additional Libraries
- **Pydantic v2** - Data validation and settings management
- **Geopy** - Geospatial calculations (Haversine distance)
- **APScheduler** - Background job scheduling
- **Python-dotenv** - Environment variable management
- **Asyncio** - Async task management

---

## Project Structure

```
backend_guardion/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application entry point
│   ├── config.py                   # Configuration and environment variables
│   ├── database.py                 # Database connection and session management
│   │
│   ├── models/                     # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py                 # Users table
│   │   ├── child.py                # Children table
│   │   ├── device.py               # Devices, DeviceHealth tables
│   │   ├── location.py             # LocationHistory table
│   │   ├── safezone.py             # SafeZones table
│   │   ├── alert.py                # Alerts, AlertResponse tables
│   │   ├── event.py                # Events table
│   │   ├── notification.py         # Notifications table
│   │   └── guardian.py             # Guardian junction table
│   │
│   ├── schemas/                    # Pydantic schemas for request/response validation
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── child.py
│   │   ├── device.py
│   │   ├── location.py
│   │   ├── safezone.py
│   │   ├── alert.py
│   │   ├── event.py
│   │   └── notification.py
│   │
│   ├── api/                        # API route handlers
│   │   ├── __init__.py
│   │   ├── deps.py                 # Dependency injection (auth, DB session)
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Login, register, token refresh
│   │   │   ├── users.py            # User profile management
│   │   │   ├── children.py         # Child profile CRUD
│   │   │   ├── devices.py          # Device registration and management
│   │   │   ├── locations.py        # Location history queries
│   │   │   ├── safezones.py        # Geofence CRUD operations
│   │   │   ├── alerts.py           # Alert retrieval and response
│   │   │   ├── notifications.py    # Notification management
│   │   │   └── websocket.py        # WebSocket endpoint for real-time updates
│   │
│   ├── services/                   # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py         # Authentication logic
│   │   ├── device_service.py       # Device management
│   │   ├── location_service.py     # Location processing and storage
│   │   ├── geofence_service.py     # Geofencing calculations
│   │   ├── alert_service.py        # Alert creation and management
│   │   ├── notification_service.py # Push notification delivery
│   │   └── websocket_service.py    # WebSocket broadcasting
│   │
│   ├── mqtt/                       # MQTT client and message handlers
│   │   ├── __init__.py
│   │   ├── client.py               # MQTT client setup and connection
│   │   ├── handlers.py             # Message processing logic
│   │   └── topics.py               # Topic structure definitions
│   │
│   ├── utils/                      # Utility functions
│   │   ├── __init__.py
│   │   ├── security.py             # JWT, password hashing
│   │   ├── geo.py                  # Geospatial calculations
│   │   ├── validators.py           # Custom validation functions
│   │   └── formatters.py           # Data formatting helpers
│   │
│   └── tasks/                      # Background tasks and scheduled jobs
│       ├── __init__.py
│       ├── cleanup.py              # Data retention and cleanup
│       ├── health_check.py         # Device health monitoring
│       └── analytics.py            # Usage analytics and reporting
│
├── alembic/                        # Database migrations
│   ├── versions/
│   ├── env.py
│   └── alembic.ini
│
├── tests/                          # Unit and integration tests
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_devices.py
│   ├── test_geofencing.py
│   └── test_mqtt.py
│
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variable template
├── .gitignore
├── README.md                       # Setup and development guide
└── MQTT_IMPLEMENTATION.md          # MQTT architecture documentation
```

---

## Database Schema Implementation

### Models Overview

#### 1. **Users Model**
```python
- id: UUID (PK)
- name: String
- email: String (unique, indexed)
- password: String (hashed)
- phone_number: String
- created_at: DateTime
- Relationships: children (many), guardians (many)
```

#### 2. **Children Model**
```python
- id: UUID (PK)
- user_id: UUID (FK)
- name: String
- age: Integer
- profile_photo: String (URL/path)
- created_at: DateTime
- Relationships: devices (many), safezones (many), events (many)
```

#### 3. **Devices Model**
```python
- id: UUID (PK)
- device_id: String (unique, indexed)
- child_id: UUID (FK)
- status: Enum (active, inactive, lost)
- battery_level: Integer
- signal_strength: Integer
- last_seen: DateTime (indexed)
- created_at: DateTime
- Relationships: location_history (many), device_health (many)
```

#### 4. **LocationHistory Model**
```python
- id: UUID (PK)
- device_id: UUID (FK)
- latitude: Float
- longitude: Float
- timestamp: DateTime (indexed)
- Indexes: composite (device_id, timestamp) for efficient queries
```

#### 5. **SafeZones Model**
```python
- id: UUID (PK)
- child_id: UUID (FK)
- zone_name: String
- center_lat: Float
- center_lng: Float
- radius: Float (meters)
- created_at: DateTime
```

#### 6. **Alerts Model**
```python
- id: UUID (PK)
- child_id: UUID (FK)
- device_id: UUID (FK)
- alert_type: Enum (geofence_breach, SOS, low_battery)
- location_lat: Float
- location_lng: Float
- status: Enum (active, acknowledged, resolved)
- confidence: Float
- unprocessed: Boolean
- resolved_at: DateTime
- created_at: DateTime (indexed)
- Relationships: alert_responses (many)
```

#### 7. **Events Model**
```python
- id: UUID (PK)
- device_id: UUID (FK)
- child_id: UUID (FK)
- event_type: Enum (movement, geofence_exit, emergency)
- latitude: Float
- longitude: Float
- metadata: JSON
- confidence: Float
- unprocessed: Boolean
- created_at: DateTime (indexed)
```

---

## API Endpoints Design

### Authentication (`/api/v1/auth`)
```
POST   /register              - User registration
POST   /login                 - JWT token authentication
POST   /refresh               - Refresh access token
POST   /logout                - Invalidate token
GET    /me                    - Get current user profile
```

### Users (`/api/v1/users`)
```
GET    /me                    - Get current user details
PATCH  /me                    - Update user profile
DELETE /me                    - Delete user account
GET    /me/children           - List all children for user
```

### Children (`/api/v1/children`)
```
POST   /                      - Create child profile
GET    /                      - List all children (paginated)
GET    /{child_id}            - Get specific child details
PATCH  /{child_id}            - Update child profile
DELETE /{child_id}            - Delete child profile
GET    /{child_id}/location   - Get current location
GET    /{child_id}/history    - Get location history (time range)
```

### Devices (`/api/v1/devices`)
```
POST   /register              - Register new wearable device
GET    /                      - List all devices for user
GET    /{device_id}           - Get device details
PATCH  /{device_id}           - Update device settings
DELETE /{device_id}           - Unregister device
GET    /{device_id}/health    - Get device health metrics
POST   /{device_id}/command   - Send command to device (future feature)
```

### Locations (`/api/v1/locations`)
```
GET    /{device_id}/current   - Get latest location
GET    /{device_id}/history   - Get location history (with time filters)
GET    /{device_id}/heatmap   - Get aggregated location data for heatmap
```

### Safe Zones (`/api/v1/safezones`)
```
POST   /                      - Create geofence
GET    /                      - List all safezones for user's children
GET    /{zone_id}             - Get specific zone
PATCH  /{zone_id}             - Update zone parameters
DELETE /{zone_id}             - Delete zone
POST   /{zone_id}/test        - Test if coordinates are inside zone
```

### Alerts (`/api/v1/alerts`)
```
GET    /                      - List all alerts (filtered by status, type)
GET    /{alert_id}            - Get specific alert details
POST   /{alert_id}/acknowledge - Acknowledge alert
POST   /{alert_id}/resolve    - Mark alert as resolved
GET    /active                - Get all active alerts for user
GET    /history               - Get alert history (paginated)
```

### Notifications (`/api/v1/notifications`)
```
GET    /                      - List all notifications
PATCH  /{notification_id}/read - Mark as read
POST   /register-token        - Register FCM/push notification token
DELETE /unregister-token      - Remove notification token
```

### WebSocket (`/api/v1/ws`)
```
WS     /{user_id}             - WebSocket connection for real-time updates
```

---

## Core Services Implementation

### 1. **Authentication Service**
**Responsibilities:**
- User registration with password hashing
- JWT token generation and validation
- Token refresh logic
- Password reset functionality

**Key Functions:**
```python
async def register_user(email, password, name, phone)
async def authenticate_user(email, password) -> JWT
async def get_current_user(token) -> User
async def refresh_access_token(refresh_token) -> JWT
```

### 2. **Device Service**
**Responsibilities:**
- Device registration and pairing
- Device status management
- Battery level tracking
- Last-seen timestamp updates

**Key Functions:**
```python
async def register_device(device_id, child_id, user_id)
async def update_device_status(device_id, status, battery, signal)
async def get_device_by_id(device_id) -> Device
async def check_device_ownership(device_id, user_id) -> bool
```

### 3. **Location Service**
**Responsibilities:**
- Store incoming GPS coordinates
- Retrieve location history
- Calculate movement patterns
- Generate heatmap data

**Key Functions:**
```python
async def save_location(device_id, lat, lng, timestamp)
async def get_current_location(device_id) -> Location
async def get_location_history(device_id, start_time, end_time) -> List[Location]
async def calculate_distance_traveled(device_id, time_range) -> float
```

### 4. **Geofence Service**
**Responsibilities:**
- Validate zone coordinates
- Check if location is within safe zone
- Detect zone breaches
- Calculate entry/exit events

**Key Functions:**
```python
async def create_safezone(child_id, name, center_lat, center_lng, radius)
async def check_geofence_breach(location, child_id) -> bool
def calculate_distance(lat1, lng1, lat2, lng2) -> float  # Haversine formula
async def get_nearest_safezone(location, child_id) -> SafeZone
```

### 5. **Alert Service**
**Responsibilities:**
- Create alerts from events
- Prioritize alerts by severity
- Manage alert lifecycle (active → acknowledged → resolved)
- Trigger notifications to guardians

**Key Functions:**
```python
async def create_alert(alert_type, child_id, device_id, location, metadata)
async def get_active_alerts(user_id) -> List[Alert]
async def acknowledge_alert(alert_id, user_id)
async def resolve_alert(alert_id, user_id, response_text)
async def escalate_alert(alert_id)  # For unacknowledged critical alerts
```

### 6. **Notification Service**
**Responsibilities:**
- Send push notifications to mobile apps
- SMS fallback for critical alerts
- Email notifications
- Notification delivery tracking

**Key Functions:**
```python
async def send_push_notification(user_id, title, body, data)
async def send_sms_alert(phone_number, message)
async def send_email_notification(email, subject, body)
async def register_push_token(user_id, token, platform)
async def broadcast_to_guardians(child_id, message)
```

### 7. **WebSocket Service**
**Responsibilities:**
- Manage active WebSocket connections
- Broadcast real-time updates to connected clients
- Handle connection lifecycle

**Key Functions:**
```python
async def connect_user(websocket, user_id)
async def disconnect_user(user_id)
async def broadcast_location_update(child_id, location)
async def broadcast_alert(user_id, alert)
```

---

## Security Implementation

### 1. **Authentication Flow**
```
1. User sends credentials → POST /api/v1/auth/login
2. Backend validates credentials
3. Generate JWT access token (15 min expiry) and refresh token (7 days)
4. Return both tokens
5. Client includes access token in Authorization header for subsequent requests
6. When access token expires, use refresh token → POST /api/v1/auth/refresh
```

### 2. **JWT Token Structure**
```json
{
  "sub": "user_id",
  "email": "parent@example.com",
  "exp": 1234567890,
  "iat": 1234567800,
  "type": "access"
}
```

### 3. **Password Security**
- Bcrypt hashing with cost factor 12
- Minimum password length: 8 characters
- Password complexity requirements (optional)

### 4. **API Security Measures**
- Rate limiting on authentication endpoints (5 attempts per minute)
- HTTPS enforcement in production
- CORS configured for allowed frontend origins
- Input validation using Pydantic schemas
- SQL injection prevention via SQLAlchemy ORM
- XSS protection via content security policy

### 5. **Device Authentication**
- Unique device ID + shared secret for MQTT authentication
- TLS encryption for MQTT connections
- Device ownership verification before accepting telemetry

---

## Geofencing Algorithm

### Haversine Distance Calculation
```python
from math import radians, sin, cos, sqrt, atan2

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two GPS coordinates in meters
    """
    R = 6371000  # Earth radius in meters
    
    φ1 = radians(lat1)
    φ2 = radians(lat2)
    Δφ = radians(lat2 - lat1)
    Δλ = radians(lon2 - lon1)
    
    a = sin(Δφ/2)**2 + cos(φ1) * cos(φ2) * sin(Δλ/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c
```

### Breach Detection Logic
```python
async def check_breach(device_id: str, lat: float, lng: float):
    # Get child associated with device
    device = await get_device(device_id)
    child_id = device.child_id
    
    # Get all active safezones for this child
    safezones = await get_active_safezones(child_id)
    
    is_inside_any_zone = False
    
    for zone in safezones:
        distance = haversine_distance(lat, lng, zone.center_lat, zone.center_lng)
        
        if distance <= zone.radius:
            is_inside_any_zone = True
            break
    
    # If not inside any zone, create breach alert
    if not is_inside_any_zone and len(safezones) > 0:
        await create_alert(
            alert_type="geofence_breach",
            child_id=child_id,
            device_id=device_id,
            location_lat=lat,
            location_lng=lng
        )
```

### Debouncing Strategy
To prevent alert spam when child is near zone boundary:
- Store last breach state
- Only trigger alert if breach persists for 2 consecutive location updates
- Cooldown period of 5 minutes after alert before checking again

---

## Background Tasks

### 1. **Device Health Monitoring**
Run every 5 minutes:
- Check `last_seen` timestamp for all active devices
- If device hasn't reported in 15 minutes, create "device_offline" alert
- Update device status to "inactive" if offline > 1 hour

### 2. **Data Retention Cleanup**
Run daily at 2 AM:
- Delete `LocationHistory` records older than 90 days
- Archive old alerts (older than 1 year)
- Clean up expired notification tokens

### 3. **Alert Escalation**
Run every 1 minute:
- Check for unacknowledged critical alerts (SOS) older than 5 minutes
- Escalate to secondary guardians
- Send SMS fallback if push notifications unread

### 4. **Analytics Generation**
Run daily at midnight:
- Calculate daily movement statistics per child
- Generate battery health reports per device
- Aggregate alert frequency metrics

---

## Error Handling Strategy

### HTTP Status Codes
```
200 - Success
201 - Created
204 - No Content (successful deletion)
400 - Bad Request (validation errors)
401 - Unauthorized (missing/invalid token)
403 - Forbidden (insufficient permissions)
404 - Not Found
409 - Conflict (duplicate device ID)
422 - Unprocessable Entity (invalid data)
429 - Too Many Requests (rate limit)
500 - Internal Server Error
503 - Service Unavailable (MQTT broker down)
```

### Error Response Format
```json
{
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "Device with ID 'ESP32-001' not found",
    "details": {
      "device_id": "ESP32-001"
    }
  }
}
```

### Logging Strategy
- Use Python `logging` module with structured logging
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Log all incoming MQTT messages (INFO level)
- Log authentication attempts (INFO level)
- Log all errors with stack traces (ERROR level)
- Store logs in files with rotation (10 MB per file, keep 5 files)

---

## Performance Optimization

### 1. **Database Indexing**
```sql
-- Critical indexes
CREATE INDEX idx_devices_last_seen ON devices(last_seen);
CREATE INDEX idx_location_device_timestamp ON location_history(device_id, timestamp DESC);
CREATE INDEX idx_alerts_status_created ON alerts(status, created_at DESC);
CREATE INDEX idx_users_email ON users(email);
```

### 2. **Caching Strategy**
Use Redis for:
- Current device locations (TTL: 5 minutes)
- Active safezones per child (TTL: 1 hour)
- User session data
- Rate limiting counters

### 3. **Database Query Optimization**
- Use connection pooling (pool size: 20)
- Implement cursor-based pagination for large datasets
- Use `select_related` / `joinedload` for relationship queries
- Batch insert location history records

### 4. **MQTT Message Processing**
- Use async message handlers to avoid blocking
- Implement message queue (Redis) for burst traffic handling
- Batch database writes every 5 seconds instead of per-message

---

## Deployment Considerations

### Environment Variables (.env)
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/guardion

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# MQTT
MQTT_BROKER_HOST=broker.hivemq.com
MQTT_BROKER_PORT=1883
MQTT_USERNAME=guardion_backend
MQTT_PASSWORD=secure_password
MQTT_TLS_ENABLED=true

# Redis
REDIS_URL=redis://localhost:6379/0

# Push Notifications
FCM_SERVER_KEY=your-fcm-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://guardion-app.com

# App
DEBUG=false
LOG_LEVEL=INFO
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Checklist
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up database backups (automated daily)
- [ ] Configure log aggregation (ELK stack or CloudWatch)
- [ ] Implement health check endpoint (`/health`)
- [ ] Set up monitoring and alerting (Prometheus + Grafana)
- [ ] Use environment-specific configurations
- [ ] Enable MQTT TLS encryption
- [ ] Set up CI/CD pipeline
- [ ] Load testing with realistic traffic patterns
- [ ] Disaster recovery plan documented

---

## Testing Strategy

### Unit Tests
- Test all service functions independently
- Mock external dependencies (database, MQTT, Redis)
- Aim for 80%+ code coverage

### Integration Tests
- Test API endpoints with real database (test DB)
- Test MQTT message flow end-to-end
- Test geofencing calculations with known coordinates

### Load Tests
- Simulate 1000 devices sending data every 30 seconds
- Test WebSocket connection handling (100+ concurrent connections)
- Database query performance under load

---

## Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up project structure
- [ ] Configure database and create all models
- [ ] Implement alembic migrations
- [ ] Basic authentication endpoints

### Phase 2: Core Features (Week 3-4)
- [ ] Device management endpoints
- [ ] Location storage and retrieval
- [ ] Geofencing logic implementation
- [ ] Alert system

### Phase 3: Real-Time Communication (Week 5-6)
- [ ] MQTT client integration
- [ ] WebSocket implementation
- [ ] Redis caching layer
- [ ] Background task scheduling

### Phase 4: Advanced Features (Week 7-8)
- [ ] Push notification service
- [ ] SMS/Email alerts
- [ ] Analytics and reporting
- [ ] Admin dashboard

### Phase 5: Testing & Deployment (Week 9-10)
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Docker containerization
- [ ] Production deployment
- [ ] Documentation and API guide

---

## API Documentation

FastAPI automatically generates:
- **Swagger UI**: Available at `/docs`
- **ReDoc**: Available at `/redoc`
- **OpenAPI JSON**: Available at `/openapi.json`

Ensure all endpoints have:
- Clear descriptions
- Request/response schema examples
- Possible error responses documented
- Authentication requirements specified

---

## Monitoring & Observability

### Metrics to Track
- API response times (p50, p95, p99)
- MQTT message processing rate
- Database query performance
- Active WebSocket connections
- Alert response time (creation to acknowledgment)
- Device online/offline ratio
- Location update frequency per device

### Health Check Endpoint
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": await check_db_connection(),
        "mqtt": await check_mqtt_connection(),
        "redis": await check_redis_connection(),
        "timestamp": datetime.utcnow()
    }
```

---

## Conclusion

This backend architecture provides a robust, scalable foundation for the GuardIon child safety system. The separation of concerns (models, schemas, services, API routes) ensures maintainability, while the async-first approach guarantees high performance under load. The comprehensive error handling, security measures, and real-time capabilities make this production-ready for IoT deployments.

Next steps: Implement MQTT integration as detailed in `MQTT_IMPLEMENTATION.md`.
