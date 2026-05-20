"""Add email verifications table for OTP auth

Revision ID: a1b2c3d4e5f6
Revises: 6b79fb19e99f
Create Date: 2026-05-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "a1b2c3d4e5f6"
down_revision = "6b79fb19e99f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "email_verifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column(
            "purpose",
            sa.Enum("signup", "password_reset", name="otppurpose"),
            nullable=False,
        ),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_verifications_email"), "email_verifications", ["email"], unique=False)
    op.create_index(op.f("ix_email_verifications_expires_at"), "email_verifications", ["expires_at"], unique=False)
    op.create_index(op.f("ix_email_verifications_id"), "email_verifications", ["id"], unique=False)
    op.create_index(op.f("ix_email_verifications_purpose"), "email_verifications", ["purpose"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_email_verifications_purpose"), table_name="email_verifications")
    op.drop_index(op.f("ix_email_verifications_id"), table_name="email_verifications")
    op.drop_index(op.f("ix_email_verifications_expires_at"), table_name="email_verifications")
    op.drop_index(op.f("ix_email_verifications_email"), table_name="email_verifications")
    op.drop_table("email_verifications")
    op.execute("DROP TYPE IF EXISTS otppurpose")
