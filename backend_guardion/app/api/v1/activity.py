"""
Activity feed API
Unified history timeline for guardian app
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.child_access import accessible_child_ids, user_can_access_child
from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.activity import ActivityListResponse
from app.services.activity_feed import build_activity_feed

router = APIRouter()


@router.get("", response_model=ActivityListResponse)
def get_activity_feed(
    child_id: Optional[UUID] = Query(None, description="Filter by child"),
    start_time: Optional[datetime] = Query(None, description="Range start (inclusive)"),
    end_time: Optional[datetime] = Query(None, description="Range end (inclusive)"),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Merged activity feed: alerts, movement (sampled), and confirmed check-ins.
    """
    child_ids = accessible_child_ids(current_user, db)
    if not child_ids:
        return ActivityListResponse(items=[], total_count=0)

    if child_id is not None and not user_can_access_child(current_user, child_id, db):
        return ActivityListResponse(items=[], total_count=0)

    return build_activity_feed(
        db,
        child_ids=child_ids,
        child_id=child_id,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
    )
