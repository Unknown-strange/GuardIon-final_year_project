"""
Structured child profile deletion.

Clears geofence FK references and bulk-deletes heavy related rows before
removing the child so PostgreSQL does not hit circular FK errors or slow
ORM cascades on location_history.
"""

import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.child import Child
from app.models.location import LocationHistory
from app.models.safezone import SafeZone

logger = logging.getLogger(__name__)


def delete_child_profile(child: Child, db: Session) -> None:
    child_id: UUID = child.id
    device_ids = [device.id for device in child.devices]

    try:
        if device_ids:
            db.query(LocationHistory).filter(
                LocationHistory.device_id.in_(device_ids)
            ).delete(synchronize_session=False)

        db.query(SafeZone).filter(SafeZone.child_id == child_id).delete(
            synchronize_session=False
        )

        child.active_safezone_id = None
        child.geofence_armed = False
        child.geofence_exit_pending_at = None
        db.flush()

        db.delete(child)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to delete child profile %s", child_id)
        raise
