from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base

class StudentLearningInteraction(Base):
    __tablename__ = "student_learning_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    interaction_type = Column(String(50), nullable=False) # e.g. 'quiz', 'code', 'reading', 'assignment', 'login'
    item_id = Column(String(100), nullable=True)
    metadata_json = Column(Text, nullable=False) # JSON payload storing scroll depth, responses, debug steps, etc.
    created_at = Column(DateTime, default=func.now())


class StudentCognitiveProfile(Base):
    __tablename__ = "student_cognitive_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    reading_efficiency = Column(Float, default=0.5) # range 0.0 to 1.0
    quiz_accuracy = Column(Float, default=0.5)
    coding_performance = Column(Float, default=0.5)
    study_consistency = Column(Float, default=0.5)
    learning_velocity = Column(Float, default=0.5)
    focus_index = Column(Float, default=0.5)
    engagement_score = Column(Float, default=0.5)
    learning_style = Column(String(50), default="Exploration Learner") # e.g. Reading Learner, Practical Learner, etc.
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class StudentTopicKnowledge(Base):
    __tablename__ = "student_topic_knowledge"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)
    topic = Column(String(200), nullable=False)
    mastery = Column(Float, default=50.0) # range 0.0 to 100.0
    retention = Column(Float, default=50.0) # range 0.0 to 100.0
    confidence = Column(Float, default=50.0)
    decay_risk = Column(Float, default=0.0)
    revision_priority = Column(Float, default=5.0) # computed priority scale 1.0 to 10.0
    difficulty = Column(String(20), default="medium") # easy, medium, hard
    revision_count = Column(Integer, default=0)
    last_revisited_at = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
