"""
Emergency Contacts API
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.api.deps import get_db, get_current_active_user, get_user_child
from app.models.user import User
from app.models.emergency_contact import EmergencyContact
from app.schemas.emergency_contact import (
    EmergencyContactCreate,
    EmergencyContactUpdate,
    EmergencyContactResponse,
    EmergencyContactListResponse,
)
from app.api.v1.emergency_contacts_helpers import emergency_contact_to_response

router = APIRouter()


@router.get("/", response_model=EmergencyContactListResponse)
def list_emergency_contacts(
    child_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(EmergencyContact).filter(EmergencyContact.user_id == current_user.id)
    if child_id:
        get_user_child(child_id, current_user, db)
        query = query.filter(EmergencyContact.child_id == child_id)

    contacts = query.order_by(EmergencyContact.created_at.desc()).all()
    return EmergencyContactListResponse(
        contacts=[emergency_contact_to_response(c) for c in contacts]
    )


@router.post("/", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
def create_emergency_contact(
    payload: EmergencyContactCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    get_user_child(payload.child_id, current_user, db)

    contact = EmergencyContact(
        user_id=current_user.id,
        child_id=payload.child_id,
        name=payload.name.strip(),
        phone=payload.phone.strip(),
        relation_label=payload.relationship,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return emergency_contact_to_response(contact)


@router.patch("/{contact_id}", response_model=EmergencyContactResponse)
def update_emergency_contact(
    contact_id: UUID,
    payload: EmergencyContactUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id,
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Emergency contact not found")

    if payload.name is not None:
        contact.name = payload.name.strip()
    if payload.phone is not None:
        contact.phone = payload.phone.strip()
    if payload.relationship is not None:
        contact.relation_label = payload.relationship

    db.commit()
    db.refresh(contact)
    return emergency_contact_to_response(contact)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emergency_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id,
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Emergency contact not found")

    db.delete(contact)
    db.commit()
    return None
