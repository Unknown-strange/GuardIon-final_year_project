"""
LocationHistory Model
Stores GPS location breadcrumb trail
"""

from sqlalchemy import Column, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class LocationHistory(Base):
    __tablename__ = "location_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float)  # GPS accuracy in meters
    altitude = Column(Float)  # Altitude in meters
    speed = Column(Float)  # Speed in m/s
    battery_level = Column(Float)  # Battery at time of reading
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Relationships
    device = relationship("Device", back_populates="location_history")
    
    def __repr__(self):
        return f"<LocationHistory(device_id={self.device_id}, lat={self.latitude}, lng={self.longitude})>"
