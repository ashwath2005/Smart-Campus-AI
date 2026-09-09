import json
import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, update, insert, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.learning_intelligence import StudentLearningInteraction, StudentCognitiveProfile, StudentTopicKnowledge
from app.models.user import User

# --- Prerequisite Graph ---
PREREQUISITE_MAP = {
    "Linked Lists": ["Arrays"],
    "Stacks": ["Linked Lists"],
    "Queues": ["Linked Lists"],
    "Trees": ["Stacks", "Linked Lists"],
    "Graphs": ["Trees"],
    "Semaphores": ["Processes"],
    "Deadlocks": ["Semaphores"],
    "Virtual Memory": ["Memory Management"],
}

# --- Service Helper Functions ---

def calculate_retention(last_revisited: datetime, mastery: float, revision_count: int, difficulty: str) -> float:
    """
    Computes Ebbinghaus Forgetting Curve retention percentage.
    R = e^(-t / S)
    """
    if last_revisited.tzinfo is not None:
        elapsed_seconds = (datetime.now(timezone.utc) - last_revisited).total_seconds()
    else:
        elapsed_seconds = (datetime.now() - last_revisited).total_seconds()
        
    t = elapsed_seconds / 86400.0 # time in days
    
    diff_factor = 1.0
    if difficulty.lower() == "easy":
        diff_factor = 1.0
    elif difficulty.lower() == "hard":
        diff_factor = 1.8
    else:
        diff_factor = 1.3
        
    # Memory strength S increases with revisions and mastery, decreases with difficulty
    strength = 1.5 * (1 + revision_count) * (1.0 + mastery / 100.0) / diff_factor
    
    retention = math.exp(-t / strength) * 100.0
    return max(min(retention, 100.0), 0.0)


async def update_student_cognitive_profile(db: AsyncSession, student_id: int, interaction_type: str, metadata: dict):
    """
    CLPA: Update behavior vectors using reinforcement rule.
    """
    # Load profile or create default
    q = select(StudentCognitiveProfile).where(StudentCognitiveProfile.student_id == student_id)
    res = await db.execute(q)
    profile = res.scalars().first()
    
    if not profile:
        profile = StudentCognitiveProfile(student_id=student_id)
        db.add(profile)
        await db.flush()
        
    alpha = 0.15 # Learning update rate
    
    if interaction_type == "reading":
        # Check scroll depth and time spent
        depth = float(metadata.get("scroll_depth", 50)) / 100.0 # 0.0 to 1.0
        time_spent = float(metadata.get("duration_seconds", 30))
        read_efficiency_event = min(depth * (time_spent / 120.0), 1.0)
        profile.reading_efficiency = alpha * read_efficiency_event + (1 - alpha) * profile.reading_efficiency
        
    elif interaction_type == "quiz":
        score = float(metadata.get("score", 50)) / 100.0 # 0.0 to 1.0
        profile.quiz_accuracy = alpha * score + (1 - alpha) * profile.quiz_accuracy
        
    elif interaction_type == "code":
        success = 1.0 if metadata.get("status") == "success" else 0.0
        profile.coding_performance = alpha * success + (1 - alpha) * profile.coding_performance
        
    # Update consistency, engagement
    profile.engagement_score = min(profile.engagement_score + 0.05, 1.0)
    profile.focus_index = alpha * float(metadata.get("focus_percentage", 80)) / 100.0 + (1 - alpha) * profile.focus_index
    
    # Recalculate dynamic learning style
    styles = {
        "Reading Learner": profile.reading_efficiency,
        "Practical Learner": profile.coding_performance,
        "Analytical Learner": profile.quiz_accuracy,
        "Consistent Learner": profile.study_consistency,
    }
    profile.learning_style = max(styles, key=styles.get)
    profile.updated_at = datetime.now()
    await db.flush()


async def update_topic_mastery(db: AsyncSession, student_id: int, subject: str, topic: str, score_change: float, difficulty: str = "medium"):
    """
    Updates the student's mastery of a specific topic.
    """
    q = select(StudentTopicKnowledge).where(
        StudentTopicKnowledge.student_id == student_id,
        StudentTopicKnowledge.subject == subject,
        StudentTopicKnowledge.topic == topic
    )
    res = await db.execute(q)
    tk = res.scalars().first()
    
    if not tk:
        tk = StudentTopicKnowledge(
            student_id=student_id,
            subject=subject,
            topic=topic,
            mastery=50.0,
            difficulty=difficulty,
            revision_count=0,
            last_revisited_at=datetime.now()
        )
        db.add(tk)
        await db.flush()
        
    tk.mastery = max(min(tk.mastery + score_change, 100.0), 0.0)
    tk.revision_count += 1
    tk.last_revisited_at = datetime.now()
    await db.flush()


async def fetch_knowledge_analytics(db: AsyncSession, student_id: int) -> List[dict]:
    """
    KDPA: Compute retention, decay risk, and propagate prerequisites.
    """
    q = select(StudentTopicKnowledge).where(StudentTopicKnowledge.student_id == student_id)
    res = await db.execute(q)
    knowledges = res.scalars().all()
    
    # Build mastery map for prerequisites check
    mastery_map = {k.topic: k.mastery for k in knowledges}
    
    results = []
    for k in knowledges:
        # Calculate base retention
        ret = calculate_retention(k.last_revisited_at, k.mastery, k.revision_count, k.difficulty)
        
        # Prerequisite multiplier: if prerequisite mastery is low, reduce retention/confidence
        prereqs = PREREQUISITE_MAP.get(k.topic, [])
        prereq_mult = 1.0
        unmet_prereqs = []
        for p in prereqs:
            p_mastery = mastery_map.get(p, 50.0)
            if p_mastery < 60.0:
                prereq_mult *= (0.7 + 0.3 * (p_mastery / 100.0))
                unmet_prereqs.append(p)
                
        adjusted_ret = ret * prereq_mult
        confidence = k.confidence * prereq_mult
        
        decay_risk = 100.0 - adjusted_ret
        
        # Priority increases if decay is high or topic is placement important
        priority = (decay_risk / 10.0) + (1.5 if unmet_prereqs else 0.0)
        
        # Save to database object for caching/analytics queries
        k.retention = adjusted_ret
        k.confidence = confidence
        k.decay_risk = decay_risk
        k.revision_priority = min(max(priority, 1.0), 10.0)
        
        results.append({
            "id": k.id,
            "subject": k.subject,
            "topic": k.topic,
            "mastery": k.mastery,
            "retention": adjusted_ret,
            "confidence": confidence,
            "decay_risk": decay_risk,
            "revision_priority": k.revision_priority,
            "difficulty": k.difficulty,
            "revision_count": k.revision_count,
            "last_revisited_at": str(k.last_revisited_at),
            "unmet_prerequisites": unmet_prereqs
        })
        
    await db.flush()
    return results


async def generate_ai_recommendations(db: AsyncSession, student_id: int) -> List[dict]:
    """
    AI Decision Engine: Merges CLPA profiles and KDPA retention risks to create explainable tasks.
    """
    # Fetch cognitive profile
    q_prof = select(StudentCognitiveProfile).where(StudentCognitiveProfile.student_id == student_id)
    res_prof = await db.execute(q_prof)
    profile = res_prof.scalars().first()
    style = profile.learning_style if profile else "Exploration Learner"
    
    # Fetch knowledge states
    knowledges = await fetch_knowledge_analytics(db, student_id)
    
    # Sort topics by highest revision priority
    sorted_topics = sorted(knowledges, key=lambda x: x["revision_priority"], reverse=True)
    
    recommendations = []
    
    # Generate recommendations for top 3 high-priority decay topics
    for topic_item in sorted_topics[:3]:
        topic = topic_item["topic"]
        subject = topic_item["subject"]
        decay = topic_item["decay_risk"]
        
        # Personalize based on learning style
        if style == "Practical Learner":
            rec_type = "Coding Exercise"
            action = f"Complete coding challenges for '{topic}'"
            benefit = "Reinforces logical structures and debug patterns."
            duration = "45 minutes"
        elif style == "Reading Learner":
            rec_type = "Topic Summary & Slides"
            action = f"Review executive summaries and slide decks for '{topic}'"
            benefit = "Builds visual conceptual maps and details."
            duration = "20 minutes"
        else:
            rec_type = "Practice Revision Test"
            action = f"Attempt the revision mock test for '{topic}'"
            benefit = "Forces active recall and highlights weaknesses."
            duration = "30 minutes"
            
        # Unmet prerequisites handling
        if topic_item["unmet_prerequisites"]:
            prereq = topic_item["unmet_prerequisites"][0]
            recommendations.append({
                "type": "Prerequisite Review",
                "subject": subject,
                "topic": prereq,
                "action": f"Master prerequisite topic '{prereq}' before continuing '{topic}'",
                "duration": "30 minutes",
                "rationale": f"You are trying to study '{topic}', but your prerequisite mastery of '{prereq}' is low. Completing this will boost your dependent confidence.",
                "benefit": "Solidifies foundation concepts required for advanced structures.",
                "decay_risk": decay
            })
            
        recommendations.append({
            "type": rec_type,
            "subject": subject,
            "topic": topic,
            "action": action,
            "duration": duration,
            "rationale": f"Your retention for '{topic}' has decayed to {topic_item['retention']:.1f}% (Decay Risk: {decay:.1f}%).",
            "benefit": benefit,
            "decay_risk": decay
        })
        
    return recommendations


async def get_faculty_analytics_summary(db: AsyncSession) -> dict:
    """
    Aggregates department-wide knowledge maps, weakest concepts, and high-risk student warnings.
    """
    # 1. Total student profiles
    q_total = select(func.count(User.id)).where(User.role == "student")
    res_total = await db.execute(q_total)
    total_students = res_total.scalar() or 1
    
    # 2. Average knowledge retention
    q_avg_ret = select(func.avg(StudentTopicKnowledge.retention))
    res_avg_ret = await db.execute(q_avg_ret)
    avg_retention = float(res_avg_ret.scalar() or 75.0)
    
    # 3. Topic mastery distributions
    q_topics = select(
        StudentTopicKnowledge.topic,
        func.avg(StudentTopicKnowledge.mastery),
        func.avg(StudentTopicKnowledge.retention)
    ).group_by(StudentTopicKnowledge.topic)
    res_topics = await db.execute(q_topics)
    topic_summary = [
        {"topic": row[0], "avg_mastery": float(row[1] or 0), "avg_retention": float(row[2] or 0)}
        for row in res_topics.all()
    ]
    
    # 4. Learning style distribution
    q_styles = select(
        StudentCognitiveProfile.learning_style,
        func.count(StudentCognitiveProfile.id)
    ).group_by(StudentCognitiveProfile.learning_style)
    res_styles = await db.execute(q_styles)
    style_dist = [
        {"style": row[0], "count": int(row[1] or 0)}
        for row in res_styles.all()
    ]
    
    # 5. Weakest Topics (mastery < 60)
    weak_topics = sorted([t for t in topic_summary if t["avg_mastery"] < 60], key=lambda x: x["avg_mastery"])
    
    # 6. High-Risk Students (retention < 50)
    q_risk = select(
        User.name,
        User.id,
        func.avg(StudentTopicKnowledge.retention)
    ).join(StudentTopicKnowledge, StudentTopicKnowledge.student_id == User.id)\
     .group_by(User.id, User.name)\
     .having(func.avg(StudentTopicKnowledge.retention) < 50.0)\
     .limit(10)
    res_risk = await db.execute(q_risk)
    risk_students = [
        {"name": row[0], "student_id": row[1], "avg_retention": float(row[2] or 0)}
        for row in res_risk.all()
    ]
    
    return {
        "total_students": total_students,
        "avg_retention": avg_retention,
        "topic_summary": topic_summary,
        "learning_style_distribution": style_dist,
        "weakest_topics": weak_topics[:5],
        "high_risk_students": risk_students
    }
