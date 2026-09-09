from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Tuple
from datetime import time

from app.models.user import User, Timetable, TimetableEntry
from app.models.academic import Classroom, Section
from app.models.department import Subject

from app.repositories.timetable_repository import TimetableRepository
from app.repositories.faculty_repository import FacultyRepository
from app.repositories.section_repository import SectionRepository
from app.repositories.subject_repository import SubjectRepository
from app.repositories.classroom_repository import ClassroomRepository

from app.algorithms.backtracking_scheduler import BacktrackingScheduler, ConstraintChecker
from app.dtos.timetable_dto import GenerateTimetableRequest, GenerateTimetableResponse, SectionTimetableReport, TimetableCellEntry, ConflictReportItem

class TransientSubject:
    def __init__(self, id: int, name: str, weekly_hours: int, is_lab: bool, faculty_id: int, semester: int):
        self.id = id
        self.name = name
        self.weekly_hours = weekly_hours
        self.is_lab = is_lab
        self.faculty_id = faculty_id
        self.semester = semester


class TimetableGenerationService:
    @staticmethod
    def get_period_times(period: int) -> Tuple[str, str]:
        """Map period index to standard engineering college time slots."""
        time_slots = {
            1: ("08:30", "09:20"),
            2: ("09:20", "10:10"),
            3: ("10:25", "11:15"),
            4: ("11:15", "12:05"),
            5: ("12:50", "13:40"),
            6: ("13:40", "14:30"),
            7: ("14:30", "15:20")
        }
        return time_slots.get(period, ("09:00", "10:00"))

    @staticmethod
    async def generate(db: AsyncSession, req: GenerateTimetableRequest) -> GenerateTimetableResponse:
        if not req.semester:
            if req.year == "I":
                req.semester = 1
            elif req.year == "II":
                req.semester = 3
            elif req.year == "III":
                req.semester = 5
            elif req.year == "IV":
                req.semester = 7
            else:
                req.semester = 3

        if not req.sections and req.section:
            req.sections = [req.section]
        elif not req.sections:
            req.sections = ["A"]

        # 1. Fetch sections, subjects, classrooms, faculty, leaves
        sections = await SectionRepository.get_sections_by_department_and_semester(db, req.department, req.semester)
        if req.sections:
            sections = [s for s in sections if s.section_name in req.sections]
            
        if not sections:
            # Fallback if no sections in DB
            sect_res = []
            for s_name in req.sections:
                sect_res.append(Section(section_name=s_name, semester=req.semester))
            sections = sect_res

        subjects = await SubjectRepository.get_subjects_by_department_and_semester(db, req.department, req.semester)
        if not subjects:
            # Fallback to general department subjects if semester filter returned empty
            all_dept_subjs = await SubjectRepository.get_all_by_department(db, req.department)
            if all_dept_subjs:
                subjects = all_dept_subjs
            else:
                raise ValueError(f"No subjects found for department '{req.department}' and semester {req.semester}.")

        classrooms = await ClassroomRepository.get_all_active_classrooms(db)
        if not classrooms:
            raise ValueError("No active classrooms available in the campus database.")

        faculties = await FacultyRepository.get_all_faculty_by_department(db, req.department)
        if not faculties:
            # Fallback if empty
            faculties = [User(id=999, name="Prof. General Handled", role="faculty", department=req.department)]

        # Map faculty to subjects if mapping is missing (using round-robin to distribute workloads)
        transient_subjects = []
        fac_count = len(faculties)
        for idx, sub in enumerate(subjects):
            fac_id = sub.faculty_id
            if not fac_id and fac_count > 0:
                fac_id = faculties[idx % fac_count].id
            transient_subjects.append(
                TransientSubject(
                    id=sub.id,
                    name=sub.name,
                    weekly_hours=sub.weekly_hours or 4,
                    is_lab=bool(sub.is_lab),
                    faculty_id=fac_id,
                    semester=req.semester
                )
            )

        leaves = []
        for fac in faculties:
            fac_leaves = await FacultyRepository.get_approved_leaves_by_faculty_id(db, fac.id)
            leaves.extend(fac_leaves)

        # 2. Run Backtracking Scheduler
        scheduler = BacktrackingScheduler(sections, transient_subjects, classrooms, faculties, leaves)
        success = scheduler.solve()
        
        if not success:
            raise ValueError("Backtracking CSP solver failed to find a conflict-free timetable satisfying all hard constraints. Try adjusting workloads or leaves.")

        # 3. Create Draft Timetable Record
        # We will create one Timetable parent record per section
        first_section_name = sections[0].section_name if sections else "A"
        new_tt = await TimetableRepository.create_timetable(db, req.department, first_section_name, req.academic_year)
        # Set is_active to False initially as draft
        new_tt.is_active = False
        db.add(new_tt)
        await db.flush()

        # 4. Save Entries
        db_entries = []
        schedules_report = []
        
        # We parse the schedule matrix of day -> period -> list of assignments
        for day, periods_data in scheduler.schedule.items():
            for period, assignments in periods_data.items():
                for ass in assignments:
                    start_str, end_str = TimetableGenerationService.get_period_times(period)
                    start_time = time(int(start_str.split(":")[0]), int(start_str.split(":")[1]))
                    time_parts = end_str.split(":")
                    end_time = time(int(time_parts[0]), int(time_parts[1]))

                    # Find section object
                    sect_obj = next((s for s in sections if s.section_name == ass["section"]), None)

                    entry = TimetableEntry(
                        timetable_id=new_tt.id,
                        subject=ass["subject_name"],
                        faculty=ass["faculty_name"],
                        room=ass["room_number"],
                        day=day,
                        start_time=start_time,
                        end_time=end_time,
                        faculty_id=ass["faculty_id"],
                        subject_id=ass["subject_id"],
                        semester=req.semester,
                        section=ass["section"],
                        period=period,
                        classroom_id=ass["classroom_id"]
                    )
                    db_entries.append(entry)

        await TimetableRepository.add_entries(db, db_entries)
        await db.commit()

        # 5. Format DTO Schedules Report
        section_schedules: Dict[str, List[TimetableCellEntry]] = {s.section_name: [] for s in sections}
        for entry in db_entries:
            start_str, end_str = TimetableGenerationService.get_period_times(entry.period)
            cell = TimetableCellEntry(
                day=entry.day,
                period=entry.period,
                subject=entry.subject,
                faculty=entry.faculty,
                room=entry.room,
                is_lab=any(kw in entry.subject.lower() for kw in ["lab", "practical", "workshop", "seminar"]),
                start_time=start_str,
                end_time=end_str
            )
            section_schedules[entry.section].append(cell)

        reports_list = []
        for sect_name, cells in section_schedules.items():
            reports_list.append(SectionTimetableReport(section=sect_name, entries=cells))

        # 6. Calculate AI Quality Score & Analytics
        quality_score, conflicts = TimetableGenerationService.calculate_quality_score(scheduler, sections, subjects)

        flat_entries = []
        for r in reports_list:
            for cell in r.entries:
                flat_entries.append({
                    "day": cell.day,
                    "period": cell.period,
                    "subject": cell.subject,
                    "faculty": cell.faculty,
                    "room": cell.room,
                    "start_time": cell.start_time,
                    "end_time": cell.end_time,
                    "section": r.section,
                })

        return GenerateTimetableResponse(
            timetable_id=new_tt.id,
            department=req.department,
            semester=req.semester,
            academic_year=req.academic_year,
            schedules=reports_list,
            entries=flat_entries,
            quality_score=quality_score,
            conflicts=conflicts,
            validation_report=f"Conflict-Free Timetable Generated with {len(db_entries)} periods allocated."
        )

    @staticmethod
    def calculate_quality_score(scheduler: BacktrackingScheduler, sections: List[Any], subjects: List[Any]) -> Tuple[float, List[ConflictReportItem]]:
        score = 100.0
        conflicts = []
        
        # Soft check 1: Balanced subject distribution (minimize duplicate subjects in same day)
        for sect in sections:
            for day in scheduler.days:
                day_subjects = []
                for p in scheduler.periods:
                    assignments = scheduler.schedule[day].get(p, [])
                    for ass in assignments:
                        if ass["section"] == sect.section_name:
                            day_subjects.append(ass["subject_id"])
                
                # Check duplicates
                duplicates = len(day_subjects) - len(set(day_subjects))
                if duplicates > 0:
                    score -= duplicates * 2.0
                    conflicts.append(ConflictReportItem(
                        conflict_type="subject_repetition",
                        details=f"Section {sect.section_name} has repeated subjects on {day}."
                    ))

        # Soft check 2: Mapped Preferred Slots
        total_slots = 0
        preferred_matched = 0
        for day in scheduler.days:
            for p in scheduler.periods:
                assignments = scheduler.schedule[day].get(p, [])
                for ass in assignments:
                    total_slots += 1
                    if ass.get("is_preferred"):
                        preferred_matched += 1

        if total_slots > 0 and preferred_matched < total_slots:
            missing_pref = total_slots - preferred_matched
            score -= min(15.0, missing_pref * 0.5)

        # Soft check 3: Faculty Idle/Gap hours
        for fac in scheduler.faculties:
            for day in scheduler.days:
                active_periods = []
                for p in scheduler.periods:
                    assignments = scheduler.schedule[day].get(p, [])
                    for ass in assignments:
                        if ass["faculty_id"] == fac.id:
                            active_periods.append(p)
                
                if active_periods:
                    first = min(active_periods)
                    last = max(active_periods)
                    for p in range(first, last):
                        if p not in active_periods:
                            score -= 1.0  # Idle hour penalty
                            conflicts.append(ConflictReportItem(
                                conflict_type="faculty_idle_hour",
                                details=f"Faculty {fac.name} has an idle break period {p} on {day}."
                            ))

        score = max(50.0, score)
        return round(score, 1), conflicts

    @staticmethod
    async def publish(db: AsyncSession, timetable_id: int) -> bool:
        stmt = select(Timetable).where(Timetable.id == timetable_id)
        res = await db.execute(stmt)
        tt = res.scalar_one_or_none()
        if not tt:
            return False

        # Deactivate old timetables
        await TimetableRepository.deactivate_previous_timetables(
            db, tt.department, 1, tt.section, tt.year
        )
        
        # Activate this one
        tt.is_active = True
        db.add(tt)
        await db.commit()
        return True

    @staticmethod
    async def get_by_dept_and_sem(db: AsyncSession, department: str, semester: int) -> List[SectionTimetableReport]:
        # Fetch active timetable
        stmt = select(Timetable).where(
            Timetable.department == department,
            Timetable.is_active == True
        )
        res = await db.execute(stmt)
        timetables = res.scalars().all()
        
        reports = []
        for tt in timetables:
            entries = await TimetableRepository.get_entries_by_timetable_id(db, tt.id)
            
            # Map entries by section
            section_entries: Dict[str, List[TimetableCellEntry]] = {}
            for entry in entries:
                if entry.semester == semester:
                    if entry.section not in section_entries:
                        section_entries[entry.section] = []
                    
                    start_str, end_str = TimetableGenerationService.get_period_times(entry.period)
                    cell = TimetableCellEntry(
                        day=entry.day,
                        period=entry.period,
                        subject=entry.subject,
                        faculty=entry.faculty or "N/A",
                        room=entry.room or "N/A",
                        is_lab=any(kw in entry.subject.lower() for kw in ["lab", "practical", "workshop", "seminar"]),
                        start_time=start_str,
                        end_time=end_str
                    )
                    section_entries[entry.section].append(cell)
            
            for sect_name, cells in section_entries.items():
                reports.append(SectionTimetableReport(section=sect_name, entries=cells))
                
        return reports
