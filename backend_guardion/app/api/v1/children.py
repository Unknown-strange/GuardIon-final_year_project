"""
Children Management API
Endpoints for managing child profiles
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_active_user, get_user_child, get_owned_child
from app.api.child_access import accessible_child_ids
from app.models.user import User
from app.models.child import Child
from app.schemas.child import ChildCreate, ChildUpdate, ChildResponse

router = APIRouter()


@router.post("/", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
def create_child(
    child_data: ChildCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new child profile for the current user
    """
    # Create child
    db_child = Child(
        user_id=current_user.id,
        name=child_data.name,
        age=child_data.age,
        profile_photo=child_data.profile_photo
    )
    
    db.add(db_child)
    db.commit()
    db.refresh(db_child)
    
    return db_child


@router.get("/", response_model=List[ChildResponse])
def list_children(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all children the current user owns or co-guards
    """
    child_ids = accessible_child_ids(current_user, db)
    if not child_ids:
        return []
    children = db.query(Child).filter(Child.id.in_(child_ids)).all()
    return children


@router.get("/{child_id}", response_model=ChildResponse)
def get_child(
    child_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific child by ID
    """
    return get_user_child(child_id, current_user, db)


@router.patch("/{child_id}", response_model=ChildResponse)
def update_child(
    child_id: UUID,
    child_data: ChildUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a child's information
    """
    child = get_owned_child(child_id, current_user, db)
    
    # Update fields if provided
    update_data = child_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(child, field, value)
    
    db.commit()
    db.refresh(child)
    
    return child


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child(
    child_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a child profile (also deletes associated devices, alerts, etc.)
    """
    child = get_owned_child(child_id, current_user, db)
    
    db.delete(child)
    db.commit()
    
    return None
