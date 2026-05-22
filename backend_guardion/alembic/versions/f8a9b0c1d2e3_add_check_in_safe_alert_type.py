"""add check_in_safe alert type (Postgres alerttype enum)

Revision ID: f8a9b0c1d2e3
Revises: e6f7a8b9c0d1
Create Date: 2026-05-20

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "f8a9b0c1d2e3"
down_revision = "e6f7a8b9c0d1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Postgres alerttype uses SQLAlchemy enum member names (e.g. GEOFENCE_BREACH).
    op.execute("ALTER TYPE alerttype ADD VALUE 'CHECK_IN_SAFE'")


def downgrade() -> None:
    # Postgres does not provide a portable way to drop a single enum label in use.
    pass
