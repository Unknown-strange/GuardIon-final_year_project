"""Add product feature tables and user profile photo

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-19 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_photo", sa.String(length=500), nullable=True))

    op.add_column("guardians", sa.Column("status", sa.String(length=20), server_default="active", nullable=False))
    op.add_column("guardians", sa.Column("invited_email", sa.String(length=255), nullable=True))
    op.alter_column("guardians", "user_id", existing_type=postgresql.UUID(), nullable=True)

    op.create_table(
        "emergency_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("children.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("relationship", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_emergency_contacts_user_id", "emergency_contacts", ["user_id"])
    op.create_index("ix_emergency_contacts_child_id", "emergency_contacts", ["child_id"])

    op.create_table(
        "notification_preferences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("sos_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("geofence_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("battery_enabled", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("weekly_summary_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "push_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token", sa.String(length=512), nullable=False),
        sa.Column("platform", sa.String(length=50), nullable=True),
        sa.Column("device_name", sa.String(length=255), nullable=True),
        sa.Column("last_active", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_push_tokens_user_id", "push_tokens", ["user_id"])
    op.create_index("ix_push_tokens_token", "push_tokens", ["token"], unique=True)

    op.create_table(
        "user_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("device_name", sa.String(length=255), nullable=False),
        sa.Column("platform", sa.String(length=50), nullable=True),
        sa.Column("user_agent", sa.String(length=500), nullable=True),
        sa.Column("last_active", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_user_sessions_user_id", "user_sessions", ["user_id"])

    op.create_table(
        "check_ins",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("children.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("requested_at", sa.DateTime(), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_check_ins_child_id", "check_ins", ["child_id"])


def downgrade() -> None:
    op.drop_index("ix_check_ins_child_id", table_name="check_ins")
    op.drop_table("check_ins")
    op.drop_index("ix_user_sessions_user_id", table_name="user_sessions")
    op.drop_table("user_sessions")
    op.drop_index("ix_push_tokens_token", table_name="push_tokens")
    op.drop_index("ix_push_tokens_user_id", table_name="push_tokens")
    op.drop_table("push_tokens")
    op.drop_table("notification_preferences")
    op.drop_index("ix_emergency_contacts_child_id", table_name="emergency_contacts")
    op.drop_index("ix_emergency_contacts_user_id", table_name="emergency_contacts")
    op.drop_table("emergency_contacts")
    op.alter_column("guardians", "user_id", existing_type=postgresql.UUID(), nullable=False)
    op.drop_column("guardians", "invited_email")
    op.drop_column("guardians", "status")
    op.drop_column("users", "profile_photo")
