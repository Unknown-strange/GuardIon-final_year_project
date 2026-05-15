# GuardIon Development Workflow & Testing Guide

## Overview
This document provides a complete step-by-step workflow for building the GuardIon child security system, with a focus on **testing without physical hardware**. Since the ESP32 wearable device hasn't been built yet, we'll use device simulators and mock data to develop and test the entire system.

---

## Development Philosophy

### Key Principle: Backend-First Development
**Build and test the backend + frontend FIRST using simulated device data, THEN integrate real hardware.**

```
Phase 1: Database & API → Phase 2: MQTT Backend → Phase 3: Device Simulator → 
Phase 4: Frontend → Phase 5: Integration Testing → Phase 6: Hardware Integration
```

### Why This Approach?
- ✅ Test business logic independently of hardware
- ✅ Iterate faster without hardware constraints
- ✅ Identify and fix bugs in software before hardware integration
- ✅ Frontend development can proceed in parallel
- ✅ Hardware team can work independently with clear API contract

---

## Project Structure

```
final_year_project/
├── backend_guardion/              # FastAPI backend
│   ├── app/
│   │   ├── models/               # Database models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── api/                  # API endpoints
│   │   ├── services/             # Business logic
│   │   ├── mqtt/                 # MQTT client
│   │   └── utils/                # Utilities
│   ├── tests/                    # Backend tests
│   ├── simulators/               # Device simulators (NEW)
│   ├── alembic/                  # Database migrations
│   ├── requirements.txt
│   └── .env
│
├── guardIon/                      # React Native frontend
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/             # API clients
│   │   └── utils/
│   └── __tests__/                # Frontend tests
│
├── hardware/                      # ESP32 firmware (future)
│   └── guardion_firmware/
│       ├── main.ino
│       └── test_scripts/
│
└── docs/
    ├── BACKEND_ARCHITECTURE.md
    ├── MQTT_IMPLEMENTATION.md
    └── DEVELOPMENT_WORKFLOW.md   # This file
```

---

## Phase 1: Environment Setup (Day 1-2)

### 1.1 Install Required Software

#### Backend Development
```bash
# Python 3.11+
python --version

# PostgreSQL 15+
# Windows: Download from https://www.postgresql.org/download/windows/
# Verify installation
psql --version

# Redis (for caching)
# Windows: Download from https://github.com/microsoftarchive/redis/releases
redis-cli --version

# MQTT Broker (Mosquitto for local testing)
# Windows: Download from https://mosquitto.org/download/
mosquitto -h
```

#### Frontend Development
```bash
# Node.js 18+
node --version
npm --version

# React Native CLI
npm install -g react-native-cli
```

#### Testing Tools
```bash
# MQTT clients
pip install paho-mqtt asyncio-mqtt

# MQTT Explorer (GUI tool)
# Download: http://mqtt-explorer.com/

# Postman (API testing)
# Download: https://www.postman.com/downloads/
```

### 1.2 Create Development Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE guardion_dev;
CREATE DATABASE guardion_test;

# Create user
CREATE USER guardion_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE guardion_dev TO guardion_user;
GRANT ALL PRIVILEGES ON DATABASE guardion_test TO guardion_user;

# Exit
\q
```

### 1.3 Setup MQTT Broker

#### Option A: Local Mosquitto (Recommended for Development)
```bash
# Start Mosquitto
mosquitto -c mosquitto.conf -v

# Test connection
mosquitto_sub -h localhost -p 1883 -t "test" -v
mosquitto_pub -h localhost -p 1883 -t "test" -m "Hello MQTT"
```

#### Option B: HiveMQ Cloud (Production-like)
1. Sign up at https://www.hivemq.com/
2. Create cluster (free tier)
3. Note credentials: host, port, username, password

### 1.4 Initialize Backend Project
```bash
cd backend_guardion

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary \
    pydantic pydantic-settings python-jose passlib bcrypt \
    paho-mqtt asyncio-mqtt redis python-dotenv \
    pytest pytest-asyncio httpx

# Save dependencies
pip freeze > requirements.txt
```

### 1.5 Create Environment Configuration
```bash
# Create .env file
cp .env.example .env
```

**`.env` file:**
```env
# Database
DATABASE_URL=postgresql://guardion_user:secure_password@localhost:5432/guardion_dev
DATABASE_URL_TEST=postgresql://guardion_user:secure_password@localhost:5432/guardion_test

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# MQTT
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=backend_user
MQTT_PASSWORD=backend_pass
MQTT_TLS_ENABLED=false

# Redis
REDIS_URL=redis://localhost:6379/0

# App Config
DEBUG=true
LOG_LEVEL=DEBUG
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Simulator Config (for testing without hardware)
SIMULATOR_ENABLED=true
SIMULATOR_DEVICE_COUNT=3
```

---

## Phase 2: Database & Models (Day 3-5)

### 2.1 Create Database Models

**Implementation Order:**
1. `models/user.py` - Users table
2. `models/child.py` - Children table
3. `models/device.py` - Devices and DeviceHealth tables
4. `models/guardian.py` - Guardian junction table
5. `models/location.py` - LocationHistory table
6. `models/safezone.py` - SafeZones table
7. `models/event.py` - Events table
8. `models/alert.py` - Alerts and AlertResponse tables
9. `models/notification.py` - Notifications table

**Example: `app/models/user.py`**
```python
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone_number = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    children = relationship("Child", back_populates="user")
    guardians = relationship("Guardian", back_populates="user")
```

### 2.2 Setup Alembic Migrations
```bash
# Initialize Alembic
alembic init alembic

# Edit alembic.ini - set database URL
sqlalchemy.url = postgresql://guardion_user:secure_password@localhost:5432/guardion_dev

# Create initial migration
alembic revision --autogenerate -m "Initial database schema"

# Apply migrations
alembic upgrade head
```

### 2.3 Verify Database Schema
```bash
# Connect to database
psql -U guardion_user -d guardion_dev

# List tables
\dt

# Check Users table structure
\d users

# Expected output: 11 tables created
```

### 2.4 Testing: Database Models

**Create `tests/test_models.py`:**
```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.user import User
from app.models.child import Child
from app.models.device import Device


@pytest.fixture
def test_db():
    """Create test database session"""
    engine = create_engine("postgresql://guardion_user:secure_password@localhost:5432/guardion_test")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(engine)


def test_create_user(test_db):
    """Test user creation"""
    user = User(
        name="Test Parent",
        email="parent@test.com",
        password="hashed_password",
        phone_number="+2348012345678"
    )
    test_db.add(user)
    test_db.commit()
    
    assert user.id is not None
    assert user.email == "parent@test.com"


def test_user_child_relationship(test_db):
    """Test user-child relationship"""
    user = User(name="Parent", email="parent@test.com", password="hash")
    test_db.add(user)
    test_db.commit()
    
    child = Child(user_id=user.id, name="Test Child", age=8)
    test_db.add(child)
    test_db.commit()
    
    assert len(user.children) == 1
    assert user.children[0].name == "Test Child"


def test_device_creation(test_db):
    """Test device model"""
    user = User(name="Parent", email="parent@test.com", password="hash")
    test_db.add(user)
    test_db.commit()
    
    child = Child(user_id=user.id, name="Child", age=10)
    test_db.add(child)
    test_db.commit()
    
    device = Device(
        device_id="ESP32-TEST001",
        child_id=child.id,
        status="active",
        battery_level=85
    )
    test_db.add(device)
    test_db.commit()
    
    assert device.device_id == "ESP32-TEST001"
    assert device.child_id == child.id
```

**Run tests:**
```bash
pytest tests/test_models.py -v
```

**✅ Checkpoint:** All database models created and tested

---

## Phase 3: Authentication & Basic API (Day 6-8)

### 3.1 Implement Authentication Service

**Create `app/services/auth_service.py`:**
```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.user import User
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    async def authenticate_user(db: Session, email: str, password: str):
        user = db.query(User).filter(User.email == email).first()
        if not user or not AuthService.verify_password(password, user.password):
            return None
        return user
```

### 3.2 Create Authentication Endpoints

**Create `app/api/v1/auth.py`:**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserLogin, Token
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register new user"""
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password=AuthService.hash_password(user_data.password),
        phone_number=user_data.phone_number
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User created successfully", "user_id": str(user.id)}


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token"""
    user = await AuthService.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = AuthService.create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = AuthService.create_access_token(data={"sub": str(user.id), "type": "refresh"})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
```

### 3.3 Testing: Authentication API

**Create `tests/test_auth.py`:**
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Reset database before each test"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_register_user():
    """Test user registration"""
    response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepass123",
        "phone_number": "+2348012345678"
    })
    
    assert response.status_code == 201
    assert "user_id" in response.json()


def test_register_duplicate_email():
    """Test duplicate email rejection"""
    user_data = {
        "name": "Test User",
        "email": "duplicate@example.com",
        "password": "password123",
        "phone_number": "+2348012345678"
    }
    
    # First registration
    client.post("/api/v1/auth/register", json=user_data)
    
    # Duplicate registration
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login_success():
    """Test successful login"""
    # Register user
    client.post("/api/v1/auth/register", json={
        "name": "Login Test",
        "email": "login@test.com",
        "password": "testpass123",
        "phone_number": "+2348012345678"
    })
    
    # Login
    response = client.post("/api/v1/auth/login", json={
        "email": "login@test.com",
        "password": "testpass123"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials():
    """Test login with wrong password"""
    # Register user
    client.post("/api/v1/auth/register", json={
        "name": "User",
        "email": "user@test.com",
        "password": "correctpass",
        "phone_number": "+2348012345678"
    })
    
    # Login with wrong password
    response = client.post("/api/v1/auth/login", json={
        "email": "user@test.com",
        "password": "wrongpass"
    })
    
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]
```

**Run tests:**
```bash
pytest tests/test_auth.py -v
```

**✅ Checkpoint:** Authentication working with tests passing

---

## Phase 4: Device Simulator (Day 9-10)

### 4.1 Create MQTT Device Simulator

**THIS IS KEY**: Since we don't have physical ESP32 devices yet, we'll create Python scripts that simulate device behavior.

**Create `simulators/device_simulator.py`:**
```python
#!/usr/bin/env python3
"""
ESP32 Device Simulator
Simulates multiple wearable devices publishing MQTT messages
"""

import time
import json
import random
from datetime import datetime
import paho.mqtt.client as mqtt
from typing import List, Dict


class DeviceSimulator:
    def __init__(self, device_id: str, broker_host: str, broker_port: int, 
                 username: str = None, password: str = None):
        self.device_id = device_id
        self.broker_host = broker_host
        self.broker_port = broker_port
        
        # MQTT Client
        self.client = mqtt.Client(client_id=device_id)
        if username and password:
            self.client.username_pw_set(username, password)
        
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        
        # Device state
        self.latitude = 6.5244 + random.uniform(-0.01, 0.01)  # Lagos, Nigeria area
        self.longitude = 3.3792 + random.uniform(-0.01, 0.01)
        self.battery_level = 100
        self.is_moving = False
        self.movement_speed = 0.0001  # Degrees per update
        
        # Topics
        self.topic_telemetry = f"guardion/devices/{device_id}/telemetry"
        self.topic_alerts = f"guardion/devices/{device_id}/alerts"
        self.topic_status = f"guardion/devices/{device_id}/status"
        self.topic_health = f"guardion/devices/{device_id}/health"
    
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"[{self.device_id}] Connected to MQTT broker")
            self.publish_status("online")
        else:
            print(f"[{self.device_id}] Connection failed: {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        print(f"[{self.device_id}] Disconnected from broker")
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_start()
            time.sleep(1)  # Wait for connection
        except Exception as e:
            print(f"[{self.device_id}] Connection error: {e}")
    
    def disconnect(self):
        """Disconnect from broker"""
        self.publish_status("offline")
        self.client.loop_stop()
        self.client.disconnect()
    
    def publish_telemetry(self):
        """Simulate GPS telemetry message"""
        # Simulate movement
        if self.is_moving:
            self.latitude += random.uniform(-self.movement_speed, self.movement_speed)
            self.longitude += random.uniform(-self.movement_speed, self.movement_speed)
        
        # Simulate battery drain
        self.battery_level = max(0, self.battery_level - random.uniform(0.1, 0.5))
        
        payload = {
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "location": {
                "latitude": round(self.latitude, 6),
                "longitude": round(self.longitude, 6),
                "accuracy": round(random.uniform(5.0, 15.0), 1),
                "altitude": round(random.uniform(40.0, 60.0), 1),
                "speed": round(random.uniform(0.0, 2.0), 1) if self.is_moving else 0.0
            },
            "battery": {
                "level": int(self.battery_level),
                "voltage": round(3.3 + (self.battery_level / 100) * 0.9, 2),
                "charging": False
            },
            "signal": {
                "strength": random.randint(-90, -60),
                "quality": random.randint(70, 100)
            },
            "metadata": {
                "firmware_version": "1.0.0-simulator",
                "update_reason": "periodic"
            }
        }
        
        self.client.publish(self.topic_telemetry, json.dumps(payload), qos=1)
        print(f"[{self.device_id}] Telemetry published: Lat={payload['location']['latitude']:.4f}, "
              f"Lng={payload['location']['longitude']:.4f}, Battery={int(self.battery_level)}%")
    
    def publish_alert(self, alert_type: str = "SOS"):
        """Simulate emergency alert"""
        payload = {
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "alert_type": alert_type,
            "priority": "critical" if alert_type == "SOS" else "high",
            "location": {
                "latitude": round(self.latitude, 6),
                "longitude": round(self.longitude, 6),
                "accuracy": round(random.uniform(5.0, 10.0), 1)
            },
            "metadata": {
                "button_press_count": 3 if alert_type == "SOS" else 0,
                "battery_level": int(self.battery_level)
            }
        }
        
        self.client.publish(self.topic_alerts, json.dumps(payload), qos=2)
        print(f"[{self.device_id}] 🚨 ALERT PUBLISHED: {alert_type}")
    
    def publish_status(self, status: str):
        """Publish device status"""
        payload = {
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": status,
            "uptime_seconds": random.randint(0, 86400),
            "network": {
                "operator": "MTN",
                "connection_type": "LTE",
                "ip_address": f"10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}"
            },
            "memory": {
                "free_heap": random.randint(30000, 50000),
                "total_heap": 320000
            }
        }
        
        self.client.publish(self.topic_status, json.dumps(payload), qos=1)
        print(f"[{self.device_id}] Status: {status}")
    
    def publish_health(self):
        """Publish device health diagnostics"""
        payload = {
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "diagnostics": {
                "gps_fix_time_ms": random.randint(2000, 5000),
                "mqtt_reconnections": 0,
                "failed_publishes": 0,
                "average_publish_latency_ms": random.randint(100, 300)
            },
            "sensors": {
                "gps_status": "fix_3d",
                "accelerometer_ok": True,
                "temperature_c": round(random.uniform(25.0, 35.0), 1)
            }
        }
        
        self.client.publish(self.topic_health, json.dumps(payload), qos=0)
        print(f"[{self.device_id}] Health metrics published")
    
    def set_movement(self, is_moving: bool):
        """Toggle movement simulation"""
        self.is_moving = is_moving
        print(f"[{self.device_id}] Movement: {'ON' if is_moving else 'OFF'}")
    
    def set_location(self, latitude: float, longitude: float):
        """Manually set device location"""
        self.latitude = latitude
        self.longitude = longitude
        print(f"[{self.device_id}] Location set to: {latitude}, {longitude}")


def main():
    """Run device simulator"""
    print("=== GuardIon Device Simulator ===\n")
    
    # Configuration
    BROKER_HOST = "localhost"
    BROKER_PORT = 1883
    MQTT_USERNAME = None  # Set if authentication enabled
    MQTT_PASSWORD = None
    
    # Create simulated devices
    devices = [
        DeviceSimulator("ESP32-SIM001", BROKER_HOST, BROKER_PORT, MQTT_USERNAME, MQTT_PASSWORD),
        DeviceSimulator("ESP32-SIM002", BROKER_HOST, BROKER_PORT, MQTT_USERNAME, MQTT_PASSWORD),
        DeviceSimulator("ESP32-SIM003", BROKER_HOST, BROKER_PORT, MQTT_USERNAME, MQTT_PASSWORD),
    ]
    
    # Connect all devices
    for device in devices:
        device.connect()
    
    print("\nSimulator running. Press Ctrl+C to stop.\n")
    
    try:
        counter = 0
        while True:
            # Publish telemetry every 30 seconds (simulated)
            for device in devices:
                device.publish_telemetry()
            
            # Publish health every 5 minutes (every 10 iterations)
            if counter % 10 == 0:
                for device in devices:
                    device.publish_health()
            
            # Simulate random SOS alert (1% chance per iteration)
            if random.random() < 0.01:
                random_device = random.choice(devices)
                random_device.publish_alert("SOS")
            
            # Simulate low battery alert
            for device in devices:
                if device.battery_level < 20 and random.random() < 0.1:
                    device.publish_alert("LOW_BATTERY")
            
            counter += 1
            time.sleep(5)  # Publish every 5 seconds for testing (30s in production)
            
    except KeyboardInterrupt:
        print("\n\nShutting down simulators...")
        for device in devices:
            device.disconnect()
        print("Simulators stopped.")


if __name__ == "__main__":
    main()
```

### 4.2 Create Interactive Simulator CLI

**Create `simulators/interactive_simulator.py`:**
```python
#!/usr/bin/env python3
"""
Interactive Device Simulator
Allows manual control of simulated device for testing specific scenarios
"""

import sys
from device_simulator import DeviceSimulator


def print_menu():
    print("\n" + "="*50)
    print("GuardIon Interactive Device Simulator")
    print("="*50)
    print("1. Publish Telemetry")
    print("2. Trigger SOS Alert")
    print("3. Trigger Low Battery Alert")
    print("4. Toggle Movement (current: {})".format("ON" if simulator.is_moving else "OFF"))
    print("5. Set Custom Location")
    print("6. Publish Health Metrics")
    print("7. Change Battery Level")
    print("8. Disconnect/Reconnect")
    print("9. Exit")
    print("="*50)


def main():
    global simulator
    
    print("=== Interactive Device Simulator ===\n")
    
    # Configuration
    device_id = input("Enter device ID (default: ESP32-INTERACTIVE): ").strip()
    if not device_id:
        device_id = "ESP32-INTERACTIVE"
    
    broker_host = input("MQTT Broker Host (default: localhost): ").strip() or "localhost"
    broker_port = int(input("MQTT Broker Port (default: 1883): ").strip() or "1883")
    
    # Create simulator
    simulator = DeviceSimulator(device_id, broker_host, broker_port)
    simulator.connect()
    
    while True:
        print_menu()
        choice = input("\nSelect option: ").strip()
        
        if choice == "1":
            simulator.publish_telemetry()
        
        elif choice == "2":
            simulator.publish_alert("SOS")
        
        elif choice == "3":
            simulator.publish_alert("LOW_BATTERY")
        
        elif choice == "4":
            simulator.set_movement(not simulator.is_moving)
        
        elif choice == "5":
            try:
                lat = float(input("Enter latitude: "))
                lng = float(input("Enter longitude: "))
                simulator.set_location(lat, lng)
            except ValueError:
                print("Invalid coordinates")
        
        elif choice == "6":
            simulator.publish_health()
        
        elif choice == "7":
            try:
                level = int(input("Enter battery level (0-100): "))
                simulator.battery_level = max(0, min(100, level))
                print(f"Battery level set to {simulator.battery_level}%")
            except ValueError:
                print("Invalid battery level")
        
        elif choice == "8":
            simulator.disconnect()
            input("Press Enter to reconnect...")
            simulator.connect()
        
        elif choice == "9":
            print("\nDisconnecting...")
            simulator.disconnect()
            print("Goodbye!")
            sys.exit(0)
        
        else:
            print("Invalid option")


if __name__ == "__main__":
    main()
```

### 4.3 Make Simulators Executable
```bash
cd backend_guardion/simulators

# Make executable (Linux/Mac)
chmod +x device_simulator.py
chmod +x interactive_simulator.py

# Windows: Run with python
python device_simulator.py
python interactive_simulator.py
```

### 4.4 Testing: Device Simulator

**Manual Test:**
```bash
# Terminal 1: Start MQTT broker
mosquitto -v

# Terminal 2: Subscribe to all topics
mosquitto_sub -h localhost -p 1883 -t "guardion/#" -v

# Terminal 3: Run simulator
cd backend_guardion/simulators
python device_simulator.py
```

**Expected Output:**
```
[ESP32-SIM001] Connected to MQTT broker
[ESP32-SIM002] Connected to MQTT broker
[ESP32-SIM003] Connected to MQTT broker

[ESP32-SIM001] Telemetry published: Lat=6.5255, Lng=3.3801, Battery=99%
[ESP32-SIM002] Telemetry published: Lat=6.5239, Lng=3.3785, Battery=99%
[ESP32-SIM003] Telemetry published: Lat=6.5248, Lng=3.3797, Battery=99%
```

**✅ Checkpoint:** Device simulator working and publishing MQTT messages

---

## Phase 5: MQTT Backend Integration (Day 11-13)

### 5.1 Implement MQTT Client (from MQTT_IMPLEMENTATION.md)

Follow the implementation in `MQTT_IMPLEMENTATION.md` to create:
- `app/mqtt/client.py` - MQTT client
- `app/mqtt/handlers.py` - Message handlers
- Integration with `app/main.py`

### 5.2 Testing: MQTT Message Processing

**Create `tests/test_mqtt.py`:**
```python
import pytest
import json
from unittest.mock import AsyncMock, patch
from app.mqtt.handlers import MessageHandler


@pytest.mark.asyncio
async def test_telemetry_handler():
    """Test telemetry message processing"""
    handler = MessageHandler()
    
    payload = {
        "device_id": "ESP32-TEST001",
        "timestamp": "2026-05-07T13:30:00Z",
        "location": {
            "latitude": 6.5244,
            "longitude": 3.3792,
            "accuracy": 10.5
        },
        "battery": {
            "level": 85,
            "voltage": 3.95
        },
        "signal": {
            "strength": -72,
            "quality": 85
        }
    }
    
    with patch.object(handler.location_service, 'save_location', new_callable=AsyncMock) as mock_save:
        with patch.object(handler.device_service, 'update_device_status', new_callable=AsyncMock) as mock_update:
            await handler.handle_telemetry(payload)
            
            # Verify location was saved
            mock_save.assert_called_once()
            assert mock_save.call_args[1]['latitude'] == 6.5244
            
            # Verify device status updated
            mock_update.assert_called_once()


@pytest.mark.asyncio
async def test_alert_handler():
    """Test alert message processing"""
    handler = MessageHandler()
    
    payload = {
        "device_id": "ESP32-TEST001",
        "timestamp": "2026-05-07T14:00:00Z",
        "alert_type": "SOS",
        "priority": "critical",
        "location": {
            "latitude": 6.5244,
            "longitude": 3.3792
        },
        "metadata": {
            "button_press_count": 3
        }
    }
    
    with patch.object(handler.alert_service, 'create_alert', new_callable=AsyncMock) as mock_create:
        await handler.handle_alert(payload)
        
        # Verify alert was created
        mock_create.assert_called_once()
        assert mock_create.call_args[1]['alert_type'] == "SOS"
```

**Run tests:**
```bash
pytest tests/test_mqtt.py -v
```

### 5.3 Integration Test: Simulator → Backend

**Create `tests/test_integration_mqtt.py`:**
```python
import pytest
import time
import asyncio
from simulators.device_simulator import DeviceSimulator
from app.main import app
from app.database import Session


@pytest.mark.integration
def test_simulator_to_backend_flow():
    """
    Integration test: Simulator publishes → Backend receives → Database updated
    """
    # Start simulator
    simulator = DeviceSimulator("ESP32-INTTEST001", "localhost", 1883)
    simulator.connect()
    
    # Publish telemetry
    simulator.publish_telemetry()
    
    # Wait for message processing
    time.sleep(2)
    
    # Check database
    db = Session()
    from app.models.location import LocationHistory
    location = db.query(LocationHistory).filter_by(device_id="ESP32-INTTEST001").first()
    
    assert location is not None
    assert location.latitude is not None
    assert location.longitude is not None
    
    # Cleanup
    simulator.disconnect()
    db.close()
```

**Run integration test:**
```bash
# Start backend in separate terminal
uvicorn app.main:app --reload

# Run test
pytest tests/test_integration_mqtt.py -v -m integration
```

**✅ Checkpoint:** Backend receiving and processing simulated device messages

---

## Phase 6: API Endpoints (Day 14-18)

### 6.1 Implementation Order

1. **Children Management** (`api/v1/children.py`)
2. **Device Management** (`api/v1/devices.py`)
3. **Location Queries** (`api/v1/locations.py`)
4. **Safe Zones** (`api/v1/safezones.py`)
5. **Alerts** (`api/v1/alerts.py`)
6. **Notifications** (`api/v1/notifications.py`)

### 6.2 Testing: API Endpoints

**Create `tests/test_api_endpoints.py`:**
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_child():
    """Test child profile creation"""
    # Register and login
    client.post("/api/v1/auth/register", json={
        "name": "Parent",
        "email": "parent@test.com",
        "password": "testpass",
        "phone_number": "+2348012345678"
    })
    
    login_response = client.post("/api/v1/auth/login", json={
        "email": "parent@test.com",
        "password": "testpass"
    })
    token = login_response.json()["access_token"]
    
    # Create child
    response = client.post(
        "/api/v1/children",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Test Child",
            "age": 8,
            "profile_photo": "https://example.com/photo.jpg"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Child"
    assert "child_id" in data


def test_register_device():
    """Test device registration"""
    # Setup: Create user, child, login
    # ... (registration and login code) ...
    
    response = client.post(
        "/api/v1/devices/register",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "device_id": "ESP32-API-TEST001",
            "child_id": child_id
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["device_id"] == "ESP32-API-TEST001"


def test_get_location_history():
    """Test location history retrieval"""
    # Setup: Create user, child, device, add locations via simulator
    # ... 
    
    response = client.get(
        f"/api/v1/locations/{device_id}/history?start_time=2026-05-07T00:00:00Z",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "locations" in data
    assert len(data["locations"]) > 0


def test_create_safezone():
    """Test geofence creation"""
    response = client.post(
        "/api/v1/safezones",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "child_id": child_id,
            "zone_name": "Home",
            "center_lat": 6.5244,
            "center_lng": 3.3792,
            "radius": 200.0
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["zone_name"] == "Home"


def test_geofence_breach_alert():
    """Test that geofence breach triggers alert"""
    # Create safezone
    # Move simulated device outside zone
    # Check that alert was created
    
    response = client.get(
        "/api/v1/alerts/active",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    alerts = response.json()
    breach_alert = next((a for a in alerts if a["alert_type"] == "geofence_breach"), None)
    assert breach_alert is not None
```

**Run all API tests:**
```bash
pytest tests/test_api_endpoints.py -v
```

**✅ Checkpoint:** All API endpoints implemented and tested

---

## Phase 7: Geofencing Logic (Day 19-20)

### 7.1 Implement Geofence Service

See `BACKEND_ARCHITECTURE.md` for Haversine distance implementation.

### 7.2 Testing: Geofencing

**Create `tests/test_geofencing.py`:**
```python
import pytest
from app.services.geofence_service import GeofenceService
from app.models.safezone import SafeZone


def test_haversine_distance():
    """Test distance calculation"""
    service = GeofenceService()
    
    # Lagos coordinates (approximately 5km apart)
    lat1, lon1 = 6.5244, 3.3792
    lat2, lon2 = 6.5700, 3.3792
    
    distance = service.calculate_distance(lat1, lon1, lat2, lon2)
    
    assert 5000 < distance < 6000  # Approximately 5km


@pytest.mark.asyncio
async def test_point_inside_zone():
    """Test point inside geofence"""
    service = GeofenceService()
    
    # Create test zone
    zone = SafeZone(
        zone_name="Test Zone",
        center_lat=6.5244,
        center_lng=3.3792,
        radius=500.0  # 500 meters
    )
    
    # Point 100 meters away (inside)
    is_inside = await service.is_point_in_zone(6.5253, 3.3792, zone)
    assert is_inside == True


@pytest.mark.asyncio
async def test_point_outside_zone():
    """Test point outside geofence"""
    service = GeofenceService()
    
    zone = SafeZone(
        zone_name="Test Zone",
        center_lat=6.5244,
        center_lng=3.3792,
        radius=500.0
    )
    
    # Point 1km away (outside)
    is_inside = await service.is_point_in_zone(6.5344, 3.3792, zone)
    assert is_inside == False


@pytest.mark.asyncio
async def test_breach_detection_with_simulator():
    """Integration test: Simulate device moving outside zone"""
    from simulators.device_simulator import DeviceSimulator
    
    simulator = DeviceSimulator("ESP32-GEOFENCE-TEST", "localhost", 1883)
    simulator.connect()
    
    # Set device inside zone
    simulator.set_location(6.5244, 3.3792)
    simulator.publish_telemetry()
    
    time.sleep(1)
    
    # Move device outside zone
    simulator.set_location(6.5500, 3.3792)  # ~2.8km away
    simulator.publish_telemetry()
    
    time.sleep(2)
    
    # Check that alert was created
    # ... (database query to verify alert) ...
    
    simulator.disconnect()
```

**Run geofencing tests:**
```bash
pytest tests/test_geofencing.py -v
```

**✅ Checkpoint:** Geofencing working correctly

---

## Phase 8: WebSocket Real-Time Updates (Day 21-22)

### 8.1 Implement WebSocket Endpoint

**Create `app/api/v1/websocket.py`:**
```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.services.websocket_service import WebSocketService
from app.services.auth_service import AuthService

router = APIRouter()
ws_service = WebSocketService()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket connection for real-time updates"""
    await ws_service.connect(websocket, user_id)
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Handle any client messages (ping/pong, etc.)
            
    except WebSocketDisconnect:
        ws_service.disconnect(user_id)
```

### 8.2 Testing: WebSocket

**Create `tests/test_websocket.py`:**
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_websocket_connection():
    """Test WebSocket connection"""
    client = TestClient(app)
    
    with client.websocket_connect("/api/v1/ws/test-user-123") as websocket:
        # Simulate device telemetry → backend should broadcast to WebSocket
        # ... trigger simulator ...
        
        # Receive message
        data = websocket.receive_json()
        assert "location" in data or "alert" in data
```

**✅ Checkpoint:** WebSocket working

---

## Phase 9: End-to-End Testing (Day 23-25)

### 9.1 Complete Flow Test

**Create `tests/test_end_to_end.py`:**
```python
@pytest.mark.e2e
def test_complete_child_safety_flow():
    """
    Complete flow test:
    1. Parent registers
    2. Parent creates child profile
    3. Parent registers device
    4. Parent creates safe zone
    5. Device (simulator) publishes location inside zone → No alert
    6. Device moves outside zone → Alert created
    7. Parent receives alert via WebSocket
    8. Parent acknowledges alert
    """
    # Implementation of complete flow
    pass
```

### 9.2 Manual Testing Checklist

**Create test scenarios document:**

```markdown
## Manual Testing Scenarios

### Scenario 1: Normal Monitoring
- [ ] Register parent account
- [ ] Create child profile
- [ ] Register device (use simulator ESP32-SIM001)
- [ ] Start device simulator
- [ ] View child's location on frontend map
- [ ] Verify location updates every 30 seconds
- [ ] Check battery level display

### Scenario 2: Geofence Breach
- [ ] Create safe zone around child's current location (200m radius)
- [ ] Use interactive simulator to move device outside zone
- [ ] Verify alert appears in frontend
- [ ] Check alert notification received
- [ ] Acknowledge alert
- [ ] Verify alert status changes to "acknowledged"

### Scenario 3: SOS Emergency
- [ ] Use interactive simulator to trigger SOS alert
- [ ] Verify immediate notification (high priority)
- [ ] Check alert shows current location
- [ ] Respond to alert
- [ ] Verify response logged

### Scenario 4: Low Battery Warning
- [ ] Use interactive simulator to set battery to 15%
- [ ] Publish telemetry
- [ ] Verify low battery alert created
- [ ] Check notification received

### Scenario 5: Device Offline
- [ ] Stop simulator (device goes offline)
- [ ] Wait 15 minutes
- [ ] Verify "device offline" alert created
- [ ] Restart simulator
- [ ] Verify device status returns to "online"

### Scenario 6: Multiple Children/Devices
- [ ] Create 2+ child profiles
- [ ] Register device for each child
- [ ] Run multiple simulators
- [ ] Verify each child's location tracked separately
- [ ] Test that alerts go to correct parent

### Scenario 7: Location History
- [ ] Let simulator run for 1 hour
- [ ] Query location history API
- [ ] Verify all location points stored
- [ ] Test time range filtering
- [ ] Check map trail display

### Scenario 8: Guardian Management
- [ ] Add secondary guardian to child
- [ ] Trigger SOS alert
- [ ] Verify both guardians receive notification
- [ ] Test priority levels
```

**✅ Checkpoint:** All features tested and working

---

## Phase 10: Performance & Load Testing (Day 26-27)

### 10.1 Load Testing Script

**Create `tests/load_test_simulator.py`:**
```python
#!/usr/bin/env python3
"""
Load test: Simulate 100+ devices publishing simultaneously
"""

import threading
import time
from simulators.device_simulator import DeviceSimulator


def run_device(device_id):
    """Run single device simulator"""
    device = DeviceSimulator(device_id, "localhost", 1883)
    device.connect()
    
    for _ in range(60):  # Run for 1 hour (60 iterations × 1 min)
        device.publish_telemetry()
        time.sleep(60)
    
    device.disconnect()


def main():
    """Launch 100 device simulators"""
    threads = []
    
    for i in range(100):
        device_id = f"ESP32-LOAD{i:03d}"
        thread = threading.Thread(target=run_device, args=(device_id,))
        thread.start()
        threads.append(thread)
        time.sleep(0.1)  # Stagger startup
    
    # Wait for all threads
    for thread in threads:
        thread.join()


if __name__ == "__main__":
    main()
```

### 10.2 Performance Metrics

Monitor during load test:
- Database query response times
- MQTT message processing rate
- API endpoint latency
- Memory usage
- CPU usage

**✅ Checkpoint:** System handles 100+ devices

---

## Phase 11: Hardware Integration (Day 28+)

### 11.1 ESP32 Setup (When Hardware Ready)

**Hardware assembly:**
1. Connect SIM7080G to ESP32 via UART
2. Connect battery + TP4056 charging module
3. Add SOS button
4. Test power system

**Firmware flashing:**
```bash
# Install Arduino IDE or PlatformIO
# Flash firmware from MQTT_IMPLEMENTATION.md

# Test AT commands
# Test GPS acquisition
# Test MQTT connection
```

### 11.2 Hardware Testing Checklist

```markdown
## Hardware Testing

### GPS Functionality
- [ ] Device gets GPS fix outdoors
- [ ] GPS coordinates accurate (within 10m)
- [ ] GPS fix time < 60 seconds
- [ ] Coordinates match Google Maps

### MQTT Communication
- [ ] Device connects to broker
- [ ] Telemetry publishes successfully
- [ ] Messages appear in backend logs
- [ ] Location updates in database

### Battery Management
- [ ] Battery level reads correctly
- [ ] Charging status detected
- [ ] Device runs on battery (test duration)
- [ ] Low battery alert triggers at 20%

### SOS Button
- [ ] Button press detected
- [ ] SOS alert published immediately
- [ ] Alert received by backend
- [ ] Notification sent to parent

### Power Consumption
- [ ] Measure current draw in active mode
- [ ] Measure current draw in sleep mode
- [ ] Calculate battery life
- [ ] Optimize if needed
```

**✅ Checkpoint:** Hardware integrated and working

---

## Test Files Summary

### Backend Tests
```
tests/
├── test_models.py                 # Database model tests
├── test_auth.py                   # Authentication tests
├── test_api_endpoints.py          # API endpoint tests
├── test_mqtt.py                   # MQTT handler tests
├── test_geofencing.py             # Geofencing logic tests
├── test_websocket.py              # WebSocket tests
├── test_integration_mqtt.py       # Simulator → Backend integration
├── test_end_to_end.py             # Complete flow tests
└── load_test_simulator.py         # Performance testing
```

### Simulator Scripts
```
simulators/
├── device_simulator.py            # Multi-device simulator
├── interactive_simulator.py       # Manual control simulator
└── scenario_simulator.py          # Automated scenario testing
```

### Hardware Tests (Future)
```
hardware/test_scripts/
├── test_gps.ino                   # GPS functionality
├── test_mqtt.ino                  # MQTT connection
├── test_battery.ino               # Battery monitoring
└── test_sos_button.ino            # Button interrupt
```

---

## Development Best Practices

### 1. Git Workflow
```bash
# Create feature branch
git checkout -b feature/geofencing

# Make changes and commit
git add .
git commit -m "feat: implement geofencing logic"

# Push and create PR
git push origin feature/geofencing
```

### 2. Code Review Checklist
- [ ] All tests pass
- [ ] No linter errors
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] Environment variables added to .env.example

### 3. Testing Before Commit
```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Check code style
flake8 app/
black app/ --check
```

### 4. Database Migrations
```bash
# Always create migration after model changes
alembic revision --autogenerate -m "Add alerts table"

# Review generated migration before applying
# Edit if needed

# Apply migration
alembic upgrade head
```

---

## Troubleshooting Guide

### Issue: Simulator messages not received by backend

**Diagnosis:**
```bash
# Check MQTT broker running
mosquitto -v

# Subscribe manually
mosquitto_sub -h localhost -p 1883 -t "guardion/#" -v

# Check backend MQTT client connected
curl http://localhost:8000/health
```

**Solution:**
- Verify broker host/port in .env
- Check firewall blocking port 1883
- Ensure backend MQTT client started (`mqtt_client.message_loop()`)

### Issue: Database connection errors

**Diagnosis:**
```bash
# Test database connection
psql -U guardion_user -d guardion_dev

# Check backend logs
tail -f backend.log
```

**Solution:**
- Verify DATABASE_URL in .env
- Ensure PostgreSQL running: `sudo systemctl status postgresql`
- Check user permissions

### Issue: Frontend can't connect to backend

**Diagnosis:**
```bash
# Check backend running
curl http://localhost:8000/health

# Check CORS settings
# Inspect browser console for errors
```

**Solution:**
- Add frontend URL to ALLOWED_ORIGINS in .env
- Verify backend accessible from frontend network

---

## Deployment Roadmap (Post-Development)

### Stage 1: Local Deployment
- Backend running on local machine
- PostgreSQL local
- Mosquitto local
- Frontend on local dev server

### Stage 2: Cloud Staging
- Deploy backend to Heroku/DigitalOcean
- PostgreSQL on managed service (AWS RDS)
- MQTT on HiveMQ Cloud
- Frontend on Vercel/Netlify

### Stage 3: Production
- Backend on dedicated server
- Database with backups
- MQTT with TLS
- Frontend CDN
- Domain + SSL certificate
- Monitoring and alerts

---

## Success Criteria

### Backend
- [x] All 11 database tables created
- [x] Authentication working
- [x] All API endpoints functional
- [x] MQTT client receiving messages
- [x] Geofencing logic accurate
- [x] Alerts triggered correctly
- [x] WebSocket broadcasting working
- [x] 90%+ test coverage

### Simulator
- [x] Multiple devices simulated
- [x] Realistic GPS movement
- [x] Battery drain simulation
- [x] Alert triggering
- [x] Interactive control

### Integration
- [x] Simulator → Backend → Database flow working
- [x] Frontend displays real-time location
- [x] Geofence breaches detected
- [x] Alerts delivered to frontend
- [x] Load test: 100+ devices handled

### Hardware (When Ready)
- [ ] ESP32 firmware functional
- [ ] GPS acquiring coordinates
- [ ] MQTT publishing to broker
- [ ] SOS button working
- [ ] Battery lasting 24+ hours

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Setup | 2 days | Environment configured |
| Database & Models | 3 days | All models + migrations |
| Authentication | 3 days | Login/register working |
| Device Simulator | 2 days | Simulator publishing data |
| MQTT Backend | 3 days | Backend processing messages |
| API Endpoints | 5 days | All endpoints implemented |
| Geofencing | 2 days | Breach detection working |
| WebSocket | 2 days | Real-time updates |
| End-to-End Testing | 3 days | Full flow tested |
| Load Testing | 2 days | Performance validated |
| **Total (Software)** | **27 days** | **Backend + Frontend ready** |
| Hardware Integration | Variable | Physical device working |

---

## Conclusion

This workflow allows you to build and thoroughly test the entire GuardIon system **without physical hardware**. By using device simulators, you can:

✅ Develop backend and frontend in parallel  
✅ Test all features comprehensively  
✅ Identify bugs early  
✅ Iterate quickly  
✅ Demonstrate working system before hardware ready  
✅ Integrate hardware seamlessly when available  

**Next Steps:**
1. Follow Phase 1 to set up environment
2. Work through phases sequentially
3. Run tests after each phase
4. Use simulators for all testing until hardware ready
5. Integrate ESP32 hardware in Phase 11

Good luck with your project! 🚀
