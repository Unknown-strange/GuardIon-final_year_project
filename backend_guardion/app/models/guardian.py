"""
Guardian Model
Junction table managing multi-guardian relationships
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Guardian(Base):
    __tablename__ = "guardians"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    priority = Column(Integer, default=1)  # 1=primary, 2=secondary, etc.
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="guardians")
    child = relationship("Child", back_populates="guardians")
    
    def __repr__(self):
        return f"<Guardian(user_id={self.user_id}, child_id={self.child_id}, priority={self.priority})>"
