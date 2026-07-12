"""
Guardians API
Co-guardian management for children
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_db, get_current_active_user, get_owned_child
from app.api.child_access import accessible_child_ids
from app.models.user import User
from app.models.child import Child
from app.models.guardian import Guardian
from app.models.notification import Notification
from app.schemas.guardian import (
    GuardianInvite,
    GuardianResponse,
    GuardianListResponse,
    GuardianInviteResponse,
    GuardianInviteListResponse,
)
from app.services.guardian_invites import create_guardian_invite_notification

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


def _pending_invite_for_user(
    guardian_id: UUID,
    current_user: User,
    db: Session,
) -> Guardian:
    link = (
        db.query(Guardian)
        .filter(
            Guardian.id == guardian_id,
            Guardian.user_id == current_user.id,
            Guardian.status == "pending",
        )
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Invite not found")
    return link


@router.get("/invites", response_model=GuardianInviteListResponse)
def list_pending_invites(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List co-guardian invites awaiting acceptance for the current user."""
    links = (
        db.query(Guardian)
        .filter(
            Guardian.user_id == current_user.id,
            Guardian.status == "pending",
        )
        .all()
    )

    invites: List[GuardianInviteResponse] = []
    for link in links:
        child = db.query(Child).filter(Child.id == link.child_id).first()
        if not child:
            continue

        inviter = db.query(User).filter(User.id == child.user_id).first()
        if not inviter:
            continue

        invites.append(GuardianInviteResponse(
            id=link.id,
            child_id=child.id,
            child_name=child.name,
            invited_by_name=inviter.name,
            invited_by_email=inviter.email,
            status="pending",
        ))

    return GuardianInviteListResponse(invites=invites)


@router.get("/", response_model=GuardianListResponse)
def list_guardians(
    child_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List guardians for children the current user can access."""
    child_ids = accessible_child_ids(current_user, db)
    if not child_ids:
        return GuardianListResponse(guardians=[])

    query = db.query(Child).filter(Child.id.in_(child_ids))
    if child_id:
        if child_id not in child_ids:
            raise HTTPException(status_code=404, detail="Child not found")
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
    child = get_owned_child(payload.child_id, current_user, db)
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
            if existing.status == "pending":
                raise HTTPException(status_code=400, detail="Invite already pending for this user")
            raise HTTPException(status_code=400, detail="Guardian already linked to this child")

        link = Guardian(
            user_id=invited_user.id,
            child_id=child.id,
            invited_email=email,
            priority=payload.priority,
            status="pending",
        )
        db.add(link)
        db.commit()
        db.refresh(link)

        create_guardian_invite_notification(
            invited_user=invited_user,
            inviter=current_user,
            child=child,
            guardian_link_id=link.id,
            db=db,
        )

        return GuardianResponse(
            id=str(link.id),
            child_id=child.id,
            name=invited_user.name,
            email=invited_user.email,
            role=_role_for_priority(link.priority, False),
            is_primary=False,
            status="pending",
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No account found for this email.",
    )


@router.post("/{guardian_id}/accept", response_model=GuardianResponse)
def accept_guardian_invite(
    guardian_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Accept a pending co-guardian invite."""
    link = _pending_invite_for_user(guardian_id, current_user, db)
    child = db.query(Child).filter(Child.id == link.child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    link.status = "active"
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.type == "guardian_invite",
        Notification.read == False,
    ).update({"read": True}, synchronize_session=False)
    db.commit()
    db.refresh(link)

    return GuardianResponse(
        id=str(link.id),
        child_id=child.id,
        name=current_user.name,
        email=current_user.email,
        role=_role_for_priority(link.priority, False),
        is_primary=False,
        status="active",
    )


@router.post("/{guardian_id}/decline", status_code=status.HTTP_204_NO_CONTENT)
def decline_guardian_invite(
    guardian_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Decline a pending co-guardian invite."""
    link = _pending_invite_for_user(guardian_id, current_user, db)
    db.delete(link)
    db.commit()
    return None


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
