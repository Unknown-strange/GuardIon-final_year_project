"""add child geofence armed state

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-05-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d5e6f7a8b9c0"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "children",
        sa.Column("geofence_armed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "children",
        sa.Column("active_safezone_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_children_active_safezone_id",
        "children",
        "safe_zones",
        ["active_safezone_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_children_active_safezone_id", "children", type_="foreignkey")
    op.drop_column("children", "active_safezone_id")
    op.drop_column("children", "geofence_armed")
