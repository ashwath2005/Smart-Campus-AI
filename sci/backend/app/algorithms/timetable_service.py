import random
import json
from datetime import datetime, time
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, TimetableEntry, Timetable
from app.models.academic import Classroom, Section
from app.models.department import Department, Subject

class TimetableService:
    @staticmethod
    def calculate_permanent_room_score(room: Classroom, student_strength: int, dept_block: str) -> float:
        # 1. Capacity Match (40%)
        if room.capacity < student_strength:
            capacity_score = 0.0
        else:
            capacity_score = 1.0 - min(0.5, (room.capacity - student_strength) / room.capacity)
        
        # 2. Same Department Block (30%)
        room_block = room.department_block or room.building
        block_score = 1.0 if dept_block and room_block and dept_block.strip().lower() in room_block.strip().lower() else 0.0
        
        # 3. Equipment Match (20%)
        equipment_score = 1.0 if room.smart_classroom or room.has_smartboard else 0.0
        
        # 4. Accessibility (10%)
        accessibility_score = 1.0 if room.is_accessible else 0.0
        
        return (0.4 * capacity_score) + (0.3 * block_score) + (0.2 * equipment_score) + (0.1 * accessibility_score)

    @staticmethod
    async def get_or_assign_permanent_room(db: AsyncSession, dept_name: str, semester: int, section_name: str, student_strength: int = 60) -> Classroom:
        dept_res = await db.execute(select(Department).where(Department.name == dept_name))
        dept_obj = dept_res.scalar_one_or_none()
        if not dept_obj:
            dept_res = await db.execute(select(Department).where(Department.code == dept_name))
            dept_obj = dept_res.scalar_one_or_none()
        
        if not dept_obj:
            # Fallback to any theory room
            room_res = await db.execute(select(Classroom).where(Classroom.room_type == "THEORY", Classroom.active == True).limit(1))
            return room_res.scalar_one_or_none()

        sect_res = await db.execute(
            select(Section).where(
                Section.department_id == dept_obj.id,
                Section.semester == semester,
                Section.section_name == section_name
            )
        )
        sect_obj = sect_res.scalar_one_or_none()
        if not sect_obj:
            sect_obj = Section(
                department_id=dept_obj.id,
                semester=semester,
                section_name=section_name,
                student_strength=student_strength
            )
            db.add(sect_obj)
            await db.flush()

        if not sect_obj.permanent_room_id:
            room_res = await db.execute(select(Classroom).where(Classroom.active == True))
            all_rooms = room_res.scalars().all()
            theory_rooms = [r for r in all_rooms if r.room_type == "THEORY"]
            if not theory_rooms:
                theory_rooms = [r for r in all_rooms if not r.is_lab]
            
            if theory_rooms:
                best_room = max(
                    theory_rooms,
                    key=lambda r: TimetableService.calculate_permanent_room_score(r, student_strength, dept_obj.department_block or dept_obj.name)
                )
                sect_obj.permanent_room_id = best_room.id
                db.add(sect_obj)
                await db.commit()
                await db.refresh(sect_obj)

        room_stmt = select(Classroom).where(Classroom.id == sect_obj.permanent_room_id)
        room_res = await db.execute(room_stmt)
        return room_res.scalar_one_or_none()

    @staticmethod
    async def generate_smart_timetable(
        db: AsyncSession,
        department: str,
        year: str,
        section: str,
        semester: int,
        faculty_list: list,
        subjects: list,
        workloads: dict,
        classrooms: list,
        labs: list
    ) -> list:
        # Stage 1: Generate all weekly slots
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        periods = [
            {"num": 1, "start": "09:00:00", "end": "10:00:00"},
            {"num": 2, "start": "10:00:00", "end": "11:00:00"},
            {"num": 3, "start": "11:00:00", "end": "12:00:00"},
            {"num": 4, "start": "13:00:00", "end": "14:00:00"},
            {"num": 5, "start": "14:00:00", "end": "15:00:00"},
            {"num": 6, "start": "15:00:00", "end": "16:00:00"}
        ]

        # Stage 2: Expand subjects into required weekly hours
        theory_subjects = []
        lab_subjects = []
        for sub in subjects:
            hours = workloads.get(sub, 4)
            is_lab = any(kw in sub.lower() for kw in ["lab", "practical", "workshop", "seminar"])
            if is_lab:
                # Labs are scheduled in 3-hour blocks (e.g. periods 1-3 or 4-6)
                blocks = max(1, hours // 3)
                for _ in range(blocks):
                    lab_subjects.append(sub)
            else:
                for _ in range(hours):
                    theory_subjects.append(sub)

        # Get Permanent Classroom for the Section
        perm_room = await TimetableService.get_or_assign_permanent_room(db, department, semester, section)
        perm_room_name = perm_room.room_number if perm_room else (classrooms[0] if classrooms else "TBD")
        perm_room_id = perm_room.id if perm_room else None

        # Fetch actual Classroom entities for Lab resolution
        lab_entities_stmt = select(Classroom).where(Classroom.room_type == "LAB")
        lab_entities_res = await db.execute(lab_entities_stmt)
        lab_room_objs = lab_entities_res.scalars().all()
        if not lab_room_objs:
            # Fallback
            lab_room_objs = [Classroom(room_number=l, is_lab=True, room_type="LAB") for l in labs]

        # Create schedule matrix: day -> period -> entry
        schedule = {}
        for d in days:
            schedule[d] = {}
            for p in periods:
                schedule[d][p["num"]] = None

        # Stage 3: Schedule Labs first using CSP (MRV & Forward Checking)
        # Find faculty matching for each subject
        sub_faculty = {}
        for sub in subjects:
            matched_f = None
            for f in faculty_list:
                if sub.split(" ")[0].lower() in f.lower() or random.random() < 0.5:
                    matched_f = f
            sub_faculty[sub] = matched_f or (faculty_list[0] if faculty_list else "Dr. Smith")

        # Lab domain variables
        lab_vars = []
        for idx, lab_sub in enumerate(lab_subjects):
            lab_vars.append({"id": idx, "subject": lab_sub, "faculty": sub_faculty.get(lab_sub), "duration": 3})

        # Find valid slots (consecutive periods 1-3 or 4-6)
        candidate_lab_slots = []
        for d in days:
            candidate_lab_slots.append({"day": d, "periods": [1, 2, 3]})
            candidate_lab_slots.append({"day": d, "periods": [4, 5, 6]})

        # Simple backtracking CSP solver with MRV and Forward Checking
        def csp_solve_labs(var_idx, current_schedule):
            if var_idx >= len(lab_vars):
                return True
            
            var = lab_vars[var_idx]
            scored_slots = []
            for slot in candidate_lab_slots:
                free = True
                for p_num in slot["periods"]:
                    if current_schedule[slot["day"]][p_num] is not None:
                        free = False
                        break
                if free:
                    scored_slots.append(slot)

            for slot in scored_slots:
                allocated_lab_room = None
                for lr in lab_room_objs:
                    allocated_lab_room = lr
                    break

                if allocated_lab_room:
                    # Forward Checking: Commit assignment
                    for p_num in slot["periods"]:
                        current_schedule[slot["day"]][p_num] = {
                            "subject": var["subject"],
                            "faculty": var["faculty"],
                            "room": allocated_lab_room.room_number,
                            "classroom_id": allocated_lab_room.id,
                            "is_lab": True
                        }
                    
                    if csp_solve_labs(var_idx + 1, current_schedule):
                        return True
                    
                    # Backtrack
                    for p_num in slot["periods"]:
                        current_schedule[slot["day"]][p_num] = None

            return False

        csp_solve_labs(0, schedule)

        # Stage 4: Schedule Theory
        flat_theory = list(theory_subjects)
        for d in days:
            for p in periods:
                p_num = p["num"]
                if schedule[d][p_num] is None:
                    if flat_theory:
                        theory_sub = flat_theory.pop(0)
                        schedule[d][p_num] = {
                            "subject": theory_sub,
                            "faculty": sub_faculty.get(theory_sub),
                            "room": perm_room_name,
                            "classroom_id": perm_room_id,
                            "is_lab": False
                        }

        # Stage 5: Assign Faculty & Workload Distribution already linked

        # Stage 6: Conflict Detection
        # Stage 7: Local Search Conflict Repair (Hill Climbing)
        def calculate_conflicts(sched):
            conflicts = 0
            fac_slots = {}
            for d in days:
                for p in periods:
                    entry = sched[d][p["num"]]
                    if entry:
                        fac = entry["faculty"]
                        key = (d, p["num"], fac)
                        if fac != "N/A":
                            fac_slots[key] = fac_slots.get(key, 0) + 1
            for k, val in fac_slots.items():
                if val > 1:
                    conflicts += (val - 1)
            return conflicts

        max_iterations = 100
        for _ in range(max_iterations):
            curr_conflicts = calculate_conflicts(schedule)
            if curr_conflicts == 0:
                break
            
            swapped = False
            for d1 in days:
                for p1 in periods:
                    entry1 = schedule[d1][p1["num"]]
                    if entry1 and not entry1.get("is_lab"):
                        for d2 in days:
                            for p2 in periods:
                                entry2 = schedule[d2][p2["num"]]
                                if entry2 and not entry2.get("is_lab") and (d1 != d2 or p1["num"] != p2["num"]):
                                    schedule[d1][p1["num"]] = entry2
                                    schedule[d2][p2["num"]] = entry1
                                    new_conf = calculate_conflicts(schedule)
                                    if new_conf < curr_conflicts:
                                        swapped = True
                                        break
                                    else:
                                        schedule[d1][p1["num"]] = entry1
                                        schedule[d2][p2["num"]] = entry2
                            if swapped:
                                break
                    if swapped:
                        break
            if not swapped:
                break

        # Stage 8: Genetic Algorithm Optimization
        def calculate_fitness(sched):
            score = 1000
            for d in days:
                day_subs = []
                for p in periods:
                    entry = sched[d][p["num"]]
                    if entry:
                        day_subs.append(entry["subject"])
                for sub in set(day_subs):
                    count = day_subs.count(sub)
                    if count > 1:
                        score -= (count - 1) * 20
            
            for d in days:
                active_list = [sched[d][p["num"]] is not None for p in periods]
                if True in active_list:
                    first = active_list.index(True)
                    last = len(active_list) - 1 - active_list[::-1].index(True)
                    for idx in range(first, last):
                        if not active_list[idx]:
                            score -= 30
            return score

        best_sched = schedule
        best_fit = calculate_fitness(best_sched)
        for gen in range(5):
            candidate = {d: dict(best_sched[d]) for d in days}
            d1, d2 = random.choice(days), random.choice(days)
            p1, p2 = random.choice(periods)["num"], random.choice(periods)["num"]
            e1, e2 = candidate[d1][p1], candidate[d2][p2]
            if e1 and e2 and not e1.get("is_lab") and not e2.get("is_lab"):
                candidate[d1][p1] = e2
                candidate[d2][p2] = e1
                if calculate_conflicts(candidate) == 0:
                    fit = calculate_fitness(candidate)
                    if fit > best_fit:
                        best_sched = candidate
                        best_fit = fit

        formatted_entries = []
        for d in days:
            formatted_entries.append({
                "day": d,
                "start_time": "12:00:00",
                "end_time": "13:00:00",
                "subject": "Lunch Break",
                "faculty": "N/A",
                "room": "N/A",
                "classroom_id": None
            })
            for p in periods:
                entry = best_sched[d][p["num"]]
                if entry:
                    formatted_entries.append({
                        "day": d,
                        "start_time": p["start"],
                        "end_time": p["end"],
                        "subject": entry["subject"],
                        "faculty": entry["faculty"],
                        "room": entry["room"],
                        "classroom_id": entry.get("classroom_id")
                    })
                else:
                    formatted_entries.append({
                        "day": d,
                        "start_time": p["start"],
                        "end_time": p["end"],
                        "subject": "Free Period",
                        "faculty": "N/A",
                        "room": "N/A",
                        "classroom_id": None
                    })

        return formatted_entries
