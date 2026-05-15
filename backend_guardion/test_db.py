"""
Test database connection
"""

from app.database import engine, SessionLocal
from app.models.user import User
from sqlalchemy import text

print("Testing database connection...")

try:
    # Test connection
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("[OK] Database connection successful!")
    
    # Test session
    db = SessionLocal()
    users = db.query(User).all()
    print(f"[OK] Can query User table. Found {len(users)} users.")
    db.close()
    
except Exception as e:
    print(f"[ERROR] Database error: {e}")
