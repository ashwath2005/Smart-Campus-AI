from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Float, Date, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(300), nullable=True)
    industry = Column(String(100), nullable=True)
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())


class Placement(Base):
    __tablename__ = "placements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    placement_type = Column(
        Enum("internship", "fulltime", "parttime", name="placement_type_enum"),
        nullable=False,
    )
    package_lpa = Column(Float, nullable=True)
    eligibility_criteria = Column(Text, nullable=True)
    deadline = Column(Date, nullable=True)
    registration_url = Column(String(500), nullable=True)
    registration_type = Column(String(50), default="INTERNAL")  # INTERNAL | EXTERNAL
    registration_link_clicks = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())


class PlacementApplication(Base):
    __tablename__ = "placement_applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    placement_id = Column(Integer, ForeignKey("placements.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_url = Column(String(500), nullable=True)
    status = Column(
        Enum("applied", "shortlisted", "selected", "rejected", name="application_status_enum"),
        nullable=False,
        default="applied",
    )
    applied_at = Column(DateTime, default=func.now())
    resume_score = Column(Integer, nullable=True)
    resume_review_text = Column(Text, nullable=True)
    interview_status = Column(String(100), nullable=True)
    offer_status = Column(String(100), nullable=True)
