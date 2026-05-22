"""Map emergency contact ORM model to API response."""

from app.models.emergency_contact import EmergencyContact
from app.schemas.emergency_contact import EmergencyContactResponse


def emergency_contact_to_response(contact: EmergencyContact) -> EmergencyContactResponse:
    return EmergencyContactResponse(
        id=contact.id,
        child_id=contact.child_id,
        name=contact.name,
        phone=contact.phone,
        relationship=contact.relation_label,
        created_at=contact.created_at,
    )
