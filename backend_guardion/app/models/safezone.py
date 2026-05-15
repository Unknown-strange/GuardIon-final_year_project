"""
SafeZone Model
Geofence definitions for child safety zones
"""

from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class SafeZone(Base):
    __tablename__ = "safe_zones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_name = Column(String(255), nullable=False)  # e.g., "Home", "School"
    center_lat = Column(Float, nullable=False)  # Center latitude
    center_lng = Column(Float, nullable=False)  # Center longitude
    radius = Column(Float, nullable=False)  # Radius in meters
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    child = relationship("Child", back_populates="safezones")
    
    def __repr__(self):
        return f"<SafeZone(name={self.zone_name}, child_id={self.child_id}, radius={self.radius}m)>"
