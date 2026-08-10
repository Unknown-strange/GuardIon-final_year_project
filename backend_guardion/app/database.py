"""
Database Connection and Session Management
"""

import logging
from contextlib import contextmanager
from typing import Callable, Optional, TypeVar

from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError, TimeoutError as PoolTimeoutError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Create database engine — tuned for Render Postgres (idle SSL drops)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=3,
    pool_recycle=300,
    pool_timeout=25,
    echo=settings.DEBUG,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()


def run_with_db_retry(
    fn: Callable[[Session], Optional[T]],
    max_attempts: int = 2,
) -> Optional[T]:
    """
    Run a DB callback with automatic retry on stale SSL / connection errors.
    The callback receives an open session and must commit/rollback as needed.
    """
    last_exc: Optional[OperationalError] = None

    for attempt in range(max_attempts):
        db = SessionLocal()
        try:
            return fn(db)
        except PoolTimeoutError:
            db.rollback()
            logger.error("Database pool exhausted — skipping retry")
            raise
        except OperationalError as exc:
            db.rollback()
            last_exc = exc
            logger.warning(
                "Database connection error (attempt %s/%s): %s",
                attempt + 1,
                max_attempts,
                exc,
            )
            if attempt + 1 >= max_attempts:
                raise
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    if last_exc is not None:
        raise last_exc
    return None


@contextmanager
def session_scope():
    """Provide a transactional scope that always closes the session."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db():
    """
    Dependency function to get database session
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
