"""add zone_type on safe_zones and DANGER_ZONE_ENTRY alert type

Revision ID: b0c1d2e3f4a5
Revises: a9b0c1d2e3f4
Create Date: 2026-06-23
"""

from alembic import op
import sqlalchemy as sa

revision = "b0c1d2e3f4a5"
down_revision = "a9b0c1d2e3f4"
branch_labels = None
depends_on = None

zonetype = sa.Enum("SAFE", "DANGER", name="zonetype")


def upgrade() -> None:
    zonetype.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "safe_zones",
        sa.Column(
            "zone_type",
            zonetype,
            nullable=False,
            server_default="SAFE",
        ),
    )
    op.execute("ALTER TYPE alerttype ADD VALUE 'DANGER_ZONE_ENTRY'")


def downgrade() -> None:
    op.drop_column("safe_zones", "zone_type")
    zonetype.drop(op.get_bind(), checkfirst=True)
