"""
Event Model
Comprehensive event log for tracking all activities
"""

from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class EventType(str, enum.Enum):
    """Event type enum"""
    MOVEMENT = "movement"
    GEOFENCE_EXIT = "geofence_exit"
    GEOFENCE_ENTER = "geofence_enter"
    EMERGENCY = "emergency"
    LOW_BATTERY = "low_battery"
    DEVICE_OFFLINE = "device_offline"
    DEVICE_ONLINE = "device_online"


class Event(Base):
    __tablename__ = "events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(SQLEnum(EventType), nullable=False, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    event_metadata = Column(JSON)  # Additional event-specific data (renamed from 'metadata')
    confidence = Column(Float, default=1.0)  # For ML/pattern recognition
    unprocessed = Column(Boolean, default=False)  # For async processing
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    device = relationship("Device", back_populates="events")
    child = relationship("Child", back_populates="events")
    
    def __repr__(self):
        return f"<Event(type={self.event_type}, device_id={self.device_id})>"
