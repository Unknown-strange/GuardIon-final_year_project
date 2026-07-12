"""
Shared helpers for primary-guardian and co-guardian child access.
"""

from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.child import Child
from app.models.guardian import Guardian
from app.models.user import User


def co_guardian_child_ids(user: User, db: Session) -> List[UUID]:
    rows = (
        db.query(Guardian.child_id)
        .filter(
            Guardian.user_id == user.id,
            Guardian.status == "active",
        )
        .all()
    )
    return [row[0] for row in rows]


def accessible_child_ids(user: User, db: Session) -> List[UUID]:
    owned = [
        row[0]
        for row in db.query(Child.id).filter(Child.user_id == user.id).all()
    ]
    shared = co_guardian_child_ids(user, db)
    seen: set[UUID] = set()
    result: List[UUID] = []
    for child_id in owned + shared:
        if child_id in seen:
            continue
        seen.add(child_id)
        result.append(child_id)
    return result


def user_can_access_child(user: User, child_id: UUID, db: Session) -> bool:
    owned = (
        db.query(Child.id)
        .filter(Child.id == child_id, Child.user_id == user.id)
        .first()
    )
    if owned:
        return True

    link = (
        db.query(Guardian.id)
        .filter(
            Guardian.child_id == child_id,
            Guardian.user_id == user.id,
            Guardian.status == "active",
        )
        .first()
    )
    return link is not None


def user_owns_child(user: User, child_id: UUID, db: Session) -> bool:
    return (
        db.query(Child.id)
        .filter(Child.id == child_id, Child.user_id == user.id)
        .first()
        is not None
    )


def get_accessible_child(child_id: UUID, user: User, db: Session) -> Child:
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child or not user_can_access_child(user, child_id, db):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )
    return child


def get_owned_child(child_id: UUID, user: User, db: Session) -> Child:
    child = (
        db.query(Child)
        .filter(Child.id == child_id, Child.user_id == user.id)
        .first()
    )
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )
    return child


def guardian_user_ids_for_child(child_id: UUID, db: Session) -> List[str]:
    """Primary owner plus active co-guardians — for alerts and notifications."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return []

    user_ids: List[str] = [str(child.user_id)]
    rows = (
        db.query(Guardian.user_id)
        .filter(
            Guardian.child_id == child_id,
            Guardian.status == "active",
            Guardian.user_id.isnot(None),
        )
        .all()
    )
    for (uid,) in rows:
        uid_str = str(uid)
        if uid_str not in user_ids:
            user_ids.append(uid_str)
    return user_ids
