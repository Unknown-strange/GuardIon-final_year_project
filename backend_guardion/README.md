# GuardIon Backend

FastAPI backend for the GuardIon child safety and location monitoring system.

## Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### 2. Setup Environment

```bash
# Copy environment template
copy .env.example .env

# Edit .env and fill in your configuration:
# - PostgreSQL credentials
# - MQTT broker details
# - JWT secret key
# - Redis connection
```

### 3. Setup Database

```bash
# Create PostgreSQL databases
psql -U postgres
CREATE DATABASE guardion_dev;
CREATE DATABASE guardion_test;
CREATE USER guardion_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE guardion_dev TO guardion_user;
GRANT ALL PRIVILEGES ON DATABASE guardion_test TO guardion_user;
\q

# Run migrations (after creating models)
alembic upgrade head
```

### 4. Start Services

You need these services running:

```bash
# Terminal 1: PostgreSQL (usually runs as service)
# Check status: sc query postgresql-x64-15

# Terminal 2: Redis
redis-server

# Terminal 3: Mosquitto MQTT Broker
mosquitto -v
# Or if running as service: net start mosquitto

# Terminal 4: Backend API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Test Installation

```bash
# Backend health check
curl http://localhost:8000/health/live

# Full status (DB + MQTT)
curl http://localhost:8000/health

# API documentation
# Open in browser: http://localhost:8000/docs

# Test MQTT
mosquitto_sub -h localhost -p 1883 -t "guardion/#" -v
```

## Development Workflow

Follow the complete development guide in `DEVELOPMENT_WORKFLOW.md`

## Project Structure

```
backend_guardion/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── api/                 # API routes
│   ├── services/            # Business logic
│   ├── mqtt/                # MQTT client
│   └── utils/               # Utilities
├── tests/                   # Test suite
├── simulators/              # Device simulators
├── alembic/                 # Database migrations
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (not in git)
└── README.md               # This file
```

## Documentation

- [Backend Architecture](BACKEND_ARCHITECTURE.md) - System design and API structure
- [MQTT Implementation](MQTT_IMPLEMENTATION.md) - MQTT protocol and ESP32 firmware
- [Development Workflow](DEVELOPMENT_WORKFLOW.md) - Step-by-step build guide

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run integration tests
pytest tests/ -m integration -v
```

## API Endpoints

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Common Issues

### Issue: PostgreSQL connection error
**Solution**: Check DATABASE_URL in .env and verify PostgreSQL is running

### Issue: MQTT connection refused
**Solution**: Start Mosquitto broker: `mosquitto -v`

### Issue: Import errors
**Solution**: Make sure virtual environment is activated

## Environment Variables

See `.env.example` for all configuration options.

Required variables:
- `DATABASE_URL` - PostgreSQL connection string (Supabase Session pooler on Render)
- `JWT_SECRET_KEY` - Secret key for JWT tokens (use a strong random string)
- `MQTT_BROKER_HOST`, `MQTT_BROKER_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_TLS_ENABLED` - HiveMQ Cloud

## Deploy on Render

| Setting | Value |
|---------|--------|
| Root Directory | `backend_guardion` |
| Build Command | `pip install --upgrade pip && pip install -r requirements.txt` |
| Start Command | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health/live` |
| `PYTHON_VERSION` | `3.11.11` |

Set env vars from `.env.example`. Do **not** use Python 3.14 — `pydantic-core` has no pre-built wheel yet.

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment
3. ✅ Setup database
4. 📝 Create database models (Phase 2)
5. 📝 Implement API endpoints (Phase 3-6)
6. 📝 Setup MQTT client (Phase 5)
7. 📝 Create device simulator (Phase 4)
8. 📝 Test complete flow (Phase 9)

## Support

For detailed implementation guidance, refer to the documentation files in this directory.
