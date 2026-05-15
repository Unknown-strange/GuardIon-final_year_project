"""
Alert Models
Security alerts and responses
"""

from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class AlertType(str, enum.Enum):
    """Alert type enum"""
    SOS = "SOS"
    GEOFENCE_BREACH = "geofence_breach"
    LOW_BATTERY = "low_battery"
    DEVICE_OFFLINE = "device_offline"
    DEVICE_TAMPER = "device_tamper"


class AlertStatus(str, enum.Enum):
    """Alert status enum"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(SQLEnum(AlertType), nullable=False, index=True)
    location_lat = Column(Float)
    location_lng = Column(Float)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.ACTIVE, nullable=False, index=True)
    confidence = Column(Float, default=1.0)
    unprocessed = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    child = relationship("Child", back_populates="alerts")
    device = relationship("Device", back_populates="alerts")
    alert_responses = relationship("AlertResponse", back_populates="alert", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Alert(type={self.alert_type}, status={self.status}, child_id={self.child_id})>"


class AlertResponse(Base):
    __tablename__ = "alert_responses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    response_type = Column(String(50))  # "acknowledged", "resolved", "escalated"
    response_text = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    alert = relationship("Alert", back_populates="alert_responses")
    
    def __repr__(self):
        return f"<AlertResponse(alert_id={self.alert_id}, type={self.response_type})>"
