"""
MQTT Message Handlers
Processes incoming MQTT messages from devices
"""

import asyncio
import logging
import time
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from app.database import run_with_db_retry
from sqlalchemy.exc import TimeoutError as PoolTimeoutError
from app.models.device import Device
from app.models.location import LocationHistory
from app.models.alert import Alert, AlertType, AlertStatus
from app.api.child_access import guardian_user_ids_for_child
from app.models.child import Child
from app.mqtt.schemas import AlertPayload, CheckInResponsePayload, StatusPayload, TelemetryPayload
from app.services.geofencing import (
    check_geofence_breach,
    check_danger_zone_entry,
    check_safe_zone_entry,
    check_low_battery_alert,
    confirm_child_safe,
)
from app.services.check_in_service import confirm_check_in_from_device, confirm_pending_check_ins_for_child
from app.services.notifications import create_notification_for_alert
from app.websocket.manager import manager

logger = logging.getLogger(__name__)

_handler_lock = asyncio.Lock()

GEOFENCE_DEBOUNCE_SEC = 30.0
_geofence_last_run: dict[str, float] = {}

ALERT_TYPE_MAP = {
    "SOS": AlertType.SOS,
    "CHECK_IN_SAFE": AlertType.CHECK_IN_SAFE,
    "LOW_BATTERY": AlertType.LOW_BATTERY,
    "DEVICE_TAMPER": AlertType.DEVICE_TAMPER,
    "DEVICE_OFFLINE": AlertType.DEVICE_OFFLINE,
}


def _parse_timestamp(timestamp_str: Optional[str]) -> datetime:
    if not timestamp_str:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return datetime.utcnow()


def _append_alert_broadcasts(
    alert_broadcasts: list[tuple[str, dict]],
    child_id: UUID,
    alert_data: dict,
    db,
) -> None:
    for user_id in guardian_user_ids_for_child(child_id, db):
        alert_broadcasts.append((user_id, alert_data))


def _format_coords(latitude: Optional[float], longitude: Optional[float]) -> str:
    if latitude is None or longitude is None:
        return "no GPS"
    return f"Lat: {latitude:.4f}, Lng: {longitude:.4f}"


def _resolve_alert_type(alert_type_str: Optional[str]) -> AlertType:
    if not alert_type_str:
        return AlertType.SOS
    normalized = alert_type_str.strip().upper().replace("-", "_").replace(" ", "_")
    return ALERT_TYPE_MAP.get(normalized, AlertType.SOS)


def _should_run_geofence(device_id: str) -> bool:
    """Throttle zone checks — location is still saved every telemetry message."""
    now = time.monotonic()
    last = _geofence_last_run.get(device_id, 0.0)
    if now - last < GEOFENCE_DEBOUNCE_SEC:
        return False
    _geofence_last_run[device_id] = now
    return True


async def _process_geofence_alerts(
    device_id: str,
    device_pk: UUID,
    latitude: float,
    longitude: float,
    accuracy: Optional[float],
) -> None:
    """Run zone checks in a separate DB session so telemetry save releases the pool quickly."""

    def geofence_work(db):
        device = db.query(Device).filter(Device.id == device_pk).first()
        if not device:
            return None

        child = db.query(Child).filter(Child.id == device.child_id).first()
        broadcasts: list[tuple[str, dict]] = []

        breach_alert = check_geofence_breach(
            device,
            latitude,
            longitude,
            db,
            accuracy=accuracy,
        )
        if breach_alert:
            create_notification_for_alert(breach_alert, db)
            if child:
                _append_alert_for_device(broadcasts, breach_alert, device_id, child, db)

        danger_alerts = check_danger_zone_entry(
            device,
            latitude,
            longitude,
            db,
            accuracy=accuracy,
        )
        for danger_alert in danger_alerts:
            create_notification_for_alert(danger_alert, db)
            if child:
                _append_alert_for_device(broadcasts, danger_alert, device_id, child, db)

        safe_entry_alerts = check_safe_zone_entry(
            device,
            latitude,
            longitude,
            db,
            accuracy=accuracy,
        )
        for safe_alert in safe_entry_alerts:
            create_notification_for_alert(safe_alert, db)
            if child:
                _append_alert_for_device(broadcasts, safe_alert, device_id, child, db)

        if breach_alert or danger_alerts or safe_entry_alerts:
            db.commit()

        return broadcasts

    try:
        alert_broadcasts = run_with_db_retry(geofence_work)
    except PoolTimeoutError:
        logger.error("Geofence skipped for %s: database pool exhausted", device_id)
        return

    if not alert_broadcasts:
        return

    for user_id, alert_data in alert_broadcasts:
        await manager.broadcast_alert(user_id, alert_data)


def _append_alert_for_device(
    broadcasts: list[tuple[str, dict]],
    alert,
    device_id: str,
    child: Child,
    db,
    *,
    extra: Optional[dict] = None,
) -> None:
    payload = {
        "alert_id": str(alert.id),
        "alert_type": alert.alert_type.value,
        "child_id": str(alert.child_id),
        "child_name": child.name,
        "device_id": device_id,
        "zone_name": getattr(alert, "zone_name", None),
        "location_lat": alert.location_lat,
        "location_lng": alert.location_lng,
        "status": alert.status.value,
        "created_at": alert.created_at.isoformat(),
    }
    if extra:
        payload.update(extra)
    _append_alert_broadcasts(broadcasts, alert.child_id, payload, db)


async def handle_mqtt_message(topic: str, payload: Dict):
    """Route MQTT messages to appropriate handlers."""
    try:
        if "telemetry" in topic:
            await handle_telemetry(payload)
        elif "alerts" in topic:
            await handle_alert(payload)
        elif "check_in" in topic:
            await handle_check_in_response(payload)
        elif "status" in topic:
            await handle_status(payload)
        else:
            logger.warning(f"Unknown topic: {topic}")
    except Exception as e:
        logger.exception(f"Error handling MQTT message: {e}")


async def handle_telemetry(payload: Dict):
    """Handle location telemetry messages."""
    try:
        try:
            data = TelemetryPayload.model_validate(payload)
        except Exception as e:
            logger.error(f"Invalid telemetry payload: {e}")
            return

        device_id = data.device_id
        timestamp = _parse_timestamp(data.timestamp)
        location = data.location
        battery = data.battery

        def save_work(db):
            device = db.query(Device).filter(Device.device_id == device_id).first()
            if not device:
                logger.warning(f"Device {device_id} not registered in database")
                return None

            latitude = location.latitude
            longitude = location.longitude
            battery_level = battery.level
            loc_broadcast: Optional[dict] = None
            broadcasts: list[tuple[str, dict]] = []
            geofence_task: Optional[dict] = None

            if latitude is not None and longitude is not None:
                db.add(
                    LocationHistory(
                        device_id=device.id,
                        latitude=latitude,
                        longitude=longitude,
                        accuracy=location.accuracy,
                        altitude=location.altitude,
                        speed=location.speed,
                        battery_level=battery_level,
                        timestamp=timestamp,
                    )
                )

            device.last_seen = timestamp
            device.battery_level = battery_level
            device.signal_strength = data.signal.strength
            db.commit()

            logger.info(
                f"[OK] Saved telemetry: {device_id} | "
                f"{_format_coords(latitude, longitude)}, Battery: {battery_level}%"
            )

            if latitude is not None and longitude is not None:
                loc_broadcast = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "accuracy": location.accuracy,
                    "altitude": location.altitude,
                    "speed": location.speed,
                    "battery_level": battery_level,
                    "timestamp": timestamp.isoformat(),
                }

                if _should_run_geofence(device_id):
                    geofence_task = {
                        "device_pk": device.id,
                        "latitude": latitude,
                        "longitude": longitude,
                        "accuracy": location.accuracy,
                    }

            if battery_level is not None:
                low_battery_alert = check_low_battery_alert(device, battery_level, db)
                if low_battery_alert:
                    create_notification_for_alert(low_battery_alert, db)
                    db.commit()
                    child = db.query(Child).filter(Child.id == device.child_id).first()
                    if child:
                        _append_alert_broadcasts(
                            broadcasts,
                            device.child_id,
                            {
                                "alert_id": str(low_battery_alert.id),
                                "alert_type": low_battery_alert.alert_type.value,
                                "child_id": str(low_battery_alert.child_id),
                                "device_id": device_id,
                                "status": low_battery_alert.status.value,
                                "created_at": low_battery_alert.created_at.isoformat(),
                                "battery_level": battery_level,
                            },
                            db,
                        )

            return loc_broadcast, broadcasts, geofence_task

        try:
            async with _handler_lock:
                result = run_with_db_retry(save_work)
        except PoolTimeoutError:
            logger.error(
                "Telemetry skipped for %s: database pool exhausted",
                device_id,
            )
            return
        if result is None:
            return

        location_broadcast, alert_broadcasts, geofence_task = result

        if location_broadcast:
            await manager.broadcast_location(device_id, location_broadcast)

        for user_id, alert_data in alert_broadcasts:
            await manager.broadcast_alert(user_id, alert_data)

        if geofence_task:
            asyncio.create_task(
                _process_geofence_alerts(
                    device_id,
                    geofence_task["device_pk"],
                    geofence_task["latitude"],
                    geofence_task["longitude"],
                    geofence_task["accuracy"],
                )
            )

    except Exception as e:
        logger.exception(f"Error handling telemetry: {e}")


async def handle_alert(payload: Dict):
    """Handle alert messages (SOS, low battery, etc.)."""
    async with _handler_lock:
        alert_broadcasts: list[tuple[str, dict]] = []

        try:
            try:
                data = AlertPayload.model_validate(payload)
            except Exception as e:
                logger.error(f"Invalid alert payload: {e}")
                return

            device_id = data.device_id
            alert_type = _resolve_alert_type(data.alert_type)
            location = data.location
            priority = data.priority

            def db_work(db):
                device = db.query(Device).filter(Device.device_id == device_id).first()
                if not device:
                    logger.warning(
                        "Alert MQTT ignored: device_id=%r is not registered in the database "
                        "(no Device row). JSON was valid — register the device and link it to a "
                        "child via the API, and ensure Postgres has run Alembic (including "
                        "check_in_safe on PostgreSQL alerttype enum if you use CHECK_IN_SAFE).",
                        device_id,
                    )
                    return None

                if alert_type == AlertType.CHECK_IN_SAFE:
                    confirm_child_safe(
                        device.child_id,
                        db,
                        resolution_note="Child confirmed safe via device check-in",
                    )
                    confirm_pending_check_ins_for_child(device.child_id, db)

                alert = Alert(
                    child_id=device.child_id,
                    device_id=device.id,
                    alert_type=alert_type,
                    location_lat=location.latitude,
                    location_lng=location.longitude,
                    status=AlertStatus.ACTIVE,
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)

                if alert_type == AlertType.CHECK_IN_SAFE:
                    logger.info(
                        "[OK] SAFE CHECK-IN RECORDED: "
                        f"{alert_type.value} from {device_id} | Priority: {priority}"
                    )
                else:
                    logger.warning(
                        f"[WARNING] ALERT CREATED: {alert_type.value} from {device_id} "
                        f"| Priority: {priority}"
                    )

                create_notification_for_alert(alert, db)
                db.commit()

                broadcasts: list[tuple[str, dict]] = []
                child = db.query(Child).filter(Child.id == device.child_id).first()
                if child:
                    _append_alert_broadcasts(
                        broadcasts,
                        device.child_id,
                        {
                            "alert_id": str(alert.id),
                            "alert_type": alert.alert_type.value,
                            "child_id": str(alert.child_id),
                            "child_name": child.name,
                            "device_id": device_id,
                            "location_lat": alert.location_lat,
                            "location_lng": alert.location_lng,
                            "status": alert.status.value,
                            "priority": priority,
                            "created_at": alert.created_at.isoformat(),
                        },
                        db,
                    )
                return broadcasts

            result = run_with_db_retry(db_work)
            if result is None:
                return

            alert_broadcasts = result

            for user_id, alert_data in alert_broadcasts:
                await manager.broadcast_alert(user_id, alert_data)

        except Exception as e:
            logger.exception(f"Error handling alert: {e}")


async def handle_status(payload: Dict):
    """Handle device status messages."""
    async with _handler_lock:
        try:
            try:
                data = StatusPayload.model_validate(payload)
            except Exception as e:
                logger.error(f"Invalid status payload: {e}")
                return

            def db_work(db):
                device = db.query(Device).filter(Device.device_id == data.device_id).first()
                if device:
                    device.last_seen = datetime.utcnow()
                    db.commit()
                    logger.info(f"[OK] Device {data.device_id} status: {data.status}")
                return True

            run_with_db_retry(db_work)
        except Exception as e:
            logger.exception(f"Error handling status: {e}")


async def handle_check_in_response(payload: Dict):
    """Handle device response to a parent-initiated check-in."""
    async with _handler_lock:
        try:
            try:
                data = CheckInResponsePayload.model_validate(payload)
            except Exception as e:
                logger.error(f"Invalid check-in response payload: {e}")
                return

            normalized = data.status.strip().lower()
            if normalized != "confirmed":
                logger.info(
                    f"Check-in {data.check_in_id} not confirmed by device ({data.status})"
                )
                return

            try:
                check_in_uuid = UUID(data.check_in_id)
            except ValueError:
                logger.error(f"Invalid check_in_id in MQTT payload: {data.check_in_id}")
                return

            def db_work(db):
                device = db.query(Device).filter(Device.device_id == data.device_id).first()
                if not device:
                    logger.warning(f"Check-in response from unknown device {data.device_id}")
                    return None

                confirmed = confirm_check_in_from_device(check_in_uuid, device, db)
                if not confirmed:
                    return None

                logger.info(
                    f"[OK] Check-in {data.check_in_id} confirmed via device {data.device_id}"
                )
                child = db.query(Child).filter(Child.id == device.child_id).first()
                if not child:
                    return None

                broadcasts: list[tuple[str, dict]] = []
                _append_alert_broadcasts(
                    broadcasts,
                    device.child_id,
                    {
                        "alert_id": str(check_in_uuid),
                        "alert_type": AlertType.CHECK_IN_SAFE.value,
                        "child_id": str(device.child_id),
                        "child_name": child.name,
                        "device_id": data.device_id,
                        "status": "active",
                        "created_at": datetime.utcnow().isoformat(),
                    },
                    db,
                )
                return broadcasts

            try:
                result = run_with_db_retry(db_work)
            except PoolTimeoutError:
                logger.error("Check-in response skipped: database pool exhausted")
                return

            if result:
                for user_id, alert_data in result:
                    await manager.broadcast_alert(user_id, alert_data)
        except Exception as e:
            logger.exception(f"Error handling check-in response: {e}")
