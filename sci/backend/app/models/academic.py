from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Float, Date, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    subject_name = Column(String(100), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_url = Column(String(500), nullable=True)
    material_type = Column(
        Enum("pdf", "video", "document", "slides", "notes", name="material_type_enum"),
        nullable=False,
        default="pdf",
    )
    department = Column(String(100), nullable=True)
    semester = Column(Integer, nullable=True)
    section = Column(String(50), nullable=True)
    unit = Column(String(50), nullable=True)
    tags = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=func.now())


class InternalMark(Base):
    __tablename__ = "internal_marks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_name = Column(String(100), nullable=False)
    exam_type = Column(
        Enum("cat1", "cat2", "cat3", "model", "assignment", name="exam_type_enum"),
        nullable=False,
    )
    marks_obtained = Column(Float, nullable=False)
    max_marks = Column(Float, nullable=False)
    semester = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.now())


class SemesterResult(Base):
    __tablename__ = "semester_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    subject_name = Column(String(100), nullable=False)
    grade = Column(String(5), nullable=False)
    grade_points = Column(Float, nullable=False)
    credits = Column(Integer, nullable=False)
    sgpa = Column(Float, nullable=True)
    cgpa = Column(Float, nullable=True)
    created_at = Column(DateTime, default=func.now())


class AcademicCalendarEvent(Base):
    __tablename__ = "academic_calendar_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(Date, nullable=False)
    event_type = Column(
        Enum("exam", "holiday", "deadline", "academic", "cultural", name="calendar_event_type_enum"),
        nullable=False,
    )
    semester = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=func.now())


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_number = Column(String(50), nullable=False, unique=True)
    building = Column(String(100), nullable=False)
    floor = Column(Integer, nullable=False)
    capacity = Column(Integer, nullable=False)
    is_lab = Column(Boolean, default=False)
    has_projector = Column(Boolean, default=True)
    is_accessible = Column(Boolean, default=True)
    
    # DCRA+ / CHI extended attributes
    has_smartboard = Column(Boolean, default=False)
    has_internet = Column(Boolean, default=True)
    has_ac = Column(Boolean, default=False)
    projector_health = Column(Float, default=100.0)      # 0 to 100
    smartboard_health = Column(Float, default=100.0)     # 0 to 100
    internet_health = Column(Float, default=100.0)       # 0 to 100
    ac_health = Column(Float, default=100.0)             # 0 to 100
    complaint_count = Column(Integer, default=0)
    maintenance_status = Column(String(50), default="active") # active, maintenance, inactive
    energy_efficiency_rating = Column(Float, default=5.0)     # 1 to 5 scale
    
    # Permanent Classroom Architecture additions
    room_type = Column(String(20), default="THEORY") # THEORY, LAB
    smart_classroom = Column(Boolean, default=False)
    department_block = Column(String(50), nullable=True)
    active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=func.now())


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    section_name = Column(String(10), nullable=False)
    student_strength = Column(Integer, default=60, nullable=False)
    permanent_room_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)

    # Relationships
    permanent_room = relationship("Classroom", foreign_keys=[permanent_room_id])
    department = relationship("Department")


class ClassroomAllocation(Base):
    __tablename__ = "classroom_allocations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    timetable_entry_id = Column(Integer, ForeignKey("timetable_entries.id", ondelete="CASCADE"), nullable=False)
    allocated_at = Column(DateTime, default=func.now())
    status = Column(String(50), default="active")  # active, cancelled, modified
    
    # DCRA+ / CHI tracking attributes
    suitability_score = Column(Float, default=100.0)
    explanation = Column(Text, nullable=True)                  # JSON structure of metrics
    predicted_occupancy = Column(Integer, default=0)
    occupancy_confidence = Column(Float, default=1.0)
    student_movement_distance = Column(Float, default=0.0)
    faculty_movement_distance = Column(Float, default=0.0)
    
    # Manual override fields
    is_manual_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    original_ai_room = Column(String(50), nullable=True)


class ReallocationLog(Base):
    __tablename__ = "reallocation_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=True)
    timetable_entry_id = Column(Integer, ForeignKey("timetable_entries.id", ondelete="CASCADE"), nullable=False)
    event_trigger = Column(String(100), nullable=False)       # e.g., Faculty Leave, Maintenance, Locked, Emergency
    previous_room = Column(String(50), nullable=True)
    new_room = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=func.now())


class FacultyWorkload(Base):
    __tablename__ = "faculty_workloads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    faculty_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_name = Column(String(100), nullable=False)
    hours_per_week = Column(Integer, nullable=False, default=4)
    created_at = Column(DateTime, default=func.now())


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)
    topic = Column(String(200), nullable=False)
    day_number = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0) # Tracked study time in seconds
    video_title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())


class StudentStudyPlan(Base):
    __tablename__ = "student_study_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)
    topics = Column(Text, nullable=False)
    days = Column(Integer, nullable=False)
    plan_json = Column(Text, nullable=False) # Stores the full study roadmap details
    created_at = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)


class Building(Base):
    __tablename__ = "buildings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    floors = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Active") # Active, Inactive
    created_at = Column(DateTime, default=func.now())


class AcademicYear(Base):
    __tablename__ = "academic_years"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False)
    status = Column(String(50), default="Active") # Active, Inactive
    created_at = Column(DateTime, default=func.now())


class Semester(Base):
    __tablename__ = "semesters"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(50), default="Active") # Active, Inactive
    created_at = Column(DateTime, default=func.now())
