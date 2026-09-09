from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.learning_intelligence import StudentCognitiveProfile, StudentTopicKnowledge
from app.algorithms.learning_intelligence import (
    update_student_cognitive_profile,
    update_topic_mastery,
    fetch_knowledge_analytics,
    generate_ai_recommendations,
    get_faculty_analytics_summary
)

router = APIRouter(prefix="/learning-intelligence", tags=["AI Learning Intelligence"])

# --- Request Models ---

class IngestInteractionRequest(BaseModel):
    interaction_type: str = Field(..., description="e.g. 'reading', 'quiz', 'code', 'login'")
    item_id: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    score_change: Optional[float] = 0.0
    difficulty: Optional[str] = "medium"
    metadata_payload: Dict[str, Any] = Field(default_factory=dict)

# --- Routes ---

@router.post("/track")
async def track_interaction(
    req: IngestInteractionRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 1. Update cognitive pattern dimensions
        await update_student_cognitive_profile(
            db,
            student_id=current_user["id"],
            interaction_type=req.interaction_type,
            metadata=req.metadata_payload
        )
        
        # 2. Update topic mastery and revision dates if provided
        if req.subject and req.topic:
            await update_topic_mastery(
                db,
                student_id=current_user["id"],
                subject=req.subject,
                topic=req.topic,
                score_change=req.score_change or 5.0,
                difficulty=req.difficulty
            )
            
        await db.commit()
        return {"status": "success", "message": "Interaction successfully ingested and profiles updated."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest learning interaction: {str(e)}"
        )


@router.get("/profile")
async def get_student_profile_data(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        student_id = current_user["id"]
        
        # Load Cognitive Profile
        from sqlalchemy import select
        q = select(StudentCognitiveProfile).where(StudentCognitiveProfile.student_id == student_id)
        res = await db.execute(q)
        profile = res.scalars().first()
        
        # Create default profile if not exists
        if not profile:
            profile = StudentCognitiveProfile(
                student_id=student_id,
                reading_efficiency=0.65,
                quiz_accuracy=0.70,
                coding_performance=0.60,
                study_consistency=0.75,
                learning_velocity=0.80,
                focus_index=0.85,
                engagement_score=0.72,
                learning_style="Analytical Learner"
            )
            db.add(profile)
            await db.flush()
            
        # Get dynamic retention states (KDPA)
        knowledge_states = await fetch_knowledge_analytics(db, student_id)
        
        # Get AI recommendations (Decision Engine)
        recommendations = await generate_ai_recommendations(db, student_id)
        
        await db.commit()
        
        return {
            "cognitive_profile": {
                "reading_efficiency": profile.reading_efficiency,
                "quiz_accuracy": profile.quiz_accuracy,
                "coding_performance": profile.coding_performance,
                "study_consistency": profile.study_consistency,
                "learning_velocity": profile.learning_velocity,
                "focus_index": profile.focus_index,
                "engagement_score": profile.engagement_score,
                "learning_style": profile.learning_style
            },
            "knowledge_states": knowledge_states,
            "recommendations": recommendations
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student learning profile: {str(e)}"
        )


@router.get("/faculty-analytics")
async def get_faculty_analytics(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify current user is faculty or admin
    if current_user["role"] not in ["faculty", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to faculty and administrator roles."
        )
    try:
        analytics = await get_faculty_analytics_summary(db)
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile faculty analytics: {str(e)}"
        )


@router.post("/initialize-dummy")
async def initialize_dummy_data(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Populates rich, high-quality, realistic dummy topics and mastery metrics
    for the current user so they can interact with the charts instantly.
    """
    try:
        student_id = current_user["id"]
        
        # 1. Initialize/reset cognitive profile
        from sqlalchemy import select
        q_prof = select(StudentCognitiveProfile).where(StudentCognitiveProfile.student_id == student_id)
        res_prof = await db.execute(q_prof)
        profile = res_prof.scalars().first()
        if not profile:
            profile = StudentCognitiveProfile(student_id=student_id)
            db.add(profile)
            
        profile.reading_efficiency = 0.82
        profile.quiz_accuracy = 0.74
        profile.coding_performance = 0.88
        profile.study_consistency = 0.90
        profile.learning_velocity = 0.85
        profile.focus_index = 0.94
        profile.engagement_score = 0.89
        profile.learning_style = "Practical Learner"
        
        # 2. Insert dummy topic knowledge logs (representing a real DS and OS student)
        dummy_topics = [
            # Data Structures
            {"subject": "Data Structures", "topic": "Arrays", "mastery": 92.0, "difficulty": "easy", "days_ago": 15, "revision_count": 4},
            {"subject": "Data Structures", "topic": "Linked Lists", "mastery": 74.0, "difficulty": "medium", "days_ago": 10, "revision_count": 2},
            {"subject": "Data Structures", "topic": "Stacks", "mastery": 80.0, "difficulty": "medium", "days_ago": 4, "revision_count": 3},
            {"subject": "Data Structures", "topic": "Queues", "mastery": 82.0, "difficulty": "medium", "days_ago": 3, "revision_count": 3},
            {"subject": "Data Structures", "topic": "Trees", "mastery": 45.0, "difficulty": "hard", "days_ago": 12, "revision_count": 1},
            {"subject": "Data Structures", "topic": "Graphs", "mastery": 38.0, "difficulty": "hard", "days_ago": 2, "revision_count": 0},
            # Operating Systems
            {"subject": "Operating Systems", "topic": "Processes", "mastery": 88.0, "difficulty": "easy", "days_ago": 18, "revision_count": 5},
            {"subject": "Operating Systems", "topic": "Semaphores", "mastery": 70.0, "difficulty": "hard", "days_ago": 8, "revision_count": 2},
            {"subject": "Operating Systems", "topic": "Deadlocks", "mastery": 55.0, "difficulty": "medium", "days_ago": 14, "revision_count": 1},
            {"subject": "Operating Systems", "topic": "Memory Management", "mastery": 75.0, "difficulty": "hard", "days_ago": 6, "revision_count": 2},
            {"subject": "Operating Systems", "topic": "Virtual Memory", "mastery": 48.0, "difficulty": "hard", "days_ago": 1, "revision_count": 0},
        ]
        
        # Clear existing topic knowledge for this user
        from sqlalchemy import delete
        await db.execute(delete(StudentTopicKnowledge).where(StudentTopicKnowledge.student_id == student_id))
        
        for dt in dummy_topics:
            tk = StudentTopicKnowledge(
                student_id=student_id,
                subject=dt["subject"],
                topic=dt["topic"],
                mastery=dt["mastery"],
                difficulty=dt["difficulty"],
                revision_count=dt["revision_count"],
                last_revisited_at=datetime.now() - timedelta(days=dt["days_ago"]),
                created_at=datetime.now() - timedelta(days=30)
            )
            db.add(tk)
            
        await db.commit()
        return {"status": "success", "message": "Dummy learning profile and topic mastery statistics successfully initialized."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed dummy learning data: {str(e)}"
        )


# --- DSEA Skill Gap Analyzer Endpoints ---
from app.algorithms.dsea_service import evolve_student_skills
from app.models.ai_learning_engine import StudentSkillProfile, StudentCareerRoadmap
import json

class UpdateSkillsRequest(BaseModel):
    skills: List[str]
    coding_points: int
    projects: List[Dict[str, Any]]
    certifications: List[str]
    career_path: str
    cgpa: Optional[float] = 7.5

@router.get("/career-roadmap")
async def get_career_roadmap(
    career_path: str = "Full Stack Developer",
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        student_id = current_user["id"]
        metrics = await evolve_student_skills(db, student_id, career_path)
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate career skill gap roadmap: {str(e)}"
        )

@router.post("/update-skills")
async def update_skills(
    req: UpdateSkillsRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        student_id = current_user["id"]
        
        # Fetch or create skill profile
        prof_q = select(StudentSkillProfile).where(StudentSkillProfile.student_id == student_id)
        prof_res = await db.execute(prof_q)
        profile = prof_res.scalars().first()
        
        if not profile:
            profile = StudentSkillProfile(student_id=student_id)
            db.add(profile)
            
        if req.cgpa:
            profile.cgpa = req.cgpa
        profile.skills_json = json.dumps(req.skills)
        profile.coding_points = req.coding_points
        profile.projects_json = json.dumps(req.projects)
        profile.certifications_json = json.dumps(req.certifications)
        profile.last_updated = datetime.now()
        
        await db.commit()
        
        # Trigger evolution calculations
        metrics = await evolve_student_skills(db, student_id, req.career_path)
        return metrics
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evolve student skills: {str(e)}"
        )

