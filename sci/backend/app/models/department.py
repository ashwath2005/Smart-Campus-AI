from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    hod_name = Column(String(100), nullable=True)
    
    # Template Import additions
    department_block = Column(String(100), nullable=True)
    total_semesters = Column(Integer, default=8)
    active = Column(Integer, default=1) # 1 = Active, 0 = Inactive
    
    created_at = Column(DateTime, default=func.now())


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    credits = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.now())


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    semester = Column(Integer, nullable=False)
    weekly_hours = Column(Integer, default=4, nullable=False)
    is_lab = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=func.now())
