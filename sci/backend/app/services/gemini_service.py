import warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")
import google.generativeai as genai
import asyncio
from app.config import GEMINI_API_KEY
import json
from pydantic import BaseModel, Field
from typing import List, Optional

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

# ─── Pydantic Response Models for Structured Output ──────────────────────────

class PDFSummaryResponse(BaseModel):
    summary: str = Field(description="A comprehensive summary paragraph of the content")
    key_concepts: List[str] = Field(description="List of 5 core concepts or terms extracted from the text")
    questions: List[str] = Field(description="List of 5 important exam/practice questions from the text")

class QuizQuestionResponse(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(description="Exactly 4 multiple choice options, e.g., ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4']")
    answer: str = Field(description="The correct answer letter, e.g., 'A', 'B', 'C', or 'D'")

class QuizResponse(BaseModel):
    questions: List[QuizQuestionResponse] = Field(description="List of exactly 5 multiple choice questions")

class StudyPlanDayResponse(BaseModel):
    day: int = Field(description="Day number, starting from 1")
    title: str = Field(description="Focus topic or title of the day's study")
    tasks: List[str] = Field(description="List of tasks to complete on this day")
    duration: str = Field(description="Estimated study duration, e.g., '2 hours'")
    youtube_search_query: str = Field(description="YouTube search query, e.g. 'React state management tutorial', to find relevant learning videos for this day's topic")

class StudyPlanResponse(BaseModel):
    subject: str = Field(description="The academic subject name")
    topic: str = Field(description="The core topics covered")
    days: int = Field(description="Number of days in the plan")
    plan: List[StudyPlanDayResponse] = Field(description="Daily schedule entries")

class ResumeReviewResponse(BaseModel):
    score: int = Field(description="Overall resume score from 0 to 100")
    summary: str = Field(description="Detailed critique of the resume")
    strengths: List[str] = Field(description="List of strengths found in the resume")
    weaknesses: List[str] = Field(description="List of areas needing improvement")
    recommendations: List[str] = Field(description="Actionable steps to improve the resume")

class SkillGapResponse(BaseModel):
    targetRole: str = Field(description="Target career role")
    matchPercentage: int = Field(description="Skill match percentage from 0 to 100")
    missingSkills: List[str] = Field(description="List of skills the candidate lacks for the role")
    resources: List[str] = Field(description="Recommended learning resources to bridge the gap")
    nextSteps: List[str] = Field(description="Actionable next steps to take")

class DynamicRoleSkillsResponse(BaseModel):
    role: str = Field(description="Normalized target role name")
    required_skills: List[str] = Field(description="List of 8-12 core technical skills required for this role")

class InterviewQuestionResponse(BaseModel):
    question: str = Field(description="The technical or behavioral interview question")
    options: List[str] = Field(description="4 multiple choice options")
    correctAnswer: int = Field(description="Index of the correct option (0-3)")
    explanation: str = Field(description="Explanation of why this answer is correct")

class InterviewPrepResponse(BaseModel):
    questions: List[InterviewQuestionResponse] = Field(description="Exactly 5 generated interview questions")

class CareerPathResponse(BaseModel):
    careerPath: str = Field(description="Name of the career path, e.g., 'Full Stack Engineer'")
    reason: str = Field(description="Detailed reason why this matches the student profile")
    difficulty: str = Field(description="Difficulty level: Easy, Medium, or Hard")
    roadmap: List[str] = Field(description="Step-by-step roadmap to achieve this goal")

class CareerAdviceResponse(BaseModel):
    recommendations: List[CareerPathResponse] = Field(description="List of 3 suitable career paths")

class TimetableEntryResponse(BaseModel):
    day: str = Field(description="Full name of the day: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday")
    subject: str = Field(description="Subject name")
    faculty: Optional[str] = Field(None, description="Name of the faculty teaching this class")
    start_time: str = Field(description="Start time in 24-hour format HH:MM")
    end_time: str = Field(description="End time in 24-hour format HH:MM")
    room: Optional[str] = Field(None, description="Classroom name/number")

class TimetableParseResponse(BaseModel):
    department: str = Field(description="Department abbreviation, e.g. CSE, ECE, ME (uppercase)")
    year: str = Field(description="Year in Roman numerals: I, II, III, IV")
    section: str = Field(description="Section letter, e.g. A, B, C")
    entries: List[TimetableEntryResponse] = Field(description="List of classes parsed from the timetable")

# ─── Content Generation Helper Functions ─────────────────────────────────────

from app.services.api_key_manager import execute_ai_call_with_retry

async def generate_content_async(prompt: str) -> str:
    return await execute_ai_call_with_retry(prompt=prompt)

async def generate_structured_content_async(prompt: str, schema: type) -> str:
    return await execute_ai_call_with_retry(prompt=prompt, schema=schema)

async def generate_multimodal_structured_content_async(prompt: str, mime_type: str, file_bytes: bytes, schema: type) -> str:
    return await execute_ai_call_with_retry(prompt=prompt, mime_type=mime_type, file_bytes=file_bytes, schema=schema)

# ─── Chat Assistant Function ──────────────────────────────────────────────────

async def ask_campus_ai(question: str, student_context: dict, chat_history: List[dict] = None) -> str:
    role = student_context.get('role', 'student')
    fac_summary = student_context.get('faculty_locator_summary', 'N/A')
    
    if role == 'student':
        system_instruction = f"""You are Smart Campus AI, a highly capable, friendly, and supportive student assistant and academic study buddy.
Student Name: {student_context.get('name', 'Student')}
Department: {student_context.get('department', 'N/A')}
Semester: {student_context.get('semester', 'N/A')}
Attendance by Subject: {student_context.get('attendance', 'N/A')}
Pending Assignments: {student_context.get('pending_assignments', 'N/A')}
Today's Classes: {student_context.get('todays_classes', 'N/A')}
Weekly Timetable Schedule: {student_context.get('weekly_timetable', 'N/A')}
Academic Marks: {student_context.get('internal_marks', 'N/A')}
Semester Results (Grades): {student_context.get('semester_grades', 'N/A')}
CGPA: {student_context.get('cgpa', 'N/A')}
Active Placement Opportunities / Application Statuses: {student_context.get('placement_applications', 'N/A')}
Upcoming Academic Calendar Events: {student_context.get('calendar_events', 'N/A')}
Campus Announcements: {student_context.get('announcements', 'N/A')}
Faculty Locator (Statuses, rooms, and leaves):
{fac_summary}

Instructions:
1. **Academic and General Knowledge:** You are an advanced academic study buddy. Directly answer and explain technical, engineering, and general study-related questions (e.g. computer science topics, algorithms, math) using your internal knowledge.
2. **Prioritize Academic Meanings for Acronyms:** If a student asks about an abbreviation or concept like "BTS", "OS", "DBMS", "API", check for technical or academic definitions (e.g. "Base Transceiver Station" in wireless networks or "Bug Tracking System" in software engineering for CSE students). Explain the technical/academic concepts first. Do not reject them as pop-culture or off-topic.
3. **Personalization & Contextual Grounding:** Ground campus-specific answers (e.g. attendance, grades, GPA, schedules, placements, events) in the student's context provided above. Quote attendance percentages, room numbers, assignment deadlines, and leaves exactly as shown in the context.
4. **Struggling & Low Attendance Guidance:** Proactively identify if the student's attendance is below 75% for any subject. If it is, issue a friendly warning and suggest specific caught-up tips (like reading uploaded study materials, completing assignments, or contacting the professor).
5. **Constructive Performance Feedback:** If internal marks are low in a subject, offer constructive, encouraging study advice.
6. **Tone:** Keep your tone friendly, proactive, encouraging, and clear. Format your output nicely using markdown.
"""
    elif role == 'faculty':
        system_instruction = f"""You are Smart Campus AI, a professional and highly resourceful assistant for college faculty members.
Faculty Name: {student_context.get('name', 'Professor')}
Department: {student_context.get('department', 'N/A')}
Today's Teaching Schedule: {student_context.get('todays_classes', 'N/A')}
Weekly Teaching Timetable: {student_context.get('weekly_timetable', 'N/A')}
Assignments You Created: {student_context.get('created_assignments', 'N/A')}
Campus Announcements: {student_context.get('announcements', 'N/A')}
Faculty Locator (Statuses, rooms, and leaves for yourself and colleagues):
{fac_summary}

Instructions:
1. Support the professor with teaching schedule details, class timings, classroom numbers, and assignment deadlines. Quote them exactly from the context.
2. Answer academic, technical, or teaching pedagogy questions thoroughly using your internal knowledge.
3. Help coordinate with other colleagues. If they ask about a colleague's location or status, check the Faculty Locator details precisely.
4. Maintain a highly professional, polite, and helpful academic tone.
"""
    else: # admin
        system_instruction = f"""You are Smart Campus AI, an efficient, analytical, and professional assistant for college administrators.
Administrator Name: {student_context.get('name', 'Admin')}
System Statistics: {student_context.get('system_stats', 'N/A')}
Campus Announcements: {student_context.get('announcements', 'N/A')}
Faculty Locator (Statuses, rooms, leaves of all faculty):
{fac_summary}

Instructions:
1. Provide quick, accurate summaries of system metrics (number of students, faculty, departments, active events) and campus operations.
2. Assist with administrative workflows, schedule checks, and colleague tracking.
3. Maintain a precise, professional, and business-oriented tone.
"""

    return await execute_ai_call_with_retry(
        system_instruction=system_instruction,
        is_chat=True,
        chat_history=chat_history,
        chat_question=question
    )

# ─── Structured Utility Functions ──────────────────────────────────────────

async def summarize_pdf_text(text: str) -> dict:
    from app.services.ai_cache import cached_ai_call

    truncated = text[:10000]

    async def _call():
        prompt = f"""Analyze the following text from a PDF document and extract the executive summary, key concepts, and important practice questions.
    
    Text to analyze:
    {truncated}"""
        try:
            response_text = await generate_structured_content_async(prompt, PDFSummaryResponse)
            return json.loads(response_text)
        except Exception:
            return {
                "summary": "Could not generate summary format correctly.",
                "key_concepts": ["Failed to extract key concepts."],
                "questions": ["Failed to extract questions."],
            }

    return await cached_ai_call("summarize_pdf_text", {"text": truncated}, _call)


async def generate_quiz(text: str) -> list:
    from app.services.ai_cache import cached_ai_call

    truncated = text[:10000]

    async def _call():
        prompt = f"""Based on the following text, generate exactly 5 multiple choice questions.
    
    Text:
    {truncated}"""
        try:
            response_text = await generate_structured_content_async(prompt, QuizResponse)
            return json.loads(response_text).get("questions", [])
        except Exception:
            return []

    return await cached_ai_call("generate_quiz", {"text": truncated}, _call)


def generate_local_study_plan(subject: str, topics: str, days: int) -> dict:
    topic_list = [t.strip() for t in topics.split(",") if t.strip()]
    if not topic_list:
        topic_list = [topics]
        
    plan_days = []
    for d in range(1, days + 1):
        t_idx = (d - 1) % len(topic_list)
        topic_item = topic_list[t_idx]
        
        plan_days.append({
            "day": d,
            "title": f"Concepts of {topic_item} (Part {((d-1) // len(topic_list)) + 1})",
            "tasks": [
                f"Review fundamental theories and core structures of {topic_item}",
                f"Complete hands-on practice worksheets for {topic_item}",
                f"Review common exam problems and answers for {topic_item}"
            ],
            "duration": "2 hours",
            "youtube_search_query": f"{subject} {topic_item}"
        })
        
    return {
        "subject": subject,
        "topic": topics,
        "days": days,
        "plan": plan_days
    }


async def generate_study_plan(subject: str, topics: str, days: int, alra_metrics: Optional[dict] = None) -> dict:
    from app.services.ai_cache import cached_ai_call

    async def _call():
        alra_prompt = ""
        if alra_metrics:
            alra_prompt = f"""
            CRITICAL ALRA DYNAMIC LOAD CONSTRAINTS:
            - Calculated daily study load target: {alra_metrics.get('study_load', 2.0):.1f} hours.
            - Student's current subject attendance: {alra_metrics.get('attendance', 0.8)*100:.1f}%.
            - Student's current quiz performance accuracy: {alra_metrics.get('quiz_score', 0.7)*100:.1f}%.
            - Days remaining until exam: {alra_metrics.get('remaining_days', 30)} days.
            
            Adjust the complexity and number of daily tasks to align with a study duration of exactly {alra_metrics.get('study_load', 2.0):.1f} hours per day (set the duration field to '{alra_metrics.get('study_load', 2.0):.1f} hours').
            If attendance or quiz accuracy is low (e.g. below 75%), ensure the tasks include basic foundational review, and friendly supportive study checks.
            """

        prompt = f"""Generate a personalized study plan for the subject '{subject}' covering these topics: '{topics}' over a period of {days} days. For each day, include a highly targeted 'youtube_search_query' that can be used to search YouTube for learning videos on that day's focus topic.
        {alra_prompt}"""
        try:
            response_text = await asyncio.wait_for(
                generate_structured_content_async(prompt, StudyPlanResponse),
                timeout=3.0
            )
            parsed = json.loads(response_text)
            if not parsed.get("plan"):
                raise ValueError("Gemini returned empty plan list")
            return parsed
        except Exception:
            return generate_local_study_plan(subject, topics, days)

    cache_key_data = {"subject": subject, "topics": topics, "days": days}
    if alra_metrics:
        cache_key_data["alra_study_load"] = alra_metrics.get("study_load")
        cache_key_data["alra_attendance"] = alra_metrics.get("attendance")

    return await cached_ai_call(
        "generate_study_plan",
        cache_key_data,
        _call,
    )


async def review_resume(resume_text: str) -> dict:
    from app.services.ai_cache import cached_ai_call

    truncated = resume_text[:10000]

    async def _call():
        prompt = f"""Analyze the following resume text and provide a professional review with score, summary, strengths, weaknesses, and actionable recommendations.
    
    Resume Text:
    {truncated}"""
        try:
            response_text = await generate_structured_content_async(prompt, ResumeReviewResponse)
            return json.loads(response_text)
        except Exception:
            return {
                "score": 50,
                "summary": "Could not analyze resume text format.",
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
            }

    return await cached_ai_call("review_resume", {"resume_text": truncated}, _call)


ROLE_SKILLS_ONTOLOGY = {
    "fullstackdeveloper": [
        "React", "Node.js", "Express", "JavaScript", "HTML", "CSS", "Git", "Databases", "SQL", "NoSQL", "TypeScript", "REST APIs"
    ],
    "frontenddeveloper": [
        "React", "HTML", "CSS", "JavaScript", "TypeScript", "Tailwind CSS", "Redux", "Git", "Webpack", "UI/UX"
    ],
    "backenddeveloper": [
        "Python", "Node.js", "Express", "Databases", "SQL", "NoSQL", "REST APIs", "Docker", "Git", "System Design", "AWS", "API Design"
    ],
    "datascientist": [
        "Python", "SQL", "Machine Learning", "Pandas", "NumPy", "Scikit-Learn", "Statistics", "Data Visualization", "Deep Learning", "R"
    ],
    "softwareengineer": [
        "Data Structures", "Algorithms", "Java", "C++", "Python", "Git", "System Design", "Software Architecture", "OOP"
    ],
    "mobileappdeveloper": [
        "React Native", "Flutter", "Swift", "Kotlin", "Java", "Git", "Mobile UI", "REST APIs", "App Store Deployment"
    ],
    "devopsengineer": [
        "Docker", "Kubernetes", "CI/CD", "AWS", "Linux", "Terraform", "Git", "Shell Scripting", "Monitoring Tools"
    ],
    "cybersecurityanalyst": [
        "Network Security", "Cryptography", "Penetration Testing", "Linux", "Firewalls", "Incident Response", "OWASP"
    ],
    "cloudarchitect": [
        "AWS", "Microsoft Azure", "Google Cloud Platform", "Infrastructure as Code", "Docker", "Kubernetes", "Linux", "Python Scripting", "CI/CD Pipelines", "Networking"
    ],
}

CONCEPTUAL_SYNONYM_MAP = {
    "infrastructure as code": ["terraform", "ansible", "pulumi", "cloudformation", "iac", "terraform scripting"],
    "python scripting": ["python", "python3", "py", "scripting"],
    "ci/cd pipelines": ["cicd", "ci/cd", "jenkins", "github actions", "gitlab", "circleci", "devops"],
    "container orchestration": ["kubernetes", "k8s", "docker swarm", "k3s"],
    "containerization": ["docker", "podman", "containers"],
    "database management": ["sql", "mysql", "postgresql", "mongodb", "databases", "database", "oracle", "nosql", "redis"],
    "database design": ["sql", "mysql", "postgresql", "mongodb", "databases", "database", "oracle", "nosql", "redis"],
    "microservices architecture": ["microservices", "docker", "kubernetes", "rest apis", "api design", "grpc"],
    "networking": ["dns", "vpc", "subnets", "tcp/ip", "networking", "routing", "firewalls"],
    "cloud networking": ["dns", "vpc", "subnets", "tcp/ip", "networking", "routing", "firewalls"],
    "version control": ["git", "github", "gitlab", "bitbucket", "svn"],
}
FUZZY_ROLE_MATCH_THRESHOLD = 0.5

def string_similarity(s1: str, s2: str) -> float:
    """
    Computes a simple Jaccard similarity between character bigrams of two strings.
    This handles typos in inputs gracefully without external libraries.
    """
    if not s1 or not s2:
        return 0.0
    s1_grams = set(s1[i:i+2] for i in range(len(s1)-1))
    s2_grams = set(s2[i:i+2] for i in range(len(s2)-1))
    if not s1_grams or not s2_grams:
        return 0.0
    intersection = s1_grams.intersection(s2_grams)
    union = s1_grams.union(s2_grams)
    return len(intersection) / len(union)

def normalize_skill_name(skill: str) -> str:
    """
    Cleans and maps skill name variations to a standard representation.
    """
    s = skill.strip().lower()
    mappings = {
        "reactjs": "react",
        "react.js": "react",
        "nodejs": "node.js",
        "node js": "node.js",
        "expressjs": "express",
        "express js": "express",
        "js": "javascript",
        "ts": "typescript",
        "tailwind": "tailwind css",
        "db": "databases",
        "database": "databases",
        "sql server": "sql",
        "postgresql": "sql",
        "mysql": "sql",
        "mongodb": "nosql",
        "rest api": "rest APIs",
        "restful api": "rest APIs",
        "restful apis": "rest APIs",
        "aws cloud": "aws",
        "amazon web services": "aws",
        "ml": "machine learning",
        "deeplearning": "deep learning",
        "dsa": "data structures",
        "data structure": "data structures",
        "algorithm": "algorithms",
        "software engineering": "software architecture"
    }
    return mappings.get(s, s)

def check_skill_match(candidate: str, required: str) -> bool:
    """
    Checks if a candidate skill matches a required skill using fuzzy containment,
    synonyms, and word-level overlapping.
    """
    c_norm = normalize_skill_name(candidate).strip().lower()
    r_norm = normalize_skill_name(required).strip().lower()
    
    # 1. Exact match after normalization
    if c_norm == r_norm:
        return True
        
    # 2. Substring matching (e.g. "ui" matches "ui/ux", "react" matches "react Native", "css" matches "css3")
    if c_norm in r_norm or r_norm in c_norm:
        return True
        
    # 3. Check conceptual synonym mappings (e.g. "terraform" matches "Infrastructure as Code")
    for req_concept, synonyms in CONCEPTUAL_SYNONYM_MAP.items():
        if req_concept == r_norm or req_concept in r_norm:
            for syn in synonyms:
                if syn == c_norm or syn in c_norm or c_norm in syn:
                    return True
            
    # 4. Word token overlap matching (e.g. "rest api" matches "restful apis")
    c_words = set(c_norm.split())
    r_words = set(r_norm.split())
    
    # Remove insignificant stopwords
    stopwords = {"and", "or", "of", "to", "in", "for", "with", "the", "principles", "basics", "design", "development"}
    c_words_filtered = c_words - stopwords
    r_words_filtered = r_words - stopwords
    
    if c_words_filtered and r_words_filtered:
        if c_words_filtered.intersection(r_words_filtered):
            return True
            
    return False

async def fetch_required_skills_for_role(role: str) -> List[str]:
    """
    Queries the LLM dynamically to get standard required skills for a role not in the local ontology.
    """
    prompt = f"""Identify the top 8 to 12 core technical and professional skills required for the role of '{role}'.
    Provide them as a clean list of individual technologies or skills (e.g. 'React', 'Docker', 'Machine Learning').
    Return a structured JSON output matching the DynamicRoleSkillsResponse schema."""
    try:
        response_text = await generate_structured_content_async(prompt, DynamicRoleSkillsResponse)
        parsed = json.loads(response_text)
        return parsed.get("required_skills", [])
    except Exception as e:
        print(f"Error fetching dynamic skills from LLM: {e}")
        return ["Communication", "Problem Solving", "Technical Aptitude"]

async def analyze_skill_gap(skills: str, target_role: str) -> dict:
    from app.services.ai_cache import cached_ai_call

    # Normalize role name for ontology matching (e.g. "front end developer" -> "frontenddeveloper")
    role_key = target_role.strip().lower().replace(" ", "").replace("-", "").replace("_", "")

    async def _call():
        # Try direct key match first
        required_skills = ROLE_SKILLS_ONTOLOGY.get(role_key)
        
        # If no exact match, check fuzzy similarity against ontology keys
        if not required_skills:
            best_match_key = None
            best_sim = 0.0
            for key in ROLE_SKILLS_ONTOLOGY.keys():
                sim = string_similarity(role_key, key)
                if sim > FUZZY_ROLE_MATCH_THRESHOLD and sim > best_sim:
                    best_sim = sim
                    best_match_key = key
            if best_match_key:
                required_skills = ROLE_SKILLS_ONTOLOGY[best_match_key]
                print(f"Fuzzy matched target role '{target_role}' to ontology key '{best_match_key}' (similarity: {best_sim:.2f})")

        # Fallback to dynamic LLM checklist creation if still not resolved
        if not required_skills:
            required_skills = await fetch_required_skills_for_role(target_role)

        candidate_skills_raw = [s.strip() for s in skills.split(",") if s.strip()]

        matched_skills = []
        missing_skills = []

        for req in required_skills:
            has_match = False
            for cand in candidate_skills_raw:
                if check_skill_match(cand, req):
                    has_match = True
                    break
            if has_match:
                matched_skills.append(req)
            else:
                missing_skills.append(req)

        total_req = len(required_skills)
        if total_req > 0:
            match_percentage = int(round((len(matched_skills) / total_req) * 100))
        else:
            match_percentage = 0

        match_percentage = min(match_percentage, 100)

        if missing_skills:
            enrichment_prompt = f"""The student wants to become a '{target_role}'.
            They already have these matching skills: {', '.join(matched_skills) if matched_skills else 'None'}.
            We have mathematically determined that they are missing the following specific skills: {', '.join(missing_skills)}.
            
            Provide:
            1. Recommended specific learning resources (links, online courses, books) to learn these missing skills.
            2. 3 actionable next steps to take.
            
            Return a structured JSON matching the SkillGapResponse schema (matchPercentage must be {match_percentage} and missingSkills must be the exact array {json.dumps(missing_skills)})."""
        else:
            enrichment_prompt = f"""The student has 100% of the required skills for the role '{target_role}'!
            Matched Skills: {', '.join(matched_skills)}.
            
            Provide:
            1. Advanced topics, projects, or certifications they should pursue to stand out.
            2. 3 actionable career next steps.
            
            Return a structured JSON matching the SkillGapResponse schema (matchPercentage must be 100 and missingSkills must be an empty array [])."""

        try:
            response_text = await asyncio.wait_for(
                generate_structured_content_async(enrichment_prompt, SkillGapResponse),
                timeout=3.0
            )
            result = json.loads(response_text)
            
            # FORCE override the LLM values to guarantee mathematical accuracy
            result["matchPercentage"] = match_percentage
            result["missingSkills"] = missing_skills
            result["targetRole"] = target_role
            return result
        except Exception as e:
            print(f"Error enriching skill gap with LLM: {e}")
            return {
                "targetRole": target_role,
                "matchPercentage": match_percentage,
                "missingSkills": missing_skills,
                "resources": [f"Search online for tutorials on: {', '.join(missing_skills)}"],
                "nextSteps": ["Create projects using your missing skills to build practical experience."],
            }

    return await cached_ai_call(
        "analyze_skill_gap",
        {"skills": skills, "target_role": target_role},
        _call,
    )


async def generate_interview_questions(role: str, company: str) -> list:
    from app.services.ai_cache import cached_ai_call

    async def _call():
        prompt = f"""Generate exactly 5 multiple-choice technical/behavioral interview questions for a role as '{role}' at '{company or 'a top tech company'}'. Include options, correctAnswer index (0-3), and detailed explanation."""
        try:
            response_text = await generate_structured_content_async(prompt, InterviewPrepResponse)
            return json.loads(response_text).get("questions", [])
        except Exception:
            return []

    return await cached_ai_call(
        "generate_interview_questions",
        {"role": role, "company": company},
        _call,
    )


async def career_recommendations(profile: dict) -> dict:
    from app.services.ai_cache import cached_ai_call

    async def _call():
        prompt = f"""Based on the student's profile, suggest 3 suitable career paths:
    Department: {profile.get('department', 'Computer Science')}
    CGPA: {profile.get('cgpa', '8.5')}
    Interests/Skills: {profile.get('skills', 'Software Engineering, Web Development')}"""
        try:
            response_text = await generate_structured_content_async(prompt, CareerAdviceResponse)
            return json.loads(response_text)
        except Exception:
            return {"recommendations": []}

    return await cached_ai_call(
        "career_recommendations",
        {
            "department": profile.get("department", "Computer Science"),
            "cgpa": str(profile.get("cgpa", "8.5")),
            "skills": profile.get("skills", "Software Engineering, Web Development"),
        },
        _call,
    )


async def parse_timetable_from_text(text: str) -> dict:
    prompt = """Analyze this academic timetable text.
    Extract the classes/lectures schedule. Deduce the department, year (I, II, III, IV), and section from the text, defaulting to CSE, II, and A if not found. Normalize day names (e.g. Monday, Tuesday) and start/end times in 24-hour format HH:MM.
    
    Timetable text:
    """ + text
    
    try:
        response_text = await generate_structured_content_async(prompt, TimetableParseResponse)
        return json.loads(response_text)
    except Exception:
        return {"department": "CSE", "year": "II", "section": "A", "entries": []}


async def parse_timetable_from_image(file_bytes: bytes, mime_type: str) -> dict:
    prompt = """Analyze this image of an academic timetable.
    Extract the classes/lectures schedule. Deduce the department, year (I, II, III, IV), and section from the title or contents, defaulting to CSE, II, and A if not found. Normalize day names (e.g. Monday, Tuesday) and start/end times in 24-hour format HH:MM.
    """
    
    try:
        response_text = await generate_multimodal_structured_content_async(prompt, mime_type, file_bytes, TimetableParseResponse)
        return json.loads(response_text)
    except Exception:
        return {"department": "CSE", "year": "II", "section": "A", "entries": []}


class StudyMaterialCategorizeResponse(BaseModel):
    department: str = Field(description="Department abbreviation: CSE, ECE, ME, IT")
    semester: int = Field(description="Semester number from 1 to 8")
    section: str = Field(description="Section name, e.g. A, B, C")
    unit: str = Field(description="Course unit name or number, e.g. Unit I, Unit II")
    tags: List[str] = Field(description="3-5 key search tags for search indexing")


async def categorize_study_material(title: str, description: str, subject_name: str, filename: str) -> dict:
    prompt = f"""Categorize this study material:
    Title: {title}
    Description: {description or ''}
    Subject: {subject_name}
    File Name: {filename}
    
    Predict the:
    - Target Department (CSE, ECE, ME, IT)
    - Target Semester (1-8)
    - Target Section (A, B, C)
    - Course Unit (e.g. Unit I, Unit II)
    - Search tags
    
    Return a structured JSON output matching the StudyMaterialCategorizeResponse schema.
    """
    try:
        response_text = await generate_structured_content_async(prompt, StudyMaterialCategorizeResponse)
        return json.loads(response_text)
    except Exception:
        return {"department": "CSE", "semester": 1, "section": "A", "unit": "Unit I", "tags": []}


class SmartNotificationFormats(BaseModel):
    title: str = Field(description="A professional, catchy title for the announcement")
    announcement: str = Field(description="Full professional campus announcement text")
    email_subject: str = Field(description="A professional email subject line")
    email_body: str = Field(description="HTML formatted email body template")
    push_alert: str = Field(description="A short, concise push alert (max 100 chars)")


async def format_smart_notification(short_title: str, short_msg: str, category: str) -> dict:
    prompt = f"""Format this short notification text into 3 formats: professional announcement, email template, and a concise mobile push alert.
    Short Title: {short_title}
    Short Message: {short_msg}
    Category: {category}
    
    Return a structured JSON output matching the SmartNotificationFormats schema.
    """
    try:
        response_text = await generate_structured_content_async(prompt, SmartNotificationFormats)
        return json.loads(response_text)
    except Exception:
        return {
            "title": short_title,
            "announcement": short_msg,
            "email_subject": short_title,
            "email_body": f"<p>{short_msg}</p>",
            "push_alert": short_msg[:100]
        }
