from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey
from app.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    faculty_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum("present", "absent"), nullable=False)
    status_type = Column(String(50), nullable=True, default="present")  # present, absent, late, medical, excused
    edited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(String(255), nullable=True)
