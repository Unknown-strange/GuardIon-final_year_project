"""
Database Connection and Session Management
"""

import asyncio
import logging
import os
from contextlib import contextmanager
from typing import Callable, Optional, TypeVar

from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError, TimeoutError as PoolTimeoutError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Pool size via env — use smaller values on mqtt worker (e.g. DB_POOL_SIZE=2).
_pool_size = int(os.environ.get("DB_POOL_SIZE", "3"))
_max_overflow = int(os.environ.get("DB_MAX_OVERFLOW", "2"))

# Create database engine — tuned for Supabase session pooler (idle SSL drops)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=_pool_size,
    max_overflow=_max_overflow,
    pool_recycle=300,
    pool_timeout=15,
    echo=False,
)

logger.info(
    "Database pool configured: pool_size=%s max_overflow=%s",
    _pool_size,
    _max_overflow,
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


async def run_with_db_retry_async(
    fn: Callable[[Session], Optional[T]],
    max_attempts: int = 2,
) -> Optional[T]:
    """Run sync DB work in a thread so MQTT handlers don't block the event loop."""
    return await asyncio.to_thread(run_with_db_retry, fn, max_attempts)


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
