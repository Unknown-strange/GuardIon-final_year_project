"""
Child Model
Represents child profiles
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
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
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="children")
    devices = relationship("Device", back_populates="child", cascade="all, delete-orphan")
    safezones = relationship("SafeZone", back_populates="child", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="child", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="child", cascade="all, delete-orphan")
    guardians = relationship("Guardian", back_populates="child", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Child(id={self.id}, name={self.name})>"
