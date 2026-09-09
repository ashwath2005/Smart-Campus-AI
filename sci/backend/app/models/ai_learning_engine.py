from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class StudentLearningProfile(Base):
    __tablename__ = "student_learning_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    learning_speed = Column(Float, default=1.0)  # Speed multiplier (e.g. 1.0)
    focus_consistency = Column(Float, default=80.0)  # Focus rating %
    sleep_quality = Column(Float, default=0.8)  # Sleep quality (0.0 to 1.0)
    daily_productivity = Column(Float, default=70.0)  # Efficiency %
    burnout_risk = Column(Float, default=0.0)  # Burnout score (0.0 to 100.0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class StudentSkillProfile(Base):
    __tablename__ = "student_skill_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    cgpa = Column(Float, default=0.0)
    skills_json = Column(Text, default="[]")  # JSON string of skills (e.g., ["Python", "SQL"])
    coding_points = Column(Integer, default=0)  # LeetCode/Hackerearth points
    projects_json = Column(Text, default="[]")  # JSON string of project objects
    certifications_json = Column(Text, default="[]")  # JSON string of certification names
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class StudentCareerRoadmap(Base):
    __tablename__ = "student_career_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    career_path = Column(String(100), nullable=False)  # Target path (e.g., Software Engineer)
    missing_skills_json = Column(Text, default="[]")  # JSON list of missing skills
    recommended_courses_json = Column(Text, default="[]")  # List of recommended course titles
    recommended_projects_json = Column(Text, default="[]")  # List of recommended projects
    interview_prep_plan_json = Column(Text, default="{}")  # Roadmap roadmap logs
    career_readiness_score = Column(Float, default=0.0)  # Target matching index (0.0 to 100.0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(100), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, docx, pptx, txt
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("uploaded_documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding_json = Column(Text)  # JSON-encoded array of floating points

    document = relationship("UploadedDocument", back_populates="chunks")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    difficulty = Column(String(20), default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)  # mcq, true_false, fill_blank, short, long, code, case_study, scenario, hot
    options_json = Column(Text)  # Option options lists (mcq/true_false)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text)
    topic = Column(String(100))
    difficulty = Column(String(20), default="medium")
    estimated_time_seconds = Column(Integer, default=60)

    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    max_score = Column(Float, default=10.0)
    completed_at = Column(DateTime, default=datetime.utcnow)
    answers_json = Column(Text)  # Question ID mapped to selection
    time_spent_seconds = Column(Integer, default=0)

    quiz = relationship("Quiz", back_populates="attempts")

class QuizAnalytics(Base):
    __tablename__ = "quiz_analytics"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)
    attempts_count = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    weakest_topic = Column(String(100))
    strongest_topic = Column(String(100))
    last_attempted_at = Column(DateTime, default=datetime.utcnow)

class BehaviourHistory(Base):
    __tablename__ = "behaviour_history"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_type = Column(String(100))  # study_session, quiz_attempt, homework
    timestamp = Column(DateTime, default=datetime.utcnow)
    value = Column(Float)  # completion percentage or mark
    metadata_json = Column(Text)

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50))  # study_habit, weak_topic, coding_profile
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
