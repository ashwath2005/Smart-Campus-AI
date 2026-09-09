import json
from datetime import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ai_learning_engine import StudentSkillProfile, StudentCareerRoadmap

# Career path requirements and baseline stats
CAREER_PROFILES = {
    "Software Engineer": {
        "skills": {
            "Java": 4, "Python": 4, "Data Structures": 5, 
            "System Design": 4, "Git": 3, "SQL": 3
        },
        "courses": ["Advanced Data Structures & Algorithms", "Object-Oriented Design Patterns"],
        "projects": ["Multi-tier e-commerce backend platform", "Task Planner with MVC Pattern"]
    },
    "AI Engineer": {
        "skills": {
            "Python": 5, "PyTorch": 5, "Linear Algebra": 4, 
            "NLP": 4, "Machine Learning": 5, "Scikit-Learn": 4
        },
        "courses": ["Deep Learning Specialization", "Mathematics for Machine Learning"],
        "projects": ["Local RAG Chatbot using Ollama", "Custom CNN for Image Classification"]
    },
    "Full Stack Developer": {
        "skills": {
            "JavaScript": 5, "HTML/CSS": 4, "React": 5, 
            "Node.js": 5, "Express": 4, "SQL": 4, "Git": 3
        },
        "courses": ["The Complete Web Development Bootcamp", "Full-Stack React & Node Applications"],
        "projects": ["Campus Social Network Portal", "Real-time Collaborative Whiteboard"]
    },
    "Frontend Developer": {
        "skills": {
            "HTML/CSS": 5, "JavaScript": 5, "TypeScript": 4, 
            "React": 5, "Redux": 3, "TailwindCSS": 4
        },
        "courses": ["Responsive Web Design Mastery", "Advanced React and Redux Patterns"],
        "projects": ["Admin Dashboard UI Widget Kit", "Static Portfolio Site Template Builder"]
    },
    "Backend Developer": {
        "skills": {
            "Python": 5, "FastAPI": 5, "PostgreSQL": 4, 
            "Redis": 3, "Docker": 4, "REST APIs": 5
        },
        "courses": ["Designing Data-Intensive Applications", "FastAPI & SQLAlchemy Masterclass"],
        "projects": ["Scalable API Gateway Gateway", "Distributed Scraping Task Queue"]
    },
    "Cloud Engineer": {
        "skills": {
            "AWS": 5, "Docker": 4, "Terraform": 5, 
            "Kubernetes": 4, "Linux": 3, "CI/CD": 4
        },
        "courses": ["AWS Certified Solutions Architect Course", "Docker & Kubernetes Guide"],
        "projects": ["High-Availability Load Balanced Cluster on AWS", "Server Configuration with Ansible"]
    },
    "Cyber Security Engineer": {
        "skills": {
            "Linux": 4, "Cryptography": 4, "Wireshark": 5, 
            "Metasploit": 3, "Network Security": 5, "OWASP Top 10": 4
        },
        "courses": ["CompTIA Security+", "Ethical Hacking Boot Camp"],
        "projects": ["Local Network Honeypot", "OWASP Top 10 Web Audit Report"]
    },
    "Data Scientist": {
        "skills": {
            "Python": 5, "Pandas": 5, "SQL": 4, 
            "Statistics": 5, "Data Visualization": 4, "Jupyter": 3
        },
        "courses": ["Applied Data Science with Python", "Probability and Statistics for Data Science"],
        "projects": ["Housing Market Exploratory Data Analysis", "Interactive Analytics Dashboard with Plotly/Dash"]
    },
    "DevOps Engineer": {
        "skills": {
            "CI/CD": 5, "GitHub Actions": 4, "Docker": 4, 
            "Linux": 3, "Prometheus": 3, "Nginx": 3
        },
        "courses": ["DevOps Boot Camp: CI/CD Pipelines", "Site Reliability Engineering Fundamentals"],
        "projects": ["Automated Deployments via GitHub Actions", "Centralized Logging Stack with ELK"]
    }
}

def calculate_dsea_metrics(
    cgpa: float,
    current_skills: List[str],
    projects: List[Dict[str, Any]],
    coding_points: int,
    certifications: List[str],
    career_path: str,
    aptitude_score: float = 75.0
) -> Dict[str, Any]:
    """
    Calculates SkillGapScore, CareerReadiness, and PlacementReadiness.
    """
    path_profile = CAREER_PROFILES.get(career_path)
    if not path_profile:
        # Default fallback to Software Engineer
        path_profile = CAREER_PROFILES["Software Engineer"]
        career_path = "Software Engineer"
        
    req_skills = path_profile["skills"]
    
    # 1. Compute Skill Gap Score (SGS)
    total_importance = sum(req_skills.values())
    matched_importance = 0
    matched_skills = []
    missing_skills = []
    
    # Normalize current skills for case insensitive matching
    normalized_current = [s.lower().strip() for s in current_skills]
    
    for skill, importance in req_skills.items():
        if skill.lower().strip() in normalized_current:
            matched_importance += importance
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)
            
    skill_gap_score = 100.0 * (1.0 - (matched_importance / total_importance)) if total_importance > 0 else 0.0
    
    # 2. Normalize components for Career Readiness Score (CRM)
    cgpa_norm = min(max(cgpa / 10.0, 0.0), 1.0)
    gap_factor = (100.0 - skill_gap_score) / 100.0
    
    # Projects Score (based on count and complexity)
    proj_score = 0.0
    if projects:
        for p in projects:
            comp = str(p.get("complexity", "medium")).lower()
            if comp == "hard":
                proj_score += 0.50
            elif comp == "medium":
                proj_score += 0.35
            else:
                proj_score += 0.20
        proj_score = min(proj_score, 1.0)
        
    # Coding Score (normalized relative to 1000 points)
    coding_score = min(coding_points / 1000.0, 1.0)
    
    # Certifications Score (normalized relative to 3 certifications)
    certs_score = min(len(certifications) * 0.33, 1.0)
    
    # CRM = 0.30*CGPA + 0.25*(1-SGS) + 0.20*Projects + 0.15*Coding + 0.10*Certs
    career_readiness = (
        0.30 * cgpa_norm +
        0.25 * gap_factor +
        0.20 * proj_score +
        0.15 * coding_score +
        0.10 * certs_score
    ) * 100.0
    
    career_readiness_capped = min(max(career_readiness, 0.0), 100.0)
    
    # 3. Compute Placement Readiness Score (PRS)
    placement_readiness = career_readiness_capped * (aptitude_score / 100.0)
    
    # 4. Filter recommended courses and projects based on missing skills
    recommended_courses = []
    recommended_projects = []
    
    # Simple heuristic: recommend if they overlap with missing skills or default recommendations
    if missing_skills:
        recommended_courses = path_profile["courses"]
        recommended_projects = path_profile["projects"]
        
    return {
        "career_path": career_path,
        "skill_gap_score": round(skill_gap_score, 2),
        "career_readiness_score": round(career_readiness_capped, 2),
        "placement_readiness_score": round(placement_readiness, 2),
        "missing_skills": missing_skills,
        "matched_skills": matched_skills,
        "recommended_courses": recommended_courses,
        "recommended_projects": recommended_projects,
        "interview_prep_plan": {
            "week_1": f"Strengthen core concepts in {', '.join(missing_skills[:2]) if missing_skills else 'Advanced Topics'}",
            "week_2": "Solve LeetCode Medium challenges & design interview questions",
            "week_3": f"Build a project demonstrating {matched_skills[0] if matched_skills else 'software architecture'}"
        }
    }

async def evolve_student_skills(
    db: AsyncSession,
    student_id: int,
    career_path: str,
    aptitude_score: float = 75.0
) -> Dict[str, Any]:
    """
    DSEA Core execution routine: fetches student profile, runs DSEA math,
    and updates/inserts career roadmap recommendation records.
    """
    # 1. Fetch Student Skill Profile
    q = select(StudentSkillProfile).where(StudentSkillProfile.student_id == student_id)
    res = await db.execute(q)
    profile = res.scalars().first()
    
    if not profile:
        # Create empty profile
        profile = StudentSkillProfile(
            student_id=student_id,
            cgpa=7.5,
            skills_json="[]",
            coding_points=100,
            projects_json="[]",
            certifications_json="[]"
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        
    try:
        current_skills = json.loads(profile.skills_json)
    except Exception:
        current_skills = []
        
    try:
        projects = json.loads(profile.projects_json)
    except Exception:
        projects = []
        
    try:
        certifications = json.loads(profile.certifications_json)
    except Exception:
        certifications = []
        
    # Calculate DSEA
    metrics = calculate_dsea_metrics(
        cgpa=profile.cgpa,
        current_skills=current_skills,
        projects=projects,
        coding_points=profile.coding_points,
        certifications=certifications,
        career_path=career_path,
        aptitude_score=aptitude_score
    )
    
    # 2. Update Career Roadmap
    road_q = select(StudentCareerRoadmap).where(
        StudentCareerRoadmap.student_id == student_id,
        StudentCareerRoadmap.career_path == career_path
    )
    road_res = await db.execute(road_q)
    roadmap = road_res.scalars().first()
    
    if not roadmap:
        roadmap = StudentCareerRoadmap(
            student_id=student_id,
            career_path=career_path
        )
        db.add(roadmap)
        
    roadmap.missing_skills_json = json.dumps(metrics["missing_skills"])
    roadmap.recommended_courses_json = json.dumps(metrics["recommended_courses"])
    roadmap.recommended_projects_json = json.dumps(metrics["recommended_projects"])
    roadmap.interview_prep_plan_json = json.dumps(metrics["interview_prep_plan"])
    roadmap.career_readiness_score = metrics["career_readiness_score"]
    roadmap.last_updated = datetime.utcnow()
    
    await db.commit()
    
    return metrics
