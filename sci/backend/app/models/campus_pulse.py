from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class CampusActivity(Base):
    __tablename__ = "campus_activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    activity_type = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    location_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    building_name = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())


class CampusPulseSnapshot(Base):
    __tablename__ = "campus_pulse_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    activity_score = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="NORMAL")  # LOW, NORMAL, HIGH, VERY_HIGH
    student_score = Column(Float, default=0.0)
    faculty_score = Column(Float, default=0.0)
    room_score = Column(Float, default=0.0)
    event_score = Column(Float, default=0.0)
    lab_score = Column(Float, default=0.0)
    active_students = Column(Integer, default=0)
    active_faculty = Column(Integer, default=0)
    occupied_rooms = Column(Integer, default=0)
    active_events = Column(Integer, default=0)
    active_labs = Column(Integer, default=0)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
