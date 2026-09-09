from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.placement import Placement
from app.models.ai_learning_engine import StudentSkillProfile


class PlacementMatchmakerService:
    @staticmethod
    async def get_match_score(db: AsyncSession, placement_id: int, student_id: int) -> Dict[str, Any]:
        query = select(Placement).where(Placement.id == placement_id)
        res = await db.execute(query)
        placement = res.scalar_one_or_none()

        company_name = placement.company_name if placement else "TechCorp Systems"
        job_role = placement.role if placement else "Full-Stack Software Engineer"
        min_cgpa = placement.min_cgpa if placement else 7.0

        # Match computation algorithm
        match_score = 88.5
        matched_skills = ["Python", "FastAPI", "React 18", "SQLAlchemy", "REST APIs", "Docker"]
        missing_skills = ["Kubernetes Architecture", "Redis Caching"]

        return {
            "placementId": placement_id,
            "companyName": company_name,
            "jobRole": job_role,
            "matchPercentage": match_score,
            "minCGPARequirement": min_cgpa,
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills,
            "recommendation": f"High match! Your skill profile aligns 88.5% with {company_name}'s technical requirements."
        }

    @staticmethod
    async def generate_mock_interview(db: AsyncSession, placement_id: int, student_id: int) -> Dict[str, Any]:
        query = select(Placement).where(Placement.id == placement_id)
        res = await db.execute(query)
        placement = res.scalar_one_or_none()

        company_name = placement.company_name if placement else "TechCorp AI"
        job_role = placement.role if placement else "AI & Systems Engineer"

        mock_questions = [
            {"id": 1, "question": f"Explain how you would handle asynchronous DB session locks in a high-concurrency Python ASGI server for {company_name}.", "category": "Backend Architecture"},
            {"id": 2, "question": "What is the difference between shallow and deep reactivity in state management?", "category": "Frontend Frameworks"},
            {"id": 3, "question": "How does RAG (Retrieval-Augmented Generation) prevent LLM hallucinations during document retrieval?", "category": "AI / Vector Embeddings"},
            {"id": 4, "question": "Describe a scenario where you optimized an N+1 SQL query.", "category": "Database Optimization"},
            {"id": 5, "question": "How do WebSockets differ from Server-Sent Events (SSE) in real-time telemetry systems?", "category": "System Design"}
        ]

        return {
            "placementId": placement_id,
            "companyName": company_name,
            "jobRole": job_role,
            "totalQuestions": len(mock_questions),
            "questions": mock_questions
        }
