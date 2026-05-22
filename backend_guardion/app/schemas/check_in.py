"""Check-in schemas"""

from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class CheckInCreate(BaseModel):
    child_id: UUID


class CheckInResponse(BaseModel):
    id: UUID
    child_id: UUID
    status: str
    requested_at: datetime
    confirmed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CheckInListResponse(BaseModel):
    check_ins: List[CheckInResponse]
