"""
Alerts API
Endpoints for managing security alerts
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.child import Child
from app.models.alert import Alert, AlertResponse as AlertResponseModel, AlertStatus, AlertType
from app.services.geofencing import confirm_child_safe
from app.schemas.alert import (
    AlertResponse,
    AlertAcknowledge,
    AlertResolve,
    AlertListResponse,
    AlertStatusEnum,
    AlertTypeEnum
)

router = APIRouter()


@router.get("/active", response_model=AlertListResponse)
def get_active_alerts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all active (unresolved) alerts for the current user's children
    """
    # Get all children for the user
    child_ids = db.query(Child.id).filter(Child.user_id == current_user.id).all()
    child_ids = [c[0] for c in child_ids]
    
    # Get active alerts
    alerts = db.query(Alert).filter(
        Alert.child_id.in_(child_ids),
        Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED])
    ).order_by(desc(Alert.created_at)).all()
    
    return AlertListResponse(
        alerts=alerts,
        total_count=len(alerts)
    )


@router.get("/history", response_model=AlertListResponse)
def get_alert_history(
    alert_type: Optional[AlertTypeEnum] = Query(None, description="Filter by alert type"),
    start_time: Optional[datetime] = Query(None, description="Start time for query range"),
    end_time: Optional[datetime] = Query(None, description="End time for query range"),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get alert history for the current user's children
    """
    # Get all children for the user
    child_ids = db.query(Child.id).filter(Child.user_id == current_user.id).all()
    child_ids = [c[0] for c in child_ids]
    
    # Build query
    query = db.query(Alert).filter(Alert.child_id.in_(child_ids))
    
    # Apply filters
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
    if start_time:
        query = query.filter(Alert.created_at >= start_time)
    if end_time:
        query = query.filter(Alert.created_at <= end_time)
    
    # Get total count
    total_count = query.count()
    
    # Get alerts
    alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()
    
    return AlertListResponse(
        alerts=alerts,
        total_count=total_count
    )


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific alert by ID
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Verify the alert belongs to one of the user's children
    child = db.query(Child).filter(
        Child.id == alert.child_id,
        Child.user_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this alert"
        )
    
    return alert


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: UUID,
    response_data: AlertAcknowledge,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Acknowledge an alert (mark that you've seen it)
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Verify the alert belongs to one of the user's children
    child = db.query(Child).filter(
        Child.id == alert.child_id,
        Child.user_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this alert"
        )
    
    # Update alert status
    alert.status = AlertStatus.ACKNOWLEDGED
    
    # Create response record
    alert_response = AlertResponseModel(
        alert_id=alert.id,
        user_id=current_user.id,
        response_type="acknowledged",
        response_text=response_data.response_text
    )
    
    db.add(alert_response)
    db.commit()
    db.refresh(alert)
    
    return alert


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: UUID,
    response_data: AlertResolve,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Resolve an alert (mark as handled/completed)
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Verify the alert belongs to one of the user's children
    child = db.query(Child).filter(
        Child.id == alert.child_id,
        Child.user_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this alert"
        )
    
    # Update alert status
    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()
    
    # Create response record
    alert_response = AlertResponseModel(
        alert_id=alert.id,
        user_id=current_user.id,
        response_type="resolved",
        response_text=response_data.response_text
    )
    
    db.add(alert_response)

    if alert.alert_type == AlertType.GEOFENCE_BREACH:
        confirm_child_safe(
            alert.child_id,
            db,
            resolution_note=response_data.response_text
            or "Guardian confirmed child is safe",
        )

    db.commit()
    db.refresh(alert)
    
    return alert


@router.get("/child/{child_id}/active", response_model=AlertListResponse)
def get_child_active_alerts(
    child_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get active alerts for a specific child
    """
    # Verify the child belongs to the current user
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.user_id == current_user.id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or does not belong to you"
        )
    
    # Get active alerts for this child
    alerts = db.query(Alert).filter(
        Alert.child_id == child_id,
        Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED])
    ).order_by(desc(Alert.created_at)).all()
    
    return AlertListResponse(
        alerts=alerts,
        total_count=len(alerts)
    )
