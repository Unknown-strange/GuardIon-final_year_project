"""add safe_zone_entry alert type

Revision ID: c1d2e3f4a5b6
Revises: b0c1d2e3f4a5
Create Date: 2026-06-23
"""

from alembic import op

revision = "c1d2e3f4a5b6"
down_revision = "b0c1d2e3f4a5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE alerttype ADD VALUE 'SAFE_ZONE_ENTRY'")


def downgrade() -> None:
    pass
