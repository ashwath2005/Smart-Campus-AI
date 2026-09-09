from sqlalchemy import Column, Integer, String, DateTime, Enum, Time, Text, ForeignKey, Boolean, Date
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    department = Column(String(100))
    roll_number = Column(String(20))
    employee_id = Column(String(50), unique=True, nullable=True)
    staff_room = Column(String(100), nullable=True)
    custom_status = Column(String(50), nullable=True)
    semester = Column(Integer, default=1, nullable=True)
    section = Column(String(10), default="A", nullable=True)
    phone_number = Column(String(20), nullable=True)
    is_first_login = Column(Boolean, default=True, nullable=False)
    password_changed = Column(Boolean, default=False, nullable=False)
    advisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    guardian_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    max_workload = Column(Integer, default=18, nullable=False)
    preferred_availability = Column(Text, default='[]', nullable=False)
    created_at = Column(DateTime, default=func.now())


class FacultyLeave(Base):
    __tablename__ = "faculty_leaves"

    id = Column(Integer, primary_key=True, autoincrement=True)
    faculty_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    leave_type = Column(String(100), nullable=False)  # "Casual Leave", "Sick Leave", "Duty Leave", etc.
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default="Pending", nullable=False)  # "Pending", "Approved", "Rejected"
    reason = Column(Text, nullable=True)
    supporting_document = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())


class StudentLeave(Base):
    __tablename__ = "student_leaves"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    advisor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    leave_type = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    supporting_document = Column(String(500), nullable=True)

    status = Column(String(50), default="Pending Faculty Review", nullable=False)

    faculty_reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    faculty_comment = Column(Text, nullable=True)
    faculty_reviewed_at = Column(DateTime, nullable=True)

    hod_reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    hod_comment = Column(Text, nullable=True)
    hod_reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=func.now())


class StudentOD(Base):
    __tablename__ = "student_ods"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    advisor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_title = Column(String(200), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    supporting_document = Column(String(500), nullable=True)

    status = Column(String(50), default="Pending Faculty Review", nullable=False)

    faculty_reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    faculty_comment = Column(Text, nullable=True)
    faculty_reviewed_at = Column(DateTime, nullable=True)

    hod_reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    hod_comment = Column(Text, nullable=True)
    hod_reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=func.now())



class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, autoincrement=True)
    department = Column(String(100), nullable=False)
    year = Column(String(20), nullable=False)
    section = Column(String(10), default="A", nullable=False)
    created_at = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id", ondelete="CASCADE"))
    subject = Column(String(100), nullable=False)
    faculty = Column(String(100), nullable=True)
    room = Column(String(50))
    day = Column(String(20), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Relational fields for Permanent Classroom Architecture
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    semester = Column(Integer, nullable=True)
    section = Column(String(10), nullable=True)
    period = Column(Integer, nullable=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)


class TimetableVersion(Base):
    __tablename__ = "timetable_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id", ondelete="CASCADE"))
    version = Column(Integer, default=1, nullable=False)
    file_url = Column(String(255), nullable=True)
    parsed_data = Column(Text, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=func.now())


class ImportHistory(Base):
    __tablename__ = "import_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    total_records = Column(Integer, default=0, nullable=False)
    successful_imports = Column(Integer, default=0, nullable=False)
    failed_imports = Column(Integer, default=0, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    
    # Template Import Engine additions
    import_type = Column(String(100), nullable=True)
    failed_records_log = Column(Text, nullable=True)
    processing_time_ms = Column(Integer, default=0)
    status = Column(String(50), default="completed")
    
    created_at = Column(DateTime, default=func.now())


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    target_role = Column(String(50), default="all", nullable=False)  # "all", "student", "faculty"
    target_dept = Column(String(50), default="all", nullable=False)  # "all", "CSE", "ECE", "ME", "CE"
    is_emergency = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=func.now())


class SecurityIncident(Base):
    __tablename__ = "security_incidents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    severity = Column(String(20), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    location = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="OPEN", nullable=False)  # OPEN, INVESTIGATING, RESOLVED
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

