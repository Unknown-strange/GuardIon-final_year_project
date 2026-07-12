"""add child_missing alert type and missing_child notification preference

Revision ID: a9b0c1d2e3f4
Revises: f8a9b0c1d2e3
Create Date: 2026-06-23
"""

from alembic import op
import sqlalchemy as sa

revision = "a9b0c1d2e3f4"
down_revision = "f8a9b0c1d2e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE alerttype ADD VALUE 'CHILD_MISSING'")
    op.add_column(
        "notification_preferences",
        sa.Column("missing_child_enabled", sa.Boolean(), server_default="true", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("notification_preferences", "missing_child_enabled")
