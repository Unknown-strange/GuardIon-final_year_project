"""
Device Models
Represents wearable devices and their health metrics
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class DeviceStatus(str, enum.Enum):
    """Device status enum"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOST = "lost"
    CHARGING = "charging"


class Device(Base):
    __tablename__ = "devices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    device_id = Column(String(100), unique=True, nullable=False, index=True)  # ESP32 identifier
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(DeviceStatus), default=DeviceStatus.ACTIVE, nullable=False)
    battery_level = Column(Integer)  # 0-100 percentage
    signal_strength = Column(Integer)  # RSSI in dBm
    last_seen = Column(DateTime, index=True)  # Last communication timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    child = relationship("Child", back_populates="devices")
    location_history = relationship("LocationHistory", back_populates="device", cascade="all, delete-orphan")
    device_health = relationship("DeviceHealth", back_populates="device", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="device", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="device", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Device(id={self.device_id}, status={self.status})>"


class DeviceHealth(Base):
    __tablename__ = "device_health"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    battery_level = Column(Integer)
    signal_strength = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    device = relationship("Device", back_populates="device_health")
    
    def __repr__(self):
        return f"<DeviceHealth(device_id={self.device_id}, battery={self.battery_level}%)>"
