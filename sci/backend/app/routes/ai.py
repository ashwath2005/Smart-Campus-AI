import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, update
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services.gemini_service import (
    ask_campus_ai, summarize_pdf_text, generate_quiz,
    generate_study_plan, review_resume, analyze_skill_gap,
    generate_interview_questions, career_recommendations
)
from app.services.pdf_service import extract_text_from_pdf
from app.models.communication import ChatHistory
from app.models.attendance import Attendance
from app.models.assignment import Assignment, Submission
from app.models.user import User, Timetable, TimetableEntry, Announcement
from app.models.department import Department
from app.models.event import Event
from app.models.academic import InternalMark, SemesterResult, AcademicCalendarEvent, StudySession, StudentStudyPlan
from app.models.placement import Placement, PlacementApplication, Company

router = APIRouter(prefix="/ai", tags=["AI"])


# ─── Pydantic Request Models ──────────────────────────────────────────────────


class ChatRequest(BaseModel):
    question: str
    conversation_id: str
    context: Optional[dict] = {}


class StudyPlanRequest(BaseModel):
    subject: str
    topics: str
    days: int
    available_hours: Optional[float] = Field(2.0, description="Available hours per day for study")


class ToggleTaskRequest(BaseModel):
    day: int
    task_index: int
    completed: bool


class SessionFeedbackRequest(BaseModel):
    day: int
    completion_percentage: float
    duration_seconds: int


class LogStudySessionRequest(BaseModel):
    subject: str
    topic: str
    day_number: Optional[int] = None
    duration_seconds: int
    video_title: Optional[str] = None


class SkillGapRequest(BaseModel):
    skills: str
    target_role: str


class InterviewPrepRequest(BaseModel):
    role: str
    company: Optional[str] = None


class CareerAdviceRequest(BaseModel):
    skills: str
    cgpa: float
    department: str


# ─── Context Helper Function ─────────────────────────────────────────────────


async def get_ai_context(user: dict, db: AsyncSession) -> dict:
    user_id = user["id"]
    role = user["role"]
    context = {
        "name": user["name"],
        "role": role,
        "department": user.get("department", "N/A"),
        "semester": user.get("semester", 1),
    }
    
    # Compile faculty locator status summaries for AI context
    try:
        from app.routes.faculty_locator import get_faculty_status_details
        fac_res = await db.execute(select(User).where(User.role == "faculty"))
        faculties = fac_res.scalars().all()
        now_dt = datetime.now()
        fac_summaries = []
        for fac in faculties:
            status_info = await get_faculty_status_details(fac, now_dt, db)
            status_str = status_info["status"]
            details = status_info["details"]
            
            # Format status details
            details_str = ""
            if status_str == "Teaching":
                details_str = f"teaching {details.get('subject')} to {details.get('department')} {details.get('year')}-{details.get('section')} in {details.get('classroom')} (ends at {details.get('class_end_time')})"
            elif status_str == "On Leave":
                details_str = f"on leave ({details.get('leave_type')}), returning on {details.get('return_date')}"
            else:
                next_class_info = ""
                if details.get("next_class"):
                    nc = details["next_class"]
                    next_class_info = f". Next class: {nc['subject']} at {nc['start_time']} in {nc['room']} for {nc['class_details']}"
                details_str = f"available (Staff Room: {details.get('staff_room')}){next_class_info}"
                
            fac_summaries.append(f"- {fac.name} (Employee ID: {fac.employee_id or 'N/A'}, Dept: {fac.department or 'N/A'}): Current status is '{status_str}' - {details_str}")
        
        context["faculty_locator_summary"] = "\n".join(fac_summaries) if fac_summaries else "No faculty records found."
    except Exception as fac_err:
        print(f"Error compiling faculty locator context: {fac_err}")
        context["faculty_locator_summary"] = "Faculty locator data unavailable."

    
    def local_map_semester_to_year(semester: int) -> str:
        if semester in (1, 2):
            return "I"
        elif semester in (3, 4):
            return "II"
        elif semester in (5, 6):
            return "III"
        elif semester in (7, 8):
            return "IV"
        return "I"

    if role == "student":
        try:
            # 1. Subject-wise attendance summary
            att_query = (
                select(Attendance.subject, Attendance.status, func.count(Attendance.id))
                .where(Attendance.student_id == user_id)
                .group_by(Attendance.subject, Attendance.status)
            )
            att_res = await db.execute(att_query)
            att_data = {}
            for subject, status, count in att_res.all():
                if subject not in att_data:
                    att_data[subject] = {"present": 0, "total": 0}
                if status == "present":
                    att_data[subject]["present"] += count
                att_data[subject]["total"] += count
            
            att_strings = []
            for sub, counts in att_data.items():
                pct = (counts["present"] / counts["total"] * 100) if counts["total"] > 0 else 100.0
                att_strings.append(f"{sub}: {counts['present']}/{counts['total']} ({pct:.1f}%)")
            context["attendance"] = ", ".join(att_strings) if att_strings else "No attendance records found."
            
            # 2. Pending Assignments (not submitted by student)
            sub_query = select(Submission.assignment_id).where(Submission.student_id == user_id)
            pending_query = select(Assignment).where(Assignment.id.not_in(sub_query))
            pending_res = await db.execute(pending_query)
            pending_list = pending_res.scalars().all()
            pending_strings = [
                f"'{a.title}' ({a.subject}, Due: {a.due_date.strftime('%Y-%m-%d') if a.due_date else 'N/A'})" 
                for a in pending_list
            ]
            context["pending_assignments"] = ", ".join(pending_strings) if pending_strings else "No pending assignments."
            
            # 3. Today's and Weekly Timetable
            today_day = datetime.now().strftime("%A")
            user_sem = user.get("semester", 1)
            year = local_map_semester_to_year(user_sem)
            dept = user.get("department")
            section = user.get("section", "A")
            
            # Today's classes
            timetable_query = (
                select(TimetableEntry)
                .join(Timetable)
                .where(
                    Timetable.department == dept,
                    Timetable.year == year,
                    Timetable.section == section,
                    Timetable.is_active == True,
                    TimetableEntry.day == today_day
                )
                .order_by(TimetableEntry.start_time)
            )
            timetable_res = await db.execute(timetable_query)
            classes = timetable_res.scalars().all()
            class_strings = [
                f"{c.subject} at {c.start_time.strftime('%H:%M') if c.start_time else 'N/A'}-{c.end_time.strftime('%H:%M') if c.end_time else 'N/A'} in Room {c.room} (Faculty: {c.faculty})" 
                for c in classes
            ]
            context["todays_classes"] = ", ".join(class_strings) if class_strings else "No classes scheduled for today."

            # Weekly timetable classes
            weekly_query = (
                select(TimetableEntry)
                .join(Timetable)
                .where(
                    Timetable.department == dept,
                    Timetable.year == year,
                    Timetable.section == section,
                    Timetable.is_active == True
                )
                .order_by(TimetableEntry.day, TimetableEntry.start_time)
            )
            weekly_res = await db.execute(weekly_query)
            weekly_entries = weekly_res.scalars().all()
            weekly_strings = [
                f"{we.day}: {we.subject} at {we.start_time.strftime('%H:%M') if we.start_time else 'N/A'}-{we.end_time.strftime('%H:%M') if we.end_time else 'N/A'} in Room {we.room} (Faculty: {we.faculty})"
                for we in weekly_entries
            ]
            context["weekly_timetable"] = "; ".join(weekly_strings) if weekly_strings else "No active timetable loaded."

            # 4. Internal CAT Marks
            try:
                marks_res = await db.execute(
                    select(InternalMark)
                    .where(InternalMark.student_id == user_id)
                    .order_by(InternalMark.created_at.desc())
                )
                marks_list = marks_res.scalars().all()
                marks_strings = [
                    f"{m.subject_name} ({m.exam_type.value if hasattr(m.exam_type, 'value') else m.exam_type}): {m.marks_obtained}/{m.max_marks}"
                    for m in marks_list
                ]
                context["internal_marks"] = ", ".join(marks_strings) if marks_strings else "No internal marks recorded."
            except Exception as marks_err:
                print(f"Error compiling marks context: {marks_err}")
                context["internal_marks"] = "Marks data unavailable."

            # 5. Semester Results & CGPA
            try:
                results_res = await db.execute(
                    select(SemesterResult)
                    .where(SemesterResult.student_id == user_id)
                    .order_by(SemesterResult.semester, SemesterResult.subject_name)
                )
                results_list = results_res.scalars().all()
                results_strings = [
                    f"Sem {r.semester} - {r.subject_name}: Grade {r.grade}"
                    for r in results_list
                ]
                context["semester_grades"] = ", ".join(results_strings) if results_strings else "No semester grades recorded."
                
                if results_list:
                    latest_res = results_list[-1]
                    context["cgpa"] = str(latest_res.cgpa) if latest_res.cgpa else "N/A"
                else:
                    context["cgpa"] = "N/A"
            except Exception as results_err:
                print(f"Error compiling results context: {results_err}")
                context["semester_grades"] = "Grades data unavailable."
                context["cgpa"] = "N/A"

            # 6. Placement Applications
            try:
                app_query = (
                    select(PlacementApplication, Placement, Company)
                    .join(Placement, PlacementApplication.placement_id == Placement.id)
                    .join(Company, Placement.company_id == Company.id)
                    .where(PlacementApplication.student_id == user_id)
                )
                app_res = await db.execute(app_query)
                app_records = app_res.all()
                app_strings = [
                    f"{comp.name} - {pl.title} (Status: {app_rec.status.value if hasattr(app_rec.status, 'value') else app_rec.status})"
                    for app_rec, pl, comp in app_records
                ]
                context["placement_applications"] = ", ".join(app_strings) if app_strings else "No placement applications submitted yet."
            except Exception as placement_err:
                print(f"Error compiling placement context: {placement_err}")
                context["placement_applications"] = "Placement data unavailable."

            # 7. Academic Calendar Events
            try:
                today_val = date.today()
                events_query = (
                    select(AcademicCalendarEvent)
                    .where(AcademicCalendarEvent.event_date >= today_val)
                    .order_by(AcademicCalendarEvent.event_date.asc())
                    .limit(5)
                )
                events_res = await db.execute(events_query)
                events_list = events_res.scalars().all()
                events_strings = [
                    f"'{e.title}' ({e.event_type.value if hasattr(e.event_type, 'value') else e.event_type} on {e.event_date.strftime('%Y-%m-%d')})"
                    for e in events_list
                ]
                context["calendar_events"] = ", ".join(events_strings) if events_strings else "No upcoming academic events scheduled."
            except Exception as cal_err:
                print(f"Error compiling academic calendar context: {cal_err}")
                context["calendar_events"] = "Calendar events unavailable."

            # 8. Campus Announcements
            try:
                dept_val = user.get("department", "all")
                announce_query = (
                    select(Announcement)
                    .where(
                        Announcement.target_role.in_(["all", "student"]),
                        Announcement.target_dept.in_(["all", dept_val])
                    )
                    .order_by(Announcement.created_at.desc())
                    .limit(5)
                )
                announce_res = await db.execute(announce_query)
                announce_list = announce_res.scalars().all()
                announce_strings = [
                    f"[{'EMERGENCY' if a.is_emergency else 'INFO'}] {a.title}: {a.content}"
                    for a in announce_list
                ]
                context["announcements"] = "\n".join(announce_strings) if announce_strings else "No announcements posted."
            except Exception as ann_err:
                print(f"Error compiling announcements context: {ann_err}")
                context["announcements"] = "Announcements unavailable."

        except Exception as e:
            print(f"Error compiling student context: {e}")
            
    elif role == "faculty":
        try:
            # 1. Today's classes to teach
            today_day = datetime.now().strftime("%A")
            timetable_query = (
                select(TimetableEntry, Timetable)
                .join(Timetable)
                .where(
                    TimetableEntry.faculty == user["name"],
                    TimetableEntry.day == today_day,
                    Timetable.is_active == True
                )
                .order_by(TimetableEntry.start_time)
            )
            timetable_res = await db.execute(timetable_query)
            classes = timetable_res.all()
            class_strings = [
                f"{c.subject} at {c.start_time.strftime('%H:%M') if c.start_time else 'N/A'}-{c.end_time.strftime('%H:%M') if c.end_time else 'N/A'} in Room {c.room} ({t.department} {t.year}-{t.section})" 
                for c, t in classes
            ]
            context["todays_classes"] = ", ".join(class_strings) if class_strings else "No classes to teach today."
            
            # Weekly teaching timetable
            weekly_query = (
                select(TimetableEntry, Timetable)
                .join(Timetable)
                .where(
                    TimetableEntry.faculty == user["name"],
                    Timetable.is_active == True
                )
                .order_by(TimetableEntry.day, TimetableEntry.start_time)
            )
            weekly_res = await db.execute(weekly_query)
            weekly_entries = weekly_res.all()
            weekly_strings = [
                f"{we.day}: {we.subject} at {we.start_time.strftime('%H:%M') if we.start_time else 'N/A'}-{we.end_time.strftime('%H:%M') if we.end_time else 'N/A'} in Room {we.room} for {t.department} {t.year}-{t.section}"
                for we, t in weekly_entries
            ]
            context["weekly_timetable"] = "; ".join(weekly_strings) if weekly_strings else "No active teaching timetable found."

            # 2. Assignments created by this faculty
            assignments_query = select(Assignment).where(Assignment.faculty_id == user_id)
            assignments_res = await db.execute(assignments_query)
            assignments_list = assignments_res.scalars().all()
            assignment_strings = [
                f"'{a.title}' ({a.subject}, Due: {a.due_date.strftime('%Y-%m-%d') if a.due_date else 'N/A'})" 
                for a in assignments_list
            ]
            context["created_assignments"] = ", ".join(assignment_strings) if assignment_strings else "No assignments created yet."

            # 3. Campus Announcements
            try:
                dept_val = user.get("department", "all")
                announce_query = (
                    select(Announcement)
                    .where(
                        Announcement.target_role.in_(["all", "faculty"]),
                        Announcement.target_dept.in_(["all", dept_val])
                    )
                    .order_by(Announcement.created_at.desc())
                    .limit(5)
                )
                announce_res = await db.execute(announce_query)
                announce_list = announce_res.scalars().all()
                announce_strings = [
                    f"[{'EMERGENCY' if a.is_emergency else 'INFO'}] {a.title}: {a.content}"
                    for a in announce_list
                ]
                context["announcements"] = "\n".join(announce_strings) if announce_strings else "No announcements posted."
            except Exception as ann_err:
                print(f"Error compiling announcements context: {ann_err}")
                context["announcements"] = "Announcements unavailable."

        except Exception as e:
            print(f"Error compiling faculty context: {e}")
            
    elif role == "admin":
        try:
            # System statistics
            students_count_res = await db.execute(select(func.count(User.id)).where(User.role == "student"))
            students_count = students_count_res.scalar() or 0
            
            faculty_count_res = await db.execute(select(func.count(User.id)).where(User.role == "faculty"))
            faculty_count = faculty_count_res.scalar() or 0
            
            depts_count_res = await db.execute(select(func.count(Department.id)))
            depts_count = depts_count_res.scalar() or 0
            
            events_count_res = await db.execute(select(func.count(Event.id)))
            events_count = events_count_res.scalar() or 0

            from app.models.academic import Classroom
            from app.models.user import FacultyLeave
            from app.models.department import Course

            # 1. Department stats
            dept_list_res = await db.execute(select(Department))
            depts = dept_list_res.scalars().all()
            dept_stats = []
            for d in depts:
                course_cnt_res = await db.execute(select(func.count(Course.id)).where(Course.department_id == d.id))
                cc = course_cnt_res.scalar() or 0
                dept_stats.append(f"{d.code}: HOD {d.hod_name or 'N/A'}, Courses: {cc}")
            context["department_statistics"] = "; ".join(dept_stats)
            
            # 2. Classroom utilization summary
            c_res = await db.execute(select(Classroom))
            classrooms = c_res.scalars().all()
            tt_res = await db.execute(
                select(TimetableEntry, Timetable)
                .join(Timetable)
                .where(Timetable.is_active == True)
            )
            active_entries = tt_res.all()
            room_stats = []
            for room in classrooms:
                room_entries = [e for e, t in active_entries if e.room and e.room.strip().lower() == room.room_number.strip().lower()]
                room_stats.append(f"{room.room_number}: {len(room_entries)}/36 slots booked")
            context["classroom_utilization"] = "; ".join(room_stats) if room_stats else "No classrooms loaded."

            # 3. Faculty Leave Schedules
            leaves_res = await db.execute(select(FacultyLeave, User).join(User, FacultyLeave.faculty_id == User.id))
            leaves = leaves_res.all()
            leave_strings = [
                f"{u.name} ({l.leave_type}): {l.start_date} to {l.end_date} - {l.status}"
                for l, u in leaves
            ]
            context["faculty_leaves"] = "; ".join(leave_strings) if leave_strings else "No leaves recorded."
            
            context["system_stats"] = f"{students_count} students, {faculty_count} faculty, {depts_count} departments, {events_count} active events"

            # Campus Announcements
            try:
                announce_query = (
                    select(Announcement)
                    .order_by(Announcement.created_at.desc())
                    .limit(5)
                )
                announce_res = await db.execute(announce_query)
                announce_list = announce_res.scalars().all()
                announce_strings = [
                    f"[{'EMERGENCY' if a.is_emergency else 'INFO'}] {a.title}: {a.content}"
                    for a in announce_list
                ]
                context["announcements"] = "\n".join(announce_strings) if announce_strings else "No announcements posted."
            except Exception as ann_err:
                print(f"Error compiling announcements context: {ann_err}")
                context["announcements"] = "Announcements unavailable."

        except Exception as e:
            print(f"Error compiling admin context: {e}")
            
    return context


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.post("/chat")
async def chat(
    req: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Retrieve real-time DB context for the current user
    context = await get_ai_context(current_user, db)
    # Merge with request context overrides if any
    if req.context:
        context.update(req.context)

    # Fetch recent chat messages for this conversation_id to provide memory context
    chat_history_list = []
    try:
        history_query = (
            select(ChatHistory)
            .where(
                ChatHistory.user_id == current_user["id"],
                ChatHistory.conversation_id == req.conversation_id
            )
            .order_by(ChatHistory.created_at.desc())
            .limit(10)  # Get last 10 messages for memory context
        )
        history_res = await db.execute(history_query)
        # Reverse them to get chronological order (oldest first)
        history_msgs = list(reversed(history_res.scalars().all()))
        chat_history_list = [
            {
                "role": m.role.value if hasattr(m.role, "value") else str(m.role),
                "message": m.message
            }
            for m in history_msgs
        ]
    except Exception as hist_err:
        print(f"Error fetching chat history: {hist_err}")

    # 1. Save user message to DB
    user_msg = ChatHistory(
        user_id=current_user["id"],
        conversation_id=req.conversation_id,
        role="user",
        message=req.question,
    )
    db.add(user_msg)

    # 2. Get response from Gemini (passing historical context)
    try:
        answer = await ask_campus_ai(req.question, context, chat_history_list)
    except Exception as e:
        answer = f"⚠️ AI Assistant Error: {str(e)}. Please check that your GEMINI_API_KEY in the backend `.env` file is correct and you have quota available."

    # 3. Save assistant response to DB
    assistant_msg = ChatHistory(
        user_id=current_user["id"],
        conversation_id=req.conversation_id,
        role="assistant",
        message=answer,
    )
    db.add(assistant_msg)
    await db.flush()

    return {"answer": answer}


@router.post("/summarize")
async def summarize(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)
    result = await summarize_pdf_text(text)
    return {
        "summary": result.get("summary", ""),
        "key_concepts": result.get("key_concepts", []),
        "questions": result.get("questions", []),
    }


@router.post("/quiz")
async def quiz(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)
    questions = await generate_quiz(text)
    return {"questions": questions}


@router.post("/study-plan")
async def study_plan(
    req: StudyPlanRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import json
    from app.algorithms.alra_service import calculate_alra_inputs, calculate_alra_study_load
    try:
        # Parse topics to a list
        topics_list = [t.strip() for t in req.topics.split(",") if t.strip()]
        
        # Calculate ALRA Inputs
        try:
            alra_inputs = await calculate_alra_inputs(db, current_user["id"], req.subject, topics_list)
            alra_metrics = calculate_alra_study_load(
                **alra_inputs,
                available_hours=req.available_hours or 2.0
            )
            # Merge inputs for prompt display
            alra_metrics.update(alra_inputs)
        except Exception as alra_err:
            print(f"Error computing ALRA parameters: {alra_err}")
            alra_metrics = None
            
        plan = await generate_study_plan(req.subject, req.topics, req.days, alra_metrics)
        
        # Transform tasks from List[str] to List[dict] for checklist tracking
        formatted_plan = plan.copy()
        if "plan" in formatted_plan:
            formatted_day_plans = []
            for day_entry in formatted_plan["plan"]:
                new_day_entry = day_entry.copy()
                new_day_entry["tasks"] = [
                    {"text": t, "completed": False} if isinstance(t, str) else t
                    for t in day_entry.get("tasks", [])
                ]
                formatted_day_plans.append(new_day_entry)
            formatted_plan["plan"] = formatted_day_plans

        # Deactivate previous active plans for this student
        await db.execute(
            update(StudentStudyPlan)
            .where(StudentStudyPlan.student_id == current_user["id"])
            .where(StudentStudyPlan.is_active == True)
            .values(is_active=False)
        )
        
        # Save new plan to history
        new_plan = StudentStudyPlan(
            student_id=current_user["id"],
            subject=req.subject,
            topics=req.topics,
            days=req.days,
            plan_json=json.dumps(formatted_plan),
            is_active=True
        )
        db.add(new_plan)
        await db.flush()
        
        return formatted_plan
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate and save study plan: {str(e)}"
        )


@router.put("/study-plans/{plan_id}/toggle-task")
async def toggle_task(
    plan_id: int,
    req: ToggleTaskRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import json
    try:
        query = (
            select(StudentStudyPlan)
            .where(StudentStudyPlan.id == plan_id)
            .where(StudentStudyPlan.student_id == current_user["id"])
        )
        res = await db.execute(query)
        plan = res.scalars().first()
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found")
            
        plan_data = json.loads(plan.plan_json)
        
        # Find the day entry in the plan
        day_entry = None
        for day in plan_data.get("plan", []):
            if day.get("day") == req.day:
                day_entry = day
                break
                
        if not day_entry:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Day {req.day} not found in plan")
            
        tasks = day_entry.get("tasks", [])
        if req.task_index < 0 or req.task_index >= len(tasks):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Task index {req.task_index} out of range")
            
        task_item = tasks[req.task_index]
        if isinstance(task_item, str):
            # Convert to object format if it was a string
            task_item = {"text": task_item, "completed": req.completed}
        else:
            task_item["completed"] = req.completed
            
        tasks[req.task_index] = task_item
        day_entry["tasks"] = tasks
        
        plan.plan_json = json.dumps(plan_data)
        db.add(plan)
        await db.flush()
        
        return {"status": "success", "plan": plan_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle study plan task: {str(e)}"
        )


@router.post("/study-plans/{plan_id}/session-feedback")
async def study_plan_feedback(
    plan_id: int,
    req: SessionFeedbackRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import json
    from app.algorithms.alra_service import adapt_study_plan_json
    try:
        # 1. Fetch study plan
        query = (
            select(StudentStudyPlan)
            .where(StudentStudyPlan.id == plan_id)
            .where(StudentStudyPlan.student_id == current_user["id"])
        )
        res = await db.execute(query)
        plan = res.scalars().first()
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found")
            
        plan_data = json.loads(plan.plan_json)
        
        # 2. Identify the day entry and find missed tasks
        day_entry = None
        for day in plan_data.get("plan", []):
            if day.get("day") == req.day:
                day_entry = day
                break
                
        if not day_entry:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Day {req.day} not found in plan")
            
        tasks = day_entry.get("tasks", [])
        missed_tasks = []
        for task in tasks:
            if isinstance(task, dict):
                if not task.get("completed"):
                    missed_tasks.append(task)
            else:
                # If tasks were strings, they couldn't be checked, so assume missed unless completion is high
                if req.completion_percentage < 90.0:
                    missed_tasks.append(task)
                    
        # 3. Log a study session
        session = StudySession(
            student_id=current_user["id"],
            subject=plan.subject,
            topic=day_entry.get("title", "Study Session"),
            day_number=req.day,
            duration_seconds=req.duration_seconds,
            video_title=day_entry.get("youtube_search_query", day_entry.get("title"))
        )
        db.add(session)
        
        # 4. Update student cognitive profile focus and engagement
        from app.algorithms.learning_intelligence import update_student_cognitive_profile
        # Calculate focus rate based on expected duration vs actual duration
        expected_dur = day_entry.get("duration", "2 hours")
        try:
            expected_hrs = float(expected_dur.split()[0])
            expected_sec = expected_hrs * 3600
            focus_ratio = min(req.duration_seconds / expected_sec, 1.0) if expected_sec > 0 else 1.0
        except Exception:
            focus_ratio = 1.0
            
        await update_student_cognitive_profile(
            db=db,
            student_id=current_user["id"],
            interaction_type="quiz", # trigger cognitive score updating
            metadata={"score": req.completion_percentage, "focus_percentage": focus_ratio * 100}
        )
        
        # Update topic knowledge mastery based on completion percentage
        from app.algorithms.learning_intelligence import update_topic_mastery
        topic_title = day_entry.get("title", "")
        # Extract keywords or use title
        score_change = (req.completion_percentage - 50.0) / 5.0 # positive change for high completion, negative for low
        await update_topic_mastery(
            db=db,
            student_id=current_user["id"],
            subject=plan.subject,
            topic=topic_title,
            score_change=score_change
        )
        
        # 5. Adapt the study plan json using ALRA
        adapted_plan_data = adapt_study_plan_json(
            plan_data=plan_data,
            completed_day=req.day,
            completion_percentage=req.completion_percentage,
            missed_tasks=missed_tasks
        )
        
        plan.plan_json = json.dumps(adapted_plan_data)
        db.add(plan)
        
        await db.flush()
        
        return {
            "status": "success",
            "message": "Study session logged and roadmap adapted.",
            "plan": adapted_plan_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit study session feedback: {str(e)}"
        )


@router.get("/study-plans")
async def get_study_plans(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import json
    try:
        query = (
            select(StudentStudyPlan)
            .where(StudentStudyPlan.student_id == current_user["id"])
            .order_by(StudentStudyPlan.created_at.desc())
        )
        res = await db.execute(query)
        plans = res.scalars().all()
        return [
            {
                "id": p.id,
                "subject": p.subject,
                "topics": p.topics,
                "days": p.days,
                "is_active": p.is_active,
                "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else None,
                "plan": json.loads(p.plan_json)
            }
            for p in plans
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch study plans history: {str(e)}"
        )


@router.get("/study-plans/active")
async def get_active_study_plan(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import json
    try:
        query = (
            select(StudentStudyPlan)
            .where(StudentStudyPlan.student_id == current_user["id"])
            .where(StudentStudyPlan.is_active == True)
            .limit(1)
        )
        res = await db.execute(query)
        plan = res.scalars().first()
        if not plan:
            return {"status": "none", "plan": None}
        return {
            "id": plan.id,
            "subject": plan.subject,
            "topics": plan.topics,
            "days": plan.days,
            "is_active": plan.is_active,
            "created_at": plan.created_at.strftime("%Y-%m-%d %H:%M:%S") if plan.created_at else None,
            "plan": json.loads(plan.plan_json)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch active study plan: {str(e)}"
        )


@router.put("/study-plans/{plan_id}/activate")
async def activate_study_plan(
    plan_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import json
    try:
        query = (
            select(StudentStudyPlan)
            .where(StudentStudyPlan.id == plan_id)
            .where(StudentStudyPlan.student_id == current_user["id"])
        )
        res = await db.execute(query)
        plan = res.scalars().first()
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found")
            
        await db.execute(
            update(StudentStudyPlan)
            .where(StudentStudyPlan.student_id == current_user["id"])
            .values(is_active=False)
        )
        
        plan.is_active = True
        await db.flush()
        
        return {
            "status": "success",
            "plan": {
                "id": plan.id,
                "subject": plan.subject,
                "topics": plan.topics,
                "days": plan.days,
                "plan": json.loads(plan.plan_json)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate study plan: {str(e)}"
        )


@router.delete("/study-plans/{plan_id}")
async def delete_study_plan(
    plan_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        query = (
            delete(StudentStudyPlan)
            .where(StudentStudyPlan.id == plan_id)
            .where(StudentStudyPlan.student_id == current_user["id"])
        )
        await db.execute(query)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete study plan: {str(e)}"
        )


@router.post("/study-session")
async def log_study_session(
    req: LogStudySessionRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        session = StudySession(
            student_id=current_user["id"],
            subject=req.subject,
            topic=req.topic,
            day_number=req.day_number,
            duration_seconds=req.duration_seconds,
            video_title=req.video_title
        )
        db.add(session)
        await db.flush()
        return {"status": "success", "session_id": session.id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to log study session: {str(e)}"
        )


@router.get("/study-session/stats")
async def get_study_stats(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        # Retrieve all study sessions for this user
        query = (
            select(StudySession)
            .where(StudySession.student_id == current_user["id"])
            .order_by(StudySession.created_at.desc())
        )
        res = await db.execute(query)
        sessions = res.scalars().all()
        
        total_seconds = sum(s.duration_seconds for s in sessions)
        
        # Group by subject
        subject_stats = {}
        for s in sessions:
            if s.subject not in subject_stats:
                subject_stats[s.subject] = 0
            subject_stats[s.subject] += s.duration_seconds
            
        return {
            "total_seconds": total_seconds,
            "sessions_count": len(sessions),
            "subject_breakdown": subject_stats,
            "recent_sessions": [
                {
                    "id": s.id,
                    "subject": s.subject,
                    "topic": s.topic,
                    "day_number": s.day_number,
                    "duration_seconds": s.duration_seconds,
                    "video_title": s.video_title,
                    "created_at": s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else None
                }
                for s in sessions[:10]
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch study statistics: {str(e)}"
        )


@router.post("/resume-review")
async def resume_review(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    file_bytes = await file.read()
    # Resume can be text or pdf, let's treat it as pdf text extraction
    text = extract_text_from_pdf(file_bytes)
    review = await review_resume(text)
    return review


@router.post("/skill-gap")
async def skill_gap(
    req: SkillGapRequest,
    current_user: dict = Depends(get_current_user),
):
    gap = await analyze_skill_gap(req.skills, req.target_role)
    return gap


@router.post("/interview-prep")
async def interview_prep(
    req: InterviewPrepRequest,
    current_user: dict = Depends(get_current_user),
):
    questions = await generate_interview_questions(req.role, req.company)
    return {"questions": questions}


@router.post("/career-advice")
async def career_advice(
    req: CareerAdviceRequest,
    current_user: dict = Depends(get_current_user),
):
    profile = {
        "skills": req.skills,
        "cgpa": req.cgpa,
        "department": req.department,
    }
    advice = await career_recommendations(profile)
    return advice


@router.get("/chat-history")
async def get_chat_history(
    conversation_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if conversation_id:
        query = (
            select(ChatHistory)
            .where(
                ChatHistory.user_id == current_user["id"],
                ChatHistory.conversation_id == conversation_id
            )
            .order_by(ChatHistory.created_at.asc())
        )
        result = await db.execute(query)
        messages = result.scalars().all()
        return [
            {
                "id": m.id,
                "role": m.role,
                "content": m.message,
                "timestamp": str(m.created_at) if m.created_at else None,
            }
            for m in messages
        ]

    # Group by conversation_id to return list of conversations
    # Fetch only the first message of each conversation to serve as title and creation timestamp (highly efficient)
    subquery = (
        select(
            ChatHistory.conversation_id,
            func.min(ChatHistory.id).label("first_msg_id")
        )
        .where(ChatHistory.user_id == current_user["id"])
        .group_by(ChatHistory.conversation_id)
        .subquery()
    )
    
    query = (
        select(ChatHistory)
        .join(subquery, ChatHistory.id == subquery.c.first_msg_id)
        .order_by(ChatHistory.created_at.desc())
    )
    result = await db.execute(query)
    conversations = result.scalars().all()

    return [
        {
            "id": c.conversation_id,
            "title": c.message[:30] + ("..." if len(c.message) > 30 else ""),
            "createdAt": str(c.created_at) if c.created_at else None,
        }
        for c in conversations
    ]


@router.delete("/chat-history/{conversation_id}")
async def delete_chat_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(ChatHistory).where(
            ChatHistory.conversation_id == conversation_id,
            ChatHistory.user_id == current_user["id"]
        )
    )
    await db.flush()
    return {"message": f"Conversation {conversation_id} deleted successfully"}


class DashboardAssistantItem(BaseModel):
    category: str = Field(description="agenda, alert, task, recommendation")
    title: str
    description: str
    action_url: Optional[str] = None


class DashboardAssistantResponse(BaseModel):
    greeting: str = Field(description="A personalized greeting based on time and status")
    items: List[DashboardAssistantItem]
    motivational_quote: str


import json

@router.get("/dashboard-assistant")
async def get_dashboard_recommendations(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Retrieve campus state context
    context = await get_ai_context(current_user, db)
    
    # Clean/minimize context to stay within token limits
    if "faculty_locator_summary" in context and len(context["faculty_locator_summary"]) > 5000:
        context["faculty_locator_summary"] = context["faculty_locator_summary"][:5000] + "..."

    prompt = f"""You are a helpful Smart Campus Assistant. Analyze this user context:
    {json.dumps(context)}
    
    Generate:
    1. A personalized greeting.
    2. A list of 4-6 dashboard assistant items (agenda, alert, task, or recommendation) tailored to their role.
    3. A motivational quote or action tip.
    
    Return a structured JSON output matching the DashboardAssistantResponse schema.
    """

    from app.services.gemini_service import generate_structured_content_async
    try:
        response_text = await generate_structured_content_async(prompt, DashboardAssistantResponse)
        return json.loads(response_text)
    except Exception as e:
        return {
            "greeting": f"Welcome back, {current_user['name']}!",
            "items": [
                {
                    "category": "agenda",
                    "title": "Welcome",
                    "description": "Have a wonderful day ahead on campus!",
                    "action_url": "/dashboard"
                }
            ],
            "motivational_quote": "Learning is a treasure that will follow its owner everywhere."
        }
