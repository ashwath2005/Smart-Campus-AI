from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    subject = Column(String(100), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"))
    due_date = Column(Date, nullable=False)
    department = Column(String(50), nullable=True)
    year = Column(String(20), nullable=True)
    class_name = Column(String(50), nullable=True)
    section = Column(String(10), nullable=True)
    attachments = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    submitted_at = Column(DateTime, default=func.now())
    status = Column(String(50), default="submitted")  # "submitted", "graded"
    grade = Column(String(20), nullable=True)
    remarks = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    github_link = Column(String(500), nullable=True)
    drive_link = Column(String(500), nullable=True)
