"""Initial schema - documents existing tables

Revision ID: 001
Revises: None
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Existing tables created via Base.metadata.create_all:
# - users
# - timetables
# - timetable_entries
# - timetable_versions
# - import_history
# - faculty_leaves
# - announcements
# - attendance
# - assignments
# - submissions
# - events
# - event_registrations
# - departments
# - courses
# - subjects
# - study_materials
# - internal_marks
# - semester_results
# - academic_calendar_events
# - companies
# - placements
# - placement_applications
# - notifications
# - notification_reads
# - chat_history
# - user_preferences


def upgrade() -> None:
    # Existing tables already created via create_all.
    # This migration serves as the baseline reference point.
    pass


def downgrade() -> None:
    # Cannot downgrade the initial schema - tables are managed by create_all.
    pass
