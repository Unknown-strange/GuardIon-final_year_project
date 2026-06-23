"""
Guardians API
Co-guardian management for children
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_db, get_current_active_user, get_user_child
from app.models.user import User
from app.models.child import Child
from app.models.guardian import Guardian
from app.schemas.guardian import GuardianInvite, GuardianResponse, GuardianListResponse

router = APIRouter()


def _role_for_priority(priority: int, is_primary: bool) -> str:
    if is_primary:
        return "Primary Guardian"
    if priority == 2:
        return "Secondary Guardian"
    return f"Guardian (priority {priority})"


def _guardian_responses_for_child(child: Child, db: Session) -> List[GuardianResponse]:
    results: List[GuardianResponse] = []

    owner = db.query(User).filter(User.id == child.user_id).first()
    if owner:
        results.append(GuardianResponse(
            id=f"primary-{child.id}",
            child_id=child.id,
            name=owner.name,
            email=owner.email,
            role="Primary Guardian",
            is_primary=True,
            status="active",
        ))

    links = db.query(Guardian).filter(Guardian.child_id == child.id).all()
    for link in links:
        if link.status == "pending":
            results.append(GuardianResponse(
                id=str(link.id),
                child_id=child.id,
                name=link.invited_email or "Pending invite",
                email=link.invited_email or "",
                role=_role_for_priority(link.priority, False),
                is_primary=False,
                status="pending",
            ))
            continue

        if not link.user_id:
            continue

        user = db.query(User).filter(User.id == link.user_id).first()
        if not user:
            continue

        if user.id == child.user_id:
            continue

        results.append(GuardianResponse(
            id=str(link.id),
            child_id=child.id,
            name=user.name,
            email=user.email,
            role=_role_for_priority(link.priority, False),
            is_primary=False,
            status=link.status or "active",
        ))

    return results


@router.get("/", response_model=GuardianListResponse)
def list_guardians(
    child_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List guardians for the user's children."""
    query = db.query(Child).filter(Child.user_id == current_user.id)
    if child_id:
        query = query.filter(Child.id == child_id)

    children = query.all()
    guardians: List[GuardianResponse] = []
    for child in children:
        guardians.extend(_guardian_responses_for_child(child, db))

    return GuardianListResponse(guardians=guardians)


@router.post("/", response_model=GuardianResponse, status_code=status.HTTP_201_CREATED)
def invite_guardian(
    payload: GuardianInvite,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Invite a co-guardian by email."""
    child = get_user_child(payload.child_id, current_user, db)
    email = payload.email.strip().lower()

    if email == current_user.email.lower():
        raise HTTPException(status_code=400, detail="You are already the primary guardian")

    invited_user = db.query(User).filter(User.email == email).first()

    if invited_user:
        existing = db.query(Guardian).filter(
            Guardian.child_id == child.id,
            Guardian.user_id == invited_user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Guardian already linked to this child")

        link = Guardian(
            user_id=invited_user.id,
            child_id=child.id,
            priority=payload.priority,
            status="active",
        )
        db.add(link)
        db.commit()
        db.refresh(link)

        return GuardianResponse(
            id=str(link.id),
            child_id=child.id,
            name=invited_user.name,
            email=invited_user.email,
            role=_role_for_priority(link.priority, False),
            is_primary=False,
            status="active",
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No account found for this email.",
    )


@router.delete("/{guardian_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_guardian(
    guardian_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Remove a co-guardian link (not the primary guardian)."""
    link = db.query(Guardian).filter(Guardian.id == guardian_id).first()

    if not link:
        raise HTTPException(status_code=404, detail="Guardian not found")

    child = db.query(Child).filter(
        Child.id == link.child_id,
        Child.user_id == current_user.id,
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Guardian not found")

    db.delete(link)
    db.commit()
    return None
