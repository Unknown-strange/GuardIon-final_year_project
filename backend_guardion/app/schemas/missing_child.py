"""Missing child report schemas"""

from typing import Optional

from pydantic import BaseModel, Field
from uuid import UUID

from app.schemas.alert import AlertResponse


class ReportMissingChildRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=1000)
    last_seen_description: Optional[str] = Field(None, max_length=500)
    use_device_location: bool = True


class ReportMissingChildResponse(BaseModel):
    alert: AlertResponse
    guardians_notified: int
