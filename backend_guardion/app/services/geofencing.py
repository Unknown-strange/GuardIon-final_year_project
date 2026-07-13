"""
Geofencing Service
Handles geofence breach detection and monitoring
"""

import logging
import math
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.child import Child
from app.models.device import Device
from app.models.safezone import SafeZone, ZoneType
from app.models.alert import Alert, AlertType, AlertStatus

logger = logging.getLogger(__name__)


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance in meters (Haversine)."""
    R = 6371000

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def _distance_to_zone(latitude: float, longitude: float, safezone: SafeZone) -> float:
    return calculate_distance(
        latitude,
        longitude,
        safezone.center_lat,
        safezone.center_lng,
    )


def _zones_containing_location(
    latitude: float,
    longitude: float,
    safezones: List[SafeZone],
    *,
    margin_m: float = 0,
) -> List[Tuple[SafeZone, float]]:
    matches: List[Tuple[SafeZone, float]] = []
    for safezone in safezones:
        distance = _distance_to_zone(latitude, longitude, safezone)
        if distance <= safezone.radius + margin_m:
            matches.append((safezone, distance))
    return matches


def _pick_active_zone(
    containing: List[Tuple[SafeZone, float]],
    previous_zone_id: Optional[UUID],
) -> SafeZone:
    if previous_zone_id:
        for zone, _ in containing:
            if zone.id == previous_zone_id:
                return zone
    containing.sort(key=lambda item: item[1])
    return containing[0][0]


def _arm_child_in_zone(child: Child, zone: SafeZone, db: Session) -> None:
    child.geofence_armed = True
    child.active_safezone_id = zone.id
    child.geofence_exit_pending_at = None


def _clear_exit_pending(child: Child) -> None:
    child.geofence_exit_pending_at = None


def disarm_geofence_for_child(child_id: UUID, db: Session, *, commit: bool = True) -> None:
    """Stop geofence exit alerts until the child enters a safe zone again."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return

    if (
        child.geofence_armed
        or child.active_safezone_id
        or child.geofence_exit_pending_at
    ):
        child.geofence_armed = False
        child.active_safezone_id = None
        child.geofence_exit_pending_at = None
        if commit:
            db.commit()
        logger.info(f"Geofence disarmed for child {child_id}")


def resolve_active_geofence_alerts(
    child_id: UUID,
    db: Session,
    *,
    resolution_note: str | None = None,
) -> None:
    """Resolve any open geofence breach alerts after the child is confirmed safe."""
    now = datetime.utcnow()
    alerts = (
        db.query(Alert)
        .filter(
            Alert.child_id == child_id,
            Alert.alert_type == AlertType.GEOFENCE_BREACH,
            Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
        )
        .all()
    )
    for alert in alerts:
        alert.status = AlertStatus.RESOLVED
        alert.resolved_at = now
        if resolution_note:
            logger.info(
                f"Resolved geofence alert {alert.id} for child {child_id}: {resolution_note}"
            )


def confirm_child_safe(
    child_id: UUID,
    db: Session,
    *,
    resolution_note: str | None = None,
) -> None:
    """Guardian or device confirmed child is safe — disarm and close open geofence alerts."""
    resolve_active_geofence_alerts(
        child_id,
        db,
        resolution_note=resolution_note,
    )
    disarm_geofence_for_child(child_id, db, commit=False)


def _create_breach_alert(
    device: Device,
    child: Child,
    zone_name: Optional[str],
    latitude: float,
    longitude: float,
    db: Session,
) -> Optional[Alert]:
    existing = (
        db.query(Alert)
        .filter(
            Alert.child_id == device.child_id,
            Alert.alert_type == AlertType.GEOFENCE_BREACH,
            Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
        )
        .first()
    )
    if existing:
        resolve_active_geofence_alerts(
            device.child_id,
            db,
            resolution_note="Superseded by new zone exit",
        )

    alert = Alert(
        child_id=device.child_id,
        device_id=device.id,
        alert_type=AlertType.GEOFENCE_BREACH,
        zone_name=zone_name,
        location_lat=latitude,
        location_lng=longitude,
        status=AlertStatus.ACTIVE,
        confidence=1.0,
    )

    child.geofence_armed = False
    child.active_safezone_id = None
    child.geofence_exit_pending_at = None

    db.add(alert)
    db.commit()
    db.refresh(alert)

    logger.warning(
        f"[WARNING] GEOFENCE BREACH: Device {device.device_id} left safe zone "
        f"{zone_name or 'unknown'}!"
    )
    return alert


def check_geofence_breach(
    device: Device,
    latitude: float,
    longitude: float,
    db: Session,
    *,
    accuracy: Optional[float] = None,
) -> Optional[Alert]:
    """
    Track safe-zone state for a child:
    - Inside ANY safe zone (strict radius) → arm / switch zone silently
    - Leave active zone while armed → breach alert
    - While disarmed / outside all zones → no alerts (moving around is OK)
    """
    try:
        child = db.query(Child).filter(Child.id == device.child_id).first()
        if not child:
            return None

        safezones = (
            db.query(SafeZone)
            .filter(
                SafeZone.child_id == device.child_id,
                SafeZone.zone_type == ZoneType.SAFE,
            )
            .all()
        )
        if not safezones:
            return None

        containing_strict = _zones_containing_location(
            latitude,
            longitude,
            safezones,
            margin_m=0,
        )

        # Definitively inside a zone (strict radius) → arm / switch silently.
        if containing_strict:
            active_zone = _pick_active_zone(containing_strict, child.active_safezone_id)
            previous_zone_id = child.active_safezone_id
            _arm_child_in_zone(child, active_zone, db)
            db.commit()
            if previous_zone_id != active_zone.id:
                logger.info(
                    f"Geofence switched for child {child.id} to zone: "
                    f"{active_zone.zone_name}"
                )
            elif not previous_zone_id:
                logger.info(
                    f"Geofence armed for child {child.id} in zone: {active_zone.zone_name}"
                )
            return None

        # Disarmed and outside all zones — never exit-alert until strict entry.
        if not child.geofence_armed or not child.active_safezone_id:
            _clear_exit_pending(child)
            db.commit()
            return None

        left_zone = (
            db.query(SafeZone).filter(SafeZone.id == child.active_safezone_id).first()
        )
        zone_name = left_zone.zone_name if left_zone else None

        # Armed + strictly outside the active zone → alert on this GPS reading.
        if left_zone:
            dist_active = _distance_to_zone(latitude, longitude, left_zone)
            if dist_active > left_zone.radius:
                return _create_breach_alert(
                    device, child, zone_name, latitude, longitude, db
                )
            return None

        return _create_breach_alert(
            device, child, zone_name, latitude, longitude, db
        )

    except Exception as e:
        logger.exception(f"Error checking geofence breach: {e}")
        db.rollback()
        return None


def check_low_battery_alert(
    device: Device,
    battery_level: float,
    db: Session,
) -> Optional[Alert]:
    """Check if device battery is low and create alert if needed."""
    try:
        LOW_BATTERY_THRESHOLD = 20

        if battery_level > LOW_BATTERY_THRESHOLD:
            return None

        cooldown_time = datetime.utcnow() - timedelta(hours=1)

        recent_alert = (
            db.query(Alert)
            .filter(
                Alert.device_id == device.id,
                Alert.alert_type == AlertType.LOW_BATTERY,
                Alert.created_at >= cooldown_time,
            )
            .first()
        )

        if recent_alert:
            return None

        alert = Alert(
            child_id=device.child_id,
            device_id=device.id,
            alert_type=AlertType.LOW_BATTERY,
            status=AlertStatus.ACTIVE,
            confidence=1.0,
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        logger.warning(
            f"[WARNING] LOW BATTERY: Device {device.device_id} at {battery_level}%"
        )

        return alert

    except Exception as e:
        logger.exception(f"Error checking low battery: {e}")
        return None


def get_child_safezones(child_id, db: Session) -> List[SafeZone]:
    """Get all safe zones for a child."""
    return (
        db.query(SafeZone)
        .filter(SafeZone.child_id == child_id, SafeZone.zone_type == ZoneType.SAFE)
        .all()
    )


def _active_danger_entry_alerts(child_id: UUID, db: Session) -> List[Alert]:
    return (
        db.query(Alert)
        .filter(
            Alert.child_id == child_id,
            Alert.alert_type == AlertType.DANGER_ZONE_ENTRY,
            Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
        )
        .all()
    )


def _resolve_danger_entry_alert(alert: Alert, db: Session, *, note: str | None = None) -> None:
    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()
    if note:
        logger.info(f"Resolved danger zone alert {alert.id}: {note}")


def _create_danger_entry_alert(
    device: Device,
    child: Child,
    zone_name: str,
    latitude: float,
    longitude: float,
    db: Session,
) -> Alert:
    alert = Alert(
        child_id=device.child_id,
        device_id=device.id,
        alert_type=AlertType.DANGER_ZONE_ENTRY,
        zone_name=zone_name,
        location_lat=latitude,
        location_lng=longitude,
        status=AlertStatus.ACTIVE,
        confidence=1.0,
    )
    db.add(alert)
    db.flush()
    logger.warning(
        f"[WARNING] DANGER ZONE ENTRY: Device {device.device_id} entered "
        f"danger zone {zone_name}!"
    )
    return alert


def check_danger_zone_entry(
    device: Device,
    latitude: float,
    longitude: float,
    db: Session,
    *,
    accuracy: Optional[float] = None,
) -> List[Alert]:
    """
    Track danger-zone state for a child:
    - Enter danger zone while no active entry alert → create alert
    - Leave danger zone while active entry alert → auto-resolve
    """
    try:
        child = db.query(Child).filter(Child.id == device.child_id).first()
        if not child:
            return []

        danger_zones = (
            db.query(SafeZone)
            .filter(
                SafeZone.child_id == device.child_id,
                SafeZone.zone_type == ZoneType.DANGER,
            )
            .all()
        )
        if not danger_zones:
            return []

        active_alerts = _active_danger_entry_alerts(device.child_id, db)
        active_by_zone = {a.zone_name: a for a in active_alerts if a.zone_name}

        inside_zone_names: set[str] = set()
        for zone in danger_zones:
            if _distance_to_zone(latitude, longitude, zone) <= zone.radius:
                inside_zone_names.add(zone.zone_name)

        new_alerts: List[Alert] = []

        resolved_any = False
        for zone_name, alert in list(active_by_zone.items()):
            if zone_name not in inside_zone_names:
                _resolve_danger_entry_alert(
                    alert,
                    db,
                    note=f"Child left danger zone {zone_name}",
                )
                resolved_any = True

        for zone in danger_zones:
            if zone.zone_name not in inside_zone_names:
                continue
            if zone.zone_name in active_by_zone:
                continue
            new_alerts.append(
                _create_danger_entry_alert(
                    device,
                    child,
                    zone.zone_name,
                    latitude,
                    longitude,
                    db,
                )
            )

        if new_alerts or resolved_any:
            db.commit()
            for alert in new_alerts:
                db.refresh(alert)

        return new_alerts

    except Exception as e:
        logger.exception(f"Error checking danger zone entry: {e}")
        db.rollback()
        return []
