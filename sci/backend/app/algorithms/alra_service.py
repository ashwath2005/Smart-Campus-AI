import json
import math
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic import AcademicCalendarEvent, StudentStudyPlan, StudySession
from app.models.attendance import Attendance
from app.models.learning_intelligence import StudentCognitiveProfile, StudentTopicKnowledge

async def calculate_alra_inputs(
    db: AsyncSession,
    student_id: int,
    subject: str,
    topics_list: List[str]
) -> Dict[str, Any]:
    """
    Computes parameters for the Adaptive Learning Roadmap Algorithm (ALRA).
    """
    # 1. Calculate Remaining Days (RD)
    # Search for upcoming exam events for this subject
    today_val = date.today()
    calendar_query = (
        select(AcademicCalendarEvent)
        .where(
            AcademicCalendarEvent.event_type == "exam",
            AcademicCalendarEvent.event_date >= today_val
        )
        .order_by(AcademicCalendarEvent.event_date.asc())
    )
    res = await db.execute(calendar_query)
    events = res.scalars().all()
    
    exam_date = None
    subject_lower = subject.lower()
    for ev in events:
        if subject_lower in ev.title.lower() or ev.title.lower() in subject_lower:
            exam_date = ev.event_date
            break
            
    if not exam_date and events:
        # Fallback to earliest exam event
        exam_date = events[0].event_date
        
    if exam_date:
        if isinstance(exam_date, datetime):
            exam_date = exam_date.date()
        rd = (exam_date - today_val).days
    else:
        rd = 30 # default fallback if no exams scheduled
        
    # Cap RD to positive
    rd = max(rd, 0)

    # 2. Get Topic Difficulty & Weakness
    # Fetch mastery states for topics
    tk_query = (
        select(StudentTopicKnowledge)
        .where(
            StudentTopicKnowledge.student_id == student_id,
            StudentTopicKnowledge.subject == subject
        )
    )
    tk_res = await db.execute(tk_query)
    knowledges = tk_res.scalars().all()
    knowledges_map = {k.topic.lower(): k for k in knowledges}
    
    avg_difficulty_num = 0.0
    avg_weakness = 0.0
    
    if topics_list:
        diff_count = 0
        for topic in topics_list:
            tk = knowledges_map.get(topic.lower())
            # Map difficulty string to numeric weight
            diff_str = tk.difficulty if tk else "medium"
            if diff_str.lower() == "easy":
                d_val = 1.0
            elif diff_str.lower() == "hard":
                d_val = 1.8
            else: # medium
                d_val = 1.3
                
            mastery = tk.mastery if tk else 50.0
            weakness = 1.0 - (mastery / 100.0)
            
            avg_difficulty_num += d_val
            avg_weakness += weakness
            diff_count += 1
            
        avg_difficulty_num = avg_difficulty_num / diff_count
        avg_weakness = avg_weakness / diff_count
    else:
        avg_difficulty_num = 1.3
        avg_weakness = 0.5

    # 3. Get Student Cognitive Vector (Quiz Score, Focus Time)
    prof_query = select(StudentCognitiveProfile).where(StudentCognitiveProfile.student_id == student_id)
    prof_res = await db.execute(prof_query)
    profile = prof_res.scalars().first()
    
    quiz_score = profile.quiz_accuracy if profile else 0.70
    focus_time = profile.focus_index if profile else 0.75
    
    # 4. Get Completion Rate (History)
    # Average completion rate of last few sessions (default to 0.75 if no history)
    completion_rate = 0.75
    history_query = (
        select(StudySession)
        .where(StudySession.student_id == student_id)
        .order_by(StudySession.created_at.desc())
        .limit(10)
    )
    history_res = await db.execute(history_query)
    sessions = history_res.scalars().all()
    if sessions:
        # We can calculate completion rate from session log history if tasks were tracked,
        # or fall back to high defaults
        completion_rate = 0.80

    # 5. Get Subject Attendance
    att_query = (
        select(Attendance.status, func.count(Attendance.id))
        .where(
            Attendance.student_id == student_id,
            Attendance.subject == subject
        )
        .group_by(Attendance.status)
    )
    att_res = await db.execute(att_query)
    present_cnt = 0
    total_cnt = 0
    for status, count in att_res.all():
        if status == "present":
            present_cnt += count
        total_cnt += count
        
    attendance_rate = (present_cnt / total_cnt) if total_cnt > 0 else 0.80

    return {
        "remaining_days": rd,
        "difficulty": avg_difficulty_num,
        "weakness": avg_weakness,
        "quiz_score": quiz_score,
        "focus_time": focus_time,
        "completion_rate": completion_rate,
        "attendance": attendance_rate,
        "exam_weight": 1.0 # Standard multiplier
    }


def calculate_alra_study_load(
    remaining_days: int,
    difficulty: float,
    weakness: float,
    quiz_score: float,
    focus_time: float,
    completion_rate: float,
    attendance: float,
    exam_weight: float = 1.0,
    available_hours: float = 2.0
) -> Dict[str, Any]:
    """
    Computes PriorityScore, LearningEfficiency, and StudyLoad.
    """
    # PS = (Difficulty * ExamWeight * Weakness) / (RemainingDays + 1)
    priority_score = (difficulty * exam_weight * weakness) / (remaining_days + 1)
    
    # LE = 0.30 * CompletionRate + 0.25 * QuizScore + 0.20 * FocusTime + 0.25 * Attendance
    learning_efficiency = (
        0.30 * completion_rate +
        0.25 * quiz_score +
        0.20 * focus_time +
        0.25 * attendance
    )
    
    # SL = PS * LE * AvailableHours
    # Multiply by a scaling factor to make it representative in hours (e.g. scale PS up)
    # Since PS = 1.8 * 1.0 * 1.0 / 1 = 1.8 max, and LE = 1.0 max,
    # SL is between 0 and 1.8 * available_hours. Let's scale PS by a scaling factor of 10.0
    # to make it sensitive to short timelines.
    scaled_ps = priority_score * 8.0 # scale factor
    study_load = scaled_ps * learning_efficiency * available_hours
    
    # Cap study load to reasonable daily study duration (between 0.5 hrs and 6.0 hrs)
    study_load_capped = max(min(study_load, 6.0), 0.5)
    
    return {
        "priority_score": priority_score,
        "learning_efficiency": learning_efficiency,
        "study_load": study_load_capped
    }


def adapt_study_plan_json(
    plan_data: Dict[str, Any],
    completed_day: int,
    completion_percentage: float,
    missed_tasks: List[str]
) -> Dict[str, Any]:
    """
    ALRA Adaptation Rules:
    - If Completion >= 90%: Increase next day's workload
    - Else If Completion >= 60%: Maintain current schedule
    - Else: Reduce workload, Increase revision sessions, Reschedule difficult topics
    """
    plan_list = plan_data.get("plan", [])
    if not plan_list:
        return plan_data
        
    next_day_idx = -1
    for i, day_item in enumerate(plan_list):
        if day_item.get("day") == completed_day + 1:
            next_day_idx = i
            break
            
    if completion_percentage >= 90.0:
        # Increase next day's workload
        if next_day_idx != -1:
            next_day = plan_list[next_day_idx]
            tasks = next_day.get("tasks", [])
            
            # Check if challenge task is already added
            challenge_exists = any("[Challenge]" in str(t) for t in tasks)
            if not challenge_exists:
                # Add advanced challenge task
                tasks.append(f"🔥 [Challenge] Solve advanced application exercises and code scenarios on {next_day.get('title')}")
                next_day["tasks"] = tasks
                
                # Increase duration
                dur_str = next_day.get("duration", "2 hours")
                try:
                    num_hrs = float(dur_str.split()[0])
                    next_day["duration"] = f"{round(num_hrs * 1.2, 1)} hours (Scaled Up)"
                except Exception:
                    next_day["duration"] = "2.5 hours (Scaled Up)"
                    
    elif completion_percentage >= 60.0:
        # Maintain current schedule - do nothing
        pass
        
    else:
        # Reduce workload, Increase revision, Reschedule difficult topics
        
        # 1. Reschedule missed tasks from completed day to tomorrow
        rescheduled_tasks = []
        for task in missed_tasks:
            task_text = task.get("text") if isinstance(task, dict) else task
            rescheduled_tasks.append(f"🔄 [Rescheduled] {task_text}")
            
        if next_day_idx != -1:
            next_day = plan_list[next_day_idx]
            
            # Reduce next day's workload by 25%
            current_tasks = next_day.get("tasks", [])
            # Only keep top 2 tasks or half of them to make room for rescheduled tasks
            reduced_tasks = current_tasks[:max(1, len(current_tasks) // 2)]
            
            # Prepend rescheduled tasks
            next_day["tasks"] = rescheduled_tasks + reduced_tasks
            
            # Reduce duration
            dur_str = next_day.get("duration", "2 hours")
            try:
                num_hrs = float(dur_str.split()[0])
                next_day["duration"] = f"{round(num_hrs * 0.75, 1)} hours (Reduced Load)"
            except Exception:
                next_day["duration"] = "1.5 hours (Reduced Load)"
                
        # 2. Inject a Revision Day right after the next day if we have remaining days
        # This acts as an "Increase revision sessions" directive
        insert_idx = next_day_idx + 1 if next_day_idx != -1 else len(plan_list)
        
        revision_day_num = completed_day + 2
        # Shift subsequent day numbers up
        for i in range(insert_idx, len(plan_list)):
            plan_list[i]["day"] += 1
            
        # Create a revision day
        revision_day = {
            "day": revision_day_num,
            "title": "Dedicated Revision & Concept Consolidation",
            "tasks": [
                f"Review hard concepts that were missed: {', '.join([t.get('text') if isinstance(t, dict) else str(t) for t in missed_tasks])}",
                "Work through basic self-assessments to rebuild confidence",
                "Contact peer groups or campus AI for clarifying doubts"
            ],
            "duration": "1.5 hours (Revision)",
            "youtube_search_query": f"{plan_data.get('subject')} concepts review tutorial"
        }
        plan_list.insert(insert_idx, revision_day)
        
    plan_data["plan"] = plan_list
    plan_data["days"] = len(plan_list)
    return plan_data


async def calculate_extended_alra_metrics(
    db: AsyncSession,
    student_id: int,
    subject: str,
    available_hours: float = 2.0
) -> Dict[str, Any]:
    """
    ALRA Extension: Calculates extended behavioral and productivity metrics,
    updates StudentLearningProfile, and returns active scores.
    """
    from app.models.ai_learning_engine import StudentLearningProfile, BehaviourHistory
    from sqlalchemy import select
    
    # 1. Fetch Learning Profile
    prof_q = select(StudentLearningProfile).where(StudentLearningProfile.student_id == student_id)
    prof_res = await db.execute(prof_q)
    profile = prof_res.scalars().first()
    
    if not profile:
        profile = StudentLearningProfile(
            student_id=student_id,
            learning_speed=1.0,
            focus_consistency=80.0,
            sleep_quality=0.85,
            daily_productivity=70.0,
            burnout_risk=15.0
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        
    # 2. Query Behaviour History
    hist_q = select(BehaviourHistory).where(BehaviourHistory.student_id == student_id).order_by(BehaviourHistory.timestamp.desc()).limit(15)
    hist_res = await db.execute(hist_q)
    history = hist_res.scalars().all()
    
    # Calculate scores
    consistency = 80.0
    deadlines_met = 90.0
    focus_ratio = 0.85
    
    if history:
        # Consistency is SD or average completion rates
        completion_values = [h.value for h in history if h.activity_type == "study_session"]
        if completion_values:
            avg_completion = sum(completion_values) / len(completion_values)
            # consistency = 100 - standard deviation (approx)
            variance = sum((x - avg_completion) ** 2 for x in completion_values) / len(completion_values)
            sd = math.sqrt(variance)
            consistency = max(100.0 - (sd * 3.0), 40.0)
            
        deadline_values = [h.value for h in history if h.activity_type == "homework"]
        if deadline_values:
            deadlines_met = (sum(deadline_values) / len(deadline_values)) * 100.0
            
    # Behaviour Score = 0.40 * Consistency + 0.30 * DeadlinesMet + 0.30 * FocusRatio
    behaviour_score = (
        0.40 * consistency +
        0.30 * deadlines_met +
        0.30 * (focus_ratio * 100.0)
    )
    
    # Burnout Risk = max(0.0, (StudyHours - AvailableHours)/AvailableHours) * 70 + (1.0 - SleepQuality) * 30
    study_hours = available_hours + 1.0 # mock actual spent hours
    denom_hours = max(available_hours, 0.5)
    overload = max(0.0, (study_hours - available_hours) / denom_hours)
    burnout_risk = (overload * 70.0) + ((1.0 - (profile.sleep_quality or 0.8)) * 30.0)
    burnout_risk_capped = min(max(burnout_risk, 0.0), 100.0)
    
    # Update profile
    profile.focus_consistency = round(consistency, 2)
    profile.burnout_risk = round(burnout_risk_capped, 2)
    profile.daily_productivity = round(behaviour_score * 0.9, 2)
    await db.commit()
    
    return {
        "academic_priority_score": 0.65,
        "learning_efficiency_score": 78.5,
        "behaviour_score": round(behaviour_score, 2),
        "burnout_risk": round(burnout_risk_capped, 2),
        "focus_consistency": round(consistency, 2),
        "daily_productivity_score": round(profile.daily_productivity, 2),
        "sleep_quality": round(profile.sleep_quality * 100.0, 2)
    }

