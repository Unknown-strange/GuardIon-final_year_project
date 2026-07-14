"""
Unified activity feed for History tab.
Merges alerts, sampled location history, and confirmed check-ins.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.alert import Alert, AlertType
from app.models.check_in import CheckIn
from app.models.child import Child
from app.models.device import Device
from app.models.location import LocationHistory
from app.schemas.activity import (
    ActivityItemResponse,
    ActivityKind,
    ActivityListResponse,
    ActivityStatsResponse,
)

MAX_LOCATIONS_PER_CHILD = 15
SAFE_ALERT_TYPES = {AlertType.SAFE_ZONE_ENTRY, AlertType.CHECK_IN_SAFE}


@dataclass
class _FeedItem:
    sort_key: datetime
    item: ActivityItemResponse


def _alert_title(alert_type: AlertType, zone_name: Optional[str]) -> str:
    if alert_type == AlertType.SOS:
        return "Panic button SOS"
    if alert_type == AlertType.GEOFENCE_BREACH:
        return "Geofence Exit"
    if alert_type == AlertType.CHECK_IN_SAFE:
        return "Safe check-in"
    if alert_type == AlertType.LOW_BATTERY:
        return "Low battery"
    if alert_type == AlertType.DEVICE_OFFLINE:
        return "Device offline"
    if alert_type == AlertType.DEVICE_TAMPER:
        return "Device tamper"
    if alert_type == AlertType.CHILD_MISSING:
        return "Missing child alert"
    if alert_type == AlertType.DANGER_ZONE_ENTRY:
        return "Danger zone alert"
    if alert_type == AlertType.SAFE_ZONE_ENTRY:
        zone = (zone_name or "").strip() or "safe zone"
        return f"Arrived at {zone}"
    return alert_type.value.replace("_", " ").title()


def _alert_body(alert_type: AlertType, child_name: str, zone_name: Optional[str]) -> str:
    if alert_type == AlertType.SOS:
        return f"{child_name} pressed the panic button"
    if alert_type == AlertType.CHECK_IN_SAFE:
        return f"{child_name} confirmed they are safe (device check-in)"
    if alert_type == AlertType.GEOFENCE_BREACH:
        zone = (zone_name or "").strip() or "safe zone"
        return f"{child_name} left the {zone} boundary"
    if alert_type == AlertType.LOW_BATTERY:
        return f"{child_name}'s device battery is low"
    if alert_type == AlertType.DEVICE_OFFLINE:
        return f"{child_name}'s device is offline"
    if alert_type == AlertType.DEVICE_TAMPER:
        return f"{child_name}'s device may have been tampered with"
    if alert_type == AlertType.CHILD_MISSING:
        return f"{child_name} was reported missing by a guardian"
    if alert_type == AlertType.DANGER_ZONE_ENTRY:
        zone = (zone_name or "").strip() or "danger zone"
        return f"{child_name} entered danger zone {zone}"
    if alert_type == AlertType.SAFE_ZONE_ENTRY:
        zone = (zone_name or "").strip() or "safe zone"
        return f"{child_name} arrived at {zone}"
    return alert_type.value.replace("_", " ")


def _is_danger_alert(alert_type: AlertType) -> bool:
    return alert_type in (
        AlertType.SOS,
        AlertType.DANGER_ZONE_ENTRY,
        AlertType.CHILD_MISSING,
    )


def _is_warning_alert(alert_type: AlertType) -> bool:
    return alert_type in (
        AlertType.GEOFENCE_BREACH,
        AlertType.LOW_BATTERY,
        AlertType.DEVICE_OFFLINE,
        AlertType.DEVICE_TAMPER,
    )


def _sample_locations(rows: List[LocationHistory], max_count: int) -> List[LocationHistory]:
    if len(rows) <= max_count:
        return rows
    step = len(rows) / max_count
    picked: List[LocationHistory] = []
    for i in range(max_count):
        idx = int(i * step)
        if idx < len(rows):
            picked.append(rows[idx])
    return picked


def _child_name_map(db: Session, child_ids: List[UUID]) -> dict[UUID, str]:
    if not child_ids:
        return {}
    rows = db.query(Child.id, Child.name).filter(Child.id.in_(child_ids)).all()
    return {row[0]: row[1] for row in rows}


def build_activity_feed(
    db: Session,
    *,
    child_ids: List[UUID],
    child_id: Optional[UUID] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100,
) -> ActivityListResponse:
    if not child_ids:
        return ActivityListResponse(items=[], total_count=0)

    scoped_ids = [child_id] if child_id else child_ids
    if child_id and child_id not in child_ids:
        return ActivityListResponse(items=[], total_count=0)

    names = _child_name_map(db, scoped_ids)
    feed: List[_FeedItem] = []

    alert_query = db.query(Alert).filter(Alert.child_id.in_(scoped_ids))
    if start_time:
        alert_query = alert_query.filter(Alert.created_at >= start_time)
    if end_time:
        alert_query = alert_query.filter(Alert.created_at <= end_time)
    alerts = alert_query.order_by(desc(Alert.created_at)).limit(limit * 2).all()

    for alert in alerts:
        child_name = names.get(alert.child_id, "Child")
        alert_type = alert.alert_type
        feed.append(
            _FeedItem(
                sort_key=alert.created_at,
                item=ActivityItemResponse(
                    id=f"alert:{alert.id}",
                    kind=ActivityKind.ALERT,
                    alert_type=alert_type.value,
                    child_id=alert.child_id,
                    child_name=child_name,
                    title=_alert_title(alert_type, alert.zone_name),
                    body=_alert_body(alert_type, child_name, alert.zone_name),
                    timestamp=alert.created_at,
                    latitude=alert.location_lat,
                    longitude=alert.location_lng,
                    zone_name=alert.zone_name,
                ),
            )
        )

    devices = db.query(Device).filter(Device.child_id.in_(scoped_ids)).all()
    device_to_child = {d.id: d.child_id for d in devices}
    device_ids = list(device_to_child.keys())

    location_rows: List[LocationHistory] = []
    if device_ids:
        loc_query = db.query(LocationHistory).filter(LocationHistory.device_id.in_(device_ids))
        if start_time:
            loc_query = loc_query.filter(LocationHistory.timestamp >= start_time)
        if end_time:
            loc_query = loc_query.filter(LocationHistory.timestamp <= end_time)
        location_rows = loc_query.order_by(desc(LocationHistory.timestamp)).limit(limit * 4).all()

    by_child: dict[UUID, List[LocationHistory]] = {}
    for row in location_rows:
        cid = device_to_child.get(row.device_id)
        if cid is None:
            continue
        by_child.setdefault(cid, []).append(row)

    for cid, rows in by_child.items():
        child_name = names.get(cid, "Child")
        for loc in _sample_locations(rows, MAX_LOCATIONS_PER_CHILD):
            feed.append(
                _FeedItem(
                    sort_key=loc.timestamp,
                    item=ActivityItemResponse(
                        id=f"location:{loc.id}",
                        kind=ActivityKind.LOCATION,
                        child_id=cid,
                        child_name=child_name,
                        title=f"Location update · {child_name}",
                        body=f"{loc.latitude:.4f}, {loc.longitude:.4f}",
                        timestamp=loc.timestamp,
                        latitude=loc.latitude,
                        longitude=loc.longitude,
                    ),
                )
            )

    check_in_query = db.query(CheckIn).filter(
        CheckIn.child_id.in_(scoped_ids),
        CheckIn.status == "confirmed",
        CheckIn.confirmed_at.isnot(None),
    )
    if start_time:
        check_in_query = check_in_query.filter(CheckIn.confirmed_at >= start_time)
    if end_time:
        check_in_query = check_in_query.filter(CheckIn.confirmed_at <= end_time)
    check_ins = check_in_query.order_by(desc(CheckIn.confirmed_at)).limit(limit).all()

    for check_in in check_ins:
        child_name = names.get(check_in.child_id, "Child")
        confirmed_at = check_in.confirmed_at
        if confirmed_at is None:
            continue
        feed.append(
            _FeedItem(
                sort_key=confirmed_at,
                item=ActivityItemResponse(
                    id=f"check_in:{check_in.id}",
                    kind=ActivityKind.CHECK_IN,
                    alert_type=AlertType.CHECK_IN_SAFE.value,
                    child_id=check_in.child_id,
                    child_name=child_name,
                    title="Safe check-in",
                    body=f"{child_name} completed a guardian check-in",
                    timestamp=confirmed_at,
                ),
            )
        )

    feed.sort(key=lambda entry: entry.sort_key, reverse=True)
    items = [entry.item for entry in feed[:limit]]

    stats = _compute_stats(items, location_rows)
    return ActivityListResponse(items=items, total_count=len(feed), stats=stats)


def _compute_stats(
    items: List[ActivityItemResponse],
    location_rows: List[LocationHistory],
) -> ActivityStatsResponse:
    safe_zones = sum(
        1 for i in items if i.alert_type == AlertType.SAFE_ZONE_ENTRY.value
    )
    check_ins = sum(
        1
        for i in items
        if i.kind == ActivityKind.CHECK_IN
        or i.alert_type == AlertType.CHECK_IN_SAFE.value
    )
    alerts_triggered = sum(
        1
        for i in items
        if i.kind == ActivityKind.ALERT
        and i.alert_type not in {t.value for t in SAFE_ALERT_TYPES}
    )

    timestamps = sorted(
        [row.timestamp for row in location_rows if row.timestamp is not None]
    )
    time_active_seconds: Optional[int] = None
    if len(timestamps) >= 2:
        delta = timestamps[-1] - timestamps[0]
        time_active_seconds = max(0, int(delta.total_seconds()))

    last_location_at = timestamps[-1] if timestamps else None

    return ActivityStatsResponse(
        safe_zones_visited=safe_zones,
        check_ins_completed=check_ins,
        alerts_triggered=alerts_triggered,
        time_active_seconds=time_active_seconds,
        last_location_at=last_location_at,
    )
