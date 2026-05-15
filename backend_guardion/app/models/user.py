"""
User Model
Represents parent/guardian accounts
"""

from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Hashed password
    phone_number = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    children = relationship("Child", back_populates="user", cascade="all, delete-orphan")
    guardians = relationship("Guardian", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
