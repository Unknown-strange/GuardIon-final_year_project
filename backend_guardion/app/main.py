"""
GuardIOn Backend API
FastAPI application entry point
"""

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.api.v1 import (
    auth,
    users,
    children,
    devices,
    locations,
    safezones,
    alerts,
    notifications,
    guardians,
    emergency_contacts,
    preferences,
    check_ins,
)
from app.websocket import endpoints as websocket_endpoints
from app.mqtt.client import mqtt_client
from app.mqtt.handlers import handle_mqtt_message

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup: Connect to MQTT broker
    logger.info("[OK] Starting GuardIOn Backend...")
    logger.info("[OK] Geofencing: armed-state mode (no breach cooldown)")
    try:
        # Get the current event loop
        import asyncio
        loop = asyncio.get_running_loop()
        
        # Set event loop and message handler
        mqtt_client.set_event_loop(loop)
        mqtt_client.set_message_handler(handle_mqtt_message)
        mqtt_client.connect()
        logger.info("[OK] MQTT client started")
    except Exception as e:
        logger.error(f"[ERROR] Failed to start MQTT client: {e}")
    
    yield
    
    # Shutdown: Disconnect from MQTT
    logger.info("Shutting down...")
    mqtt_client.disconnect()
    logger.info("[OK] MQTT client stopped")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Child safety and real-time location monitoring system",
    docs_url=settings.DOCS_URL,
    redoc_url=settings.REDOC_URL,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["Users"])
app.include_router(children.router, prefix=f"{settings.API_V1_PREFIX}/children", tags=["Children"])
app.include_router(devices.router, prefix=f"{settings.API_V1_PREFIX}/devices", tags=["Devices"])
app.include_router(locations.router, prefix=f"{settings.API_V1_PREFIX}/locations", tags=["Locations"])
app.include_router(safezones.router, prefix=f"{settings.API_V1_PREFIX}/safezones", tags=["Safe Zones"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_PREFIX}/alerts", tags=["Alerts"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_PREFIX}/notifications", tags=["Notifications"])
app.include_router(guardians.router, prefix=f"{settings.API_V1_PREFIX}/guardians", tags=["Guardians"])
app.include_router(emergency_contacts.router, prefix=f"{settings.API_V1_PREFIX}/emergency-contacts", tags=["Emergency Contacts"])
app.include_router(preferences.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["User Preferences"])
app.include_router(check_ins.router, prefix=f"{settings.API_V1_PREFIX}/check-ins", tags=["Check-Ins"])

# Include WebSocket router
app.include_router(websocket_endpoints.router, tags=["WebSocket"])


@app.get("/")
def root():
    """
    Root endpoint - API health check
    """
    return {
        "message": "GuardIOn API is running",
        "version": settings.APP_VERSION,
        "docs": settings.DOCS_URL
    }


@app.api_route("/health/live", methods=["GET", "HEAD"])
def health_live():
    """
    Liveness probe for Render / load balancers.
    Always returns 200 while the process is running (no DB/MQTT checks).
    Supports HEAD for UptimeRobot and similar monitors.
    """
    return {"status": "ok"}


@app.get("/health/ready")
def health_ready(response: Response):
    """
    Readiness probe — verifies database connectivity and MQTT status.
    Returns 503 if the database is unreachable.
    """
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        logger.warning("Health ready check: database unavailable: %s", e)

    mqtt_ok = mqtt_client.is_connected
    payload = {
        "status": "ready" if db_ok else "degraded",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database_connected": db_ok,
        "mqtt_connected": mqtt_ok,
    }

    if not db_ok:
        response.status_code = 503
        payload["status"] = "unavailable"

    return payload


@app.get("/health")
def health_check():
    """
    Full health status for monitoring dashboards.
    """
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    return {
        "status": "healthy" if db_ok else "degraded",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database_connected": db_ok,
        "mqtt_connected": mqtt_client.is_connected,
        "mqtt_messages_received": mqtt_client.messages_received,
        "mqtt_messages_failed": mqtt_client.messages_failed,
    }
