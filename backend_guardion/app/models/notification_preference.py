"""
Notification Preferences Model
Per-user alert delivery toggles
"""

from sqlalchemy import Column, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    sos_enabled = Column(Boolean, default=True, nullable=False)
    geofence_enabled = Column(Boolean, default=True, nullable=False)
    battery_enabled = Column(Boolean, default=False, nullable=False)
    weekly_summary_enabled = Column(Boolean, default=True, nullable=False)
    missing_child_enabled = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notification_preferences")
