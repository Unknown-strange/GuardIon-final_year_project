"""
Child Model
Represents child profiles
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Child(Base):
    __tablename__ = "children"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    age = Column(Integer)
    profile_photo = Column(String(500))  # URL or file path
    geofence_armed = Column(Boolean, default=False, nullable=False)
    active_safezone_id = Column(
        UUID(as_uuid=True),
        ForeignKey("safe_zones.id", ondelete="SET NULL"),
        nullable=True,
    )
    geofence_exit_pending_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="children")
    devices = relationship("Device", back_populates="child", cascade="all, delete-orphan")
    safezones = relationship(
        "SafeZone",
        back_populates="child",
        cascade="all, delete-orphan",
        foreign_keys="SafeZone.child_id",
    )
    events = relationship("Event", back_populates="child", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="child", cascade="all, delete-orphan")
    guardians = relationship("Guardian", back_populates="child", cascade="all, delete-orphan")
    emergency_contacts = relationship("EmergencyContact", back_populates="child", cascade="all, delete-orphan")
    check_ins = relationship("CheckIn", back_populates="child", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Child(id={self.id}, name={self.name})>"
