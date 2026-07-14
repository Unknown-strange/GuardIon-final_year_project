"""
Activity feed schemas
Unified timeline items for History tab
"""

from datetime import datetime
from enum import Enum
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ActivityKind(str, Enum):
    ALERT = "alert"
    LOCATION = "location"
    CHECK_IN = "check_in"


class ActivityItemResponse(BaseModel):
    id: str
    kind: ActivityKind
    alert_type: Optional[str] = None
    child_id: UUID
    child_name: Optional[str] = None
    title: str
    body: str
    timestamp: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    zone_name: Optional[str] = None


class ActivityStatsResponse(BaseModel):
    safe_zones_visited: int = 0
    check_ins_completed: int = 0
    alerts_triggered: int = 0
    time_active_seconds: Optional[int] = None
    last_location_at: Optional[datetime] = None


class ActivityListResponse(BaseModel):
    items: List[ActivityItemResponse]
    total_count: int
    stats: ActivityStatsResponse = Field(default_factory=ActivityStatsResponse)
