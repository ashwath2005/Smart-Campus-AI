import json
import random
import math
from datetime import time, datetime, date
from sqlalchemy import select, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, TimetableEntry, Timetable
from app.models.academic import Classroom, ClassroomAllocation, ReallocationLog, Section
from app.models.attendance import Attendance
from app.models.department import Department

# Building coordinates for movement walking distance optimization (1 unit = 150 meters)
BUILDING_COORDS = {
    "CS Block": (0, 0),
    "ECE Block": (1, 1),
    "ME Block": (2, 2),
    "IT Block": (0, 2),
    "Admin Block": (1, 0),
    "Science Block": (2, 0),
    "Default": (0, 0)
}

# Modular suitability scoring weights
DEFAULT_WEIGHTS = {
    "capacity_fitness": 0.15,
    "equipment_compatibility": 0.15,
    "location_preference": 0.10,
    "department_affinity": 0.10,
    "accessibility": 0.08,
    "predicted_occupancy_match": 0.12,
    "future_availability": 0.10,
    "classroom_health": 0.10,
    "energy_efficiency": 0.05,
    "movement_penalty": 0.15
}

def time_to_mins(t) -> int:
    if isinstance(t, str):
        parts = t.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    elif isinstance(t, time):
        return t.hour * 60 + t.minute
    return 0


class PredictiveOccupancyEngine:
    """Predicts actual student attendance based on history, subject popularity, time, and faculty."""
    
    @staticmethod
    async def predict_occupancy(
        db: AsyncSession,
        subject: str,
        faculty: str,
        department: str,
        semester: int,
        section: str,
        day: str,
        start_time: str,
        registered_students: int
    ) -> dict:
        # Fallback values if database attendance is empty
        historical_rate = 0.85
        confidence = 0.80
        
        # 1. Historical attendance for this subject/group
        try:
            # Select present vs absent status count
            q = select(
                func.count(Attendance.id),
                func.sum(func.case((Attendance.status == "present", 1), else_=0))
            ).where(
                Attendance.subject == subject
            )
            res = await db.execute(q)
            total, present = res.one_or_none() or (0, 0)
            if total > 0 and present is not None:
                historical_rate = float(present) / float(total)
                confidence = min(0.98, 0.70 + (total / 500.0) * 0.28) # confidence grows with sample size
        except Exception:
            pass

        # 2. Time-slot patterns
        # Morning slots (9:00 - 11:00) generally have ~92% attendance
        # Midday/Lunch-adjacent slots (11:00 - 14:00) have ~82% attendance
        # Late afternoon slots (after 15:00) have ~75% attendance
        mins = time_to_mins(start_time)
        time_factor = 1.0
        if mins < 660: # before 11:00 AM
            time_factor = 1.05
        elif mins >= 900: # after 3:00 PM
            time_factor = 0.88
        else:
            time_factor = 0.96

        # 3. Faculty attendance influence
        # Faculty popularity or teaching history attendance levels (mocked or retrieved)
        faculty_hash = hash(faculty or "") % 10
        faculty_factor = 0.95 + (faculty_hash / 100.0) # range 0.95 - 1.05

        # 4. Day of week pattern (Fridays/Saturdays have slightly lower attendance)
        day_factor = 1.0
        if day.lower() in ["friday", "saturday"]:
            day_factor = 0.90

        # Calculate expected rate
        predicted_rate = min(1.0, max(0.5, historical_rate * time_factor * faculty_factor * day_factor))
        expected_occupancy = int(registered_students * predicted_rate)
        
        return {
            "expected_occupancy": expected_occupancy,
            "occupancy_rate": round(predicted_rate, 2),
            "confidence_score": round(confidence, 2),
            "factors": {
                "historical_subject_rate": round(historical_rate, 2),
                "time_slot_modifier": round(time_factor, 2),
                "faculty_influence": round(faculty_factor, 2),
                "weekday_modifier": round(day_factor, 2)
            }
        }


class ClassroomHealthIndexCalculator:
    """Calculates the Classroom Health Index (CHI) metric for classroom selection."""
    
    @staticmethod
    def calculate_chi(room: Classroom) -> dict:
        if room.maintenance_status == "maintenance":
            return {"score": 0.0, "status": "Needs Maintenance", "metrics": {}}
        elif room.maintenance_status == "inactive":
            return {"score": 0.0, "status": "Inactive", "metrics": {}}

        # Base weights for health score
        # projector_health, smartboard_health, internet_health, ac_health, complaints
        p_health = getattr(room, "projector_health", 100.0) or 100.0
        s_health = getattr(room, "smartboard_health", 100.0) or 100.0
        i_health = getattr(room, "internet_health", 100.0) or 100.0
        a_health = getattr(room, "ac_health", 100.0) or 100.0
        complaints = getattr(room, "complaint_count", 0) or 0
        
        # Weighted aggregate
        score = (
            p_health * 0.25 +
            s_health * 0.25 +
            i_health * 0.25 +
            a_health * 0.25
        )
        
        # Deduct for complaints
        score = max(0.0, score - (complaints * 8.0))
        
        if score >= 90.0:
            status = "Excellent"
        elif score >= 75.0:
            status = "Good"
        elif score >= 50.0:
            status = "Average"
        else:
            status = "Needs Maintenance"
            
        return {
            "score": round(score, 2),
            "status": status,
            "metrics": {
                "projector": p_health,
                "smartboard": s_health,
                "internet": i_health,
                "air_conditioning": a_health,
                "complaints_count": complaints
            }
        }


class MovementOptimizer:
    """Calculates student and faculty walking distances between consecutive rooms."""

    @staticmethod
    def calculate_walking_distance(room1: Classroom, room2: Classroom) -> float:
        if not room1 or not room2:
            return 0.0
        c1 = BUILDING_COORDS.get(room1.building, BUILDING_COORDS["Default"])
        c2 = BUILDING_COORDS.get(room2.building, BUILDING_COORDS["Default"])
        
        # horizontal Euclidean distance (1 unit = 150m)
        horiz = math.sqrt((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2) * 150.0
        
        # vertical floor distance (1 floor = 20m)
        if room1.building == room2.building:
            vert = abs(room1.floor - room2.floor) * 20.0
        else:
            vert = (room1.floor + room2.floor) * 20.0 # go down to ground, change building, go up
            
        return horiz + vert

    @staticmethod
    async def get_previous_and_next_rooms(
        db: AsyncSession,
        timetable_id: int,
        day: str,
        start_time: str,
        end_time: str,
        section: str,
        faculty: str
    ) -> dict:
        # Returns the previous and next scheduled rooms for this class section and faculty
        # to calculate transition movement metrics.
        prev_room = None
        next_room = None
        
        curr_start = time_to_mins(start_time)
        curr_end = time_to_mins(end_time)

        # 1. Fetch other entries on the same day for this timetable / section
        stmt = select(TimetableEntry).where(
            TimetableEntry.timetable_id == timetable_id,
            TimetableEntry.day == day
        )
        res = await db.execute(stmt)
        entries = res.scalars().all()
        
        # Find entries that occur right before or right after
        for e in entries:
            e_start = time_to_mins(e.start_time)
            e_end = time_to_mins(e.end_time)
            
            # Consecutive class before
            if e_end <= curr_start:
                if not prev_room or e_end > time_to_mins(prev_room.get("end_time", "00:00")):
                    prev_room = {"room": e.room, "end_time": e.end_time.strftime("%H:%M")}
            
            # Consecutive class after
            if e_start >= curr_end:
                if not next_room or e_start < time_to_mins(next_room.get("start_time", "23:59")):
                    next_room = {"room": e.room, "start_time": e.start_time.strftime("%H:%M")}

        # 2. Same for faculty movement (they might teach another section in a different room)
        fac_prev_room = None
        if faculty:
            fac_stmt = select(TimetableEntry).join(Timetable).where(
                Timetable.is_active == True,
                TimetableEntry.faculty == faculty,
                TimetableEntry.day == day,
                Timetable.id != timetable_id
            )
            fac_res = await db.execute(fac_stmt)
            fac_entries = fac_res.scalars().all()
            for e in fac_entries:
                e_start = time_to_mins(e.start_time)
                e_end = time_to_mins(e.end_time)
                if e_end <= curr_start:
                    if not fac_prev_room or e_end > time_to_mins(fac_prev_room.get("end_time", "00:00")):
                        fac_prev_room = {"room": e.room, "end_time": e.end_time.strftime("%H:%M")}

        return {
            "student_prev": prev_room,
            "student_next": next_room,
            "faculty_prev": fac_prev_room
        }


class FutureConflictPredictor:
    """Predicts whether booking a room now will cause conflicts in subsequent periods."""

    @staticmethod
    async def predict_future_conflict(
        db: AsyncSession,
        classroom_id: int,
        day: str,
        start_time: str,
        end_time: str,
        department: str
    ) -> float:
        # Check if this classroom is a high-demand room or has lab requirements coming up
        curr_end_mins = time_to_mins(end_time)
        
        # Look ahead 4 hours on the same day
        lookahead_end = curr_end_mins + 240
        
        # Query active entries in this classroom during lookahead window
        stmt = select(TimetableEntry, Timetable).join(Timetable).where(
            Timetable.is_active == True,
            TimetableEntry.day == day,
            TimetableEntry.room != None
        )
        res = await db.execute(stmt)
        entries = res.all()
        
        conflict_score = 0.0
        overlapping_classes = 0
        
        # Find entries that occur in this classroom shortly after
        for e, t in entries:
            e_start = time_to_mins(e.start_time)
            if curr_end_mins <= e_start <= lookahead_end:
                # If there's an upcoming lab class or CSE core class, conflict risk is higher
                overlapping_classes += 1
                weight = 1.0
                if "lab" in e.subject.lower():
                    weight = 1.5 # high priority to free labs for labs
                if t.department == department:
                    weight *= 0.8 # lower penalty if same department (clustering is good)
                conflict_score += 15.0 * weight

        return min(100.0, conflict_score)


class SuitabilityIndexCalculator:
    """Combines CHI, movement penalties, predicted occupancy, and availability into a single score."""

    @staticmethod
    def calculate_suitability(
        room: Classroom,
        chi: dict,
        class_size: int,
        predicted_occupancy: int,
        needs_lab: bool,
        subject: str,
        department: str,
        student_distance: float,
        faculty_distance: float,
        future_conflict_score: float,
        weights: dict = None
    ) -> dict:
        if not weights:
            weights = DEFAULT_WEIGHTS

        # 1. Capacity Fitness (Perfect fit = 100, Too small = 0, Too large = penalty for waste)
        if room.capacity < class_size:
            capacity_score = 0.0  # Violation (filtered out usually, but here for score robustness)
        else:
            diff = room.capacity - class_size
            if diff == 0:
                capacity_score = 100.0
            elif diff <= 10:
                capacity_score = 95.0
            elif diff <= 25:
                capacity_score = 80.0
            else:
                capacity_score = max(40.0, 100.0 - diff * 1.2) # resource waste penalty

        # 2. Equipment Compatibility
        equipment_score = 100.0
        if needs_lab and not room.is_lab:
            equipment_score = 0.0
        elif not needs_lab and room.is_lab:
            equipment_score = 60.0 # labs can hold normal lectures but not preferred
            
        if not room.has_projector and "lecture" in subject.lower():
            equipment_score -= 30.0
            
        if room.has_smartboard:
            equipment_score += 10.0 # bonus for smart board
        equipment_score = min(100.0, max(0.0, equipment_score))

        # 3. Location Preference / Department Affinity
        # If room building matches department block
        dept_building_map = {
            "CSE": "CS Block",
            "ECE": "ECE Block",
            "ME": "ME Block",
            "IT": "IT Block"
        }
        target_building = dept_building_map.get(department.upper(), "CS Block")
        if room.building == target_building:
            location_score = 100.0
            affinity_score = 100.0
        else:
            location_score = 60.0
            affinity_score = 50.0

        # 4. Accessibility
        accessibility_score = 100.0 if room.is_accessible else 40.0

        # 5. Predicted Occupancy Match
        # Fits predicted occupancy closer to capacity
        occ_diff = room.capacity - predicted_occupancy
        if occ_diff < 0:
            occupancy_match_score = 0.0
        else:
            occupancy_match_score = max(50.0, 100.0 - (occ_diff * 1.0))

        # 6. Future Availability
        availability_score = max(0.0, 100.0 - future_conflict_score)

        # 7. Classroom Health Score
        health_score = chi["score"]

        # 8. Energy Efficiency
        energy_rating = getattr(room, "energy_efficiency_rating", 5.0)
        if energy_rating is None:
            energy_rating = 5.0
        energy_score = (energy_rating / 5.0) * 100.0

        # 9. Movement Penalty (Student & Faculty Transition distance)
        # Assumes max walking distance of 400m before scoring 0
        student_move_score = max(0.0, 100.0 - (student_distance / 4.0))
        faculty_move_score = max(0.0, 100.0 - (faculty_distance / 4.0))
        movement_score = (student_move_score * 0.6) + (faculty_move_score * 0.4)

        # Weighted Aggregate Score
        weighted_score = (
            capacity_score * weights["capacity_fitness"] +
            equipment_score * weights["equipment_compatibility"] +
            location_score * weights["location_preference"] +
            affinity_score * weights["department_affinity"] +
            accessibility_score * weights["accessibility"] +
            occupancy_match_score * weights["predicted_occupancy_match"] +
            availability_score * weights["future_availability"] +
            health_score * weights["classroom_health"] +
            energy_score * weights["energy_efficiency"] +
            movement_score * weights["movement_penalty"]
        )

        return {
            "score": round(weighted_score, 1),
            "breakdown": {
                "capacity_fitness": round(capacity_score, 1),
                "equipment_compatibility": round(equipment_score, 1),
                "location_preference": round(location_score, 1),
                "department_affinity": round(affinity_score, 1),
                "accessibility": round(accessibility_score, 1),
                "predicted_occupancy_match": round(occupancy_match_score, 1),
                "future_availability": round(availability_score, 1),
                "classroom_health": round(health_score, 1),
                "energy_efficiency": round(energy_score, 1),
                "movement_optimization": round(movement_score, 1)
            }
        }


class DCRA_Algorithm:
    """Executive class running the DCRA+ algorithm for timetable classroom allocation."""

    @staticmethod
    def calculate_permanent_room_score(room: Classroom, student_strength: int, dept_block: str) -> float:
        # 1. Capacity Match (40%)
        if not room.capacity or room.capacity <= 0 or room.capacity < student_strength:
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
    async def allocate_room_for_entry(
        db: AsyncSession,
        timetable_id: int,
        subject: str,
        faculty: str,
        department: str,
        year: str,
        section: str,
        day: str,
        start_time: str,
        end_time: str,
        current_allocations_batch: list = None,
        weights: dict = None
    ) -> dict:
        # Fallback values
        if not current_allocations_batch:
            current_allocations_batch = []

        # 1. Fetch Classrooms from DB
        stmt = select(Classroom)
        res = await db.execute(stmt)
        all_rooms = res.scalars().all()
        
        if not all_rooms:
            # Return TBD if no classrooms loaded
            return {
                "room": "TBD",
                "suitability_score": 0.0,
                "predicted_occupancy": 50,
                "explanation": "No classrooms loaded in database.",
                "candidate_rooms": []
            }

        # 2. Count registered students for capacity
        # map year I -> sem 1/2, II -> sem 3/4, etc.
        year_sems = {"I": [1, 2], "II": [3, 4], "III": [5, 6], "IV": [7, 8]}
        sems = year_sems.get(year, [1, 2])
        
        stud_stmt = select(func.count(User.id)).where(
            User.role == "student",
            User.department == department,
            User.section == section,
            User.semester.in_(sems)
        )
        stud_res = await db.execute(stud_stmt)
        class_size = stud_res.scalar() or 0
        if class_size == 0:
            class_size = 45 # default fallback size

        # 3. Determine if Lab required
        needs_lab = any(kw in subject.lower() for kw in ["lab", "practical", "workshop", "seminar"])

        # Permanent Classroom Architecture resolution for Theory classes
        if not needs_lab:
            dept_res = await db.execute(select(Department).where(Department.name == department))
            dept_obj = dept_res.scalar_one_or_none()
            if dept_obj:
                # Find or create Section
                sect_res = await db.execute(
                    select(Section).where(
                        Section.department_id == dept_obj.id,
                        Section.semester == sems[0],
                        Section.section_name == section
                    )
                )
                section_obj = sect_res.scalar_one_or_none()
                if not section_obj:
                    section_obj = Section(
                        department_id=dept_obj.id,
                        semester=sems[0],
                        section_name=section,
                        student_strength=class_size
                    )
                    db.add(section_obj)
                    await db.flush()

                # Auto-assign permanent classroom if empty
                if not section_obj.permanent_room_id:
                    theory_rooms = [r for r in all_rooms if r.room_type == "THEORY" and r.active]
                    if not theory_rooms:
                        theory_rooms = [r for r in all_rooms if not r.is_lab]
                    if theory_rooms:
                        best_room = max(
                            theory_rooms,
                            key=lambda r: DCRA_Algorithm.calculate_permanent_room_score(r, class_size, dept_obj.department_block or dept_obj.name)
                        )
                        section_obj.permanent_room_id = best_room.id
                        db.add(section_obj)
                        await db.commit()
                        await db.refresh(section_obj)

                if section_obj.permanent_room_id:
                    perm_room = next((r for r in all_rooms if r.id == section_obj.permanent_room_id), None)
                    if perm_room:
                        return {
                            "room": perm_room.room_number,
                            "classroom_id": perm_room.id,
                            "suitability_score": 100.0,
                            "predicted_occupancy": class_size,
                            "occupancy_confidence": 1.0,
                            "student_movement_distance": 0.0,
                            "faculty_movement_distance": 0.0,
                            "explanation": json.dumps({
                                "capacity_match": "100%",
                                "equipment_compatibility": "100%",
                                "movement_score": "Locked",
                                "predicted_occupancy": f"{class_size} students",
                                "future_conflict_risk": "None (Permanent)",
                                "classroom_health": "100%",
                                "overall_suitability": "Locked Permanent Classroom"
                            }),
                            "candidate_rooms": []
                        }

        # 4. Predict Occupancy
        pred_data = await PredictiveOccupancyEngine.predict_occupancy(
            db, subject, faculty, department, sems[0], section, day, start_time, class_size
        )
        pred_occ = pred_data["expected_occupancy"]

        # 5. Fetch transition contexts for walking distance
        transition_info = await MovementOptimizer.get_previous_and_next_rooms(
            db, timetable_id, day, start_time, end_time, section, faculty
        )

        candidates = []
        for room in all_rooms:
            # STEP 1: Constraint Filtering
            if room.maintenance_status in ["maintenance", "inactive"]:
                continue
            if room.capacity < class_size:
                continue
            
            # Check availability
            # 2a. Active DB conflicts (excluding current timetable's entries)
            conflict_stmt = select(TimetableEntry).join(Timetable).where(
                Timetable.is_active == True,
                Timetable.id != timetable_id,
                TimetableEntry.day == day,
                TimetableEntry.room == room.room_number
            )
            conflict_res = await db.execute(conflict_stmt)
            db_conflicts = conflict_res.scalars().all()
            
            room_busy = False
            curr_start_mins = time_to_mins(start_time)
            curr_end_mins = time_to_mins(end_time)
            
            for c in db_conflicts:
                c_start = time_to_mins(c.start_time)
                c_end = time_to_mins(c.end_time)
                if max(curr_start_mins, c_start) < min(curr_end_mins, c_end):
                    room_busy = True
                    break
                    
            if room_busy:
                continue

            # 2b. Check current batch allocations to avoid double-booking in this same timetable
            batch_busy = False
            for allocated in current_allocations_batch:
                if allocated.get("room") == room.room_number and allocated.get("day") == day:
                    a_start = time_to_mins(allocated.get("start_time"))
                    a_end = time_to_mins(allocated.get("end_time"))
                    if max(curr_start_mins, a_start) < min(curr_end_mins, a_end):
                        batch_busy = True
                        break
            if batch_busy:
                continue

            # STEP 2: Predictive Occupancy and CHI Calculations
            chi = ClassroomHealthIndexCalculator.calculate_chi(room)
            
            # Transition walking distances
            stud_dist = 0.0
            fac_dist = 0.0
            
            # Student movement
            stud_prev_room_name = transition_info["student_prev"]["room"] if transition_info["student_prev"] else None
            # If we already allocated the previous room in this batch, check that
            if not stud_prev_room_name:
                # Find class slot before current time in this batch
                latest_end = 0
                for allocated in current_allocations_batch:
                    if allocated.get("day") == day:
                        a_end = time_to_mins(allocated.get("end_time"))
                        if a_end <= curr_start_mins and a_end > latest_end:
                            latest_end = a_end
                            stud_prev_room_name = allocated.get("room")
                            
            if stud_prev_room_name:
                prev_room_obj = next((r for r in all_rooms if r.room_number == stud_prev_room_name), None)
                if prev_room_obj:
                    stud_dist = MovementOptimizer.calculate_walking_distance(prev_room_obj, room)
                    
            # Faculty movement
            fac_prev_room_name = transition_info["faculty_prev"]["room"] if transition_info["faculty_prev"] else None
            if fac_prev_room_name:
                prev_fac_room_obj = next((r for r in all_rooms if r.room_number == fac_prev_room_name), None)
                if prev_fac_room_obj:
                    fac_dist = MovementOptimizer.calculate_walking_distance(prev_fac_room_obj, room)

            # Future Conflict scoring
            fut_conflict = await FutureConflictPredictor.predict_future_conflict(
                db, room.id, day, start_time, end_time, department
            )

            # STEP 3: Suitability index calculation
            suitability = SuitabilityIndexCalculator.calculate_suitability(
                room, chi, class_size, pred_occ, needs_lab, subject, department,
                stud_dist, fac_dist, fut_conflict, weights
            )
            
            candidates.append({
                "id": room.id,
                "room_number": room.room_number,
                "building": room.building,
                "capacity": room.capacity,
                "score": suitability["score"],
                "breakdown": suitability["breakdown"],
                "chi_status": chi["status"],
                "student_movement_distance": stud_dist,
                "faculty_movement_distance": fac_dist,
                "predicted_occupancy": pred_occ
            })

        if not candidates:
            # If no conflict-free candidates, return TBD or a fallback
            return {
                "room": "TBD",
                "classroom_id": None,
                "suitability_score": 0.0,
                "predicted_occupancy": pred_occ,
                "explanation": "No available classrooms satisfy mandatory constraint checks.",
                "candidate_rooms": []
            }

        # Sort candidates by score descending
        candidates.sort(key=lambda x: x["score"], reverse=True)
        best = candidates[0]
        
        # Build explainable AI response
        explanation = {
            "capacity_match": f"{round((class_size / best['capacity'])*100, 1)}% ({class_size} students in room capacity {best['capacity']})",
            "equipment_compatibility": f"100% Match (Lab room for Lab Subject)" if needs_lab else f"100% Match (Lecture Room)",
            "movement_score": "Excellent" if best["student_movement_distance"] < 50.0 else "Good" if best["student_movement_distance"] < 150.0 else "Average",
            "predicted_occupancy": f"{best['predicted_occupancy']} students predicted ({int(pred_data['occupancy_rate']*100)}% attendance rate)",
            "future_conflict_risk": "Low" if best["breakdown"]["future_availability"] > 80.0 else "Medium" if best["breakdown"]["future_availability"] > 50.0 else "High",
            "classroom_health": f"{best['breakdown']['classroom_health']}% ({best['chi_status']})",
            "overall_suitability": f"{best['score']}% - Highest score candidate"
        }

        return {
            "room": best["room_number"],
            "classroom_id": best["id"],
            "suitability_score": best["score"],
            "predicted_occupancy": best["predicted_occupancy"],
            "occupancy_confidence": pred_data["confidence_score"],
            "student_movement_distance": best["student_movement_distance"],
            "faculty_movement_distance": best["faculty_movement_distance"],
            "explanation": json.dumps(explanation),
            "candidate_rooms": candidates[:5] # top 5 candidates
        }


class DynamicReallocationEngine:
    """Handles dynamic real-time triggers and event-driven classroom reallocations."""

    @staticmethod
    async def trigger_reallocation(
        db: AsyncSession,
        event_type: str,  # "maintenance", "faculty_leave", "locked", "emergency"
        target_id: int,   # classroom_id or timetable_entry_id
        details: str = ""
    ) -> list:
        reallocated_slots = []
        
        # Get active timetables and their entries
        if event_type == "maintenance" or event_type == "locked" or event_type == "emergency":
            # Classroom is going offline. Reallocate all affected active timetable entries in this room.
            c_res = await db.execute(select(Classroom).where(Classroom.id == target_id))
            room = c_res.scalar_one_or_none()
            if not room:
                return []
                
            # If emergency/maintenance, update database classroom status
            if event_type == "maintenance":
                room.maintenance_status = "maintenance"
            elif event_type == "locked" or event_type == "emergency":
                room.maintenance_status = "inactive"
            await db.flush()

            # Find all active entries currently in this room number
            stmt = select(TimetableEntry, Timetable).join(Timetable).where(
                Timetable.is_active == True,
                TimetableEntry.room == room.room_number
            )
            res = await db.execute(stmt)
            affected_entries = res.all()
            
            for entry, tt in affected_entries:
                prev_room = entry.room
                
                # Perform DCRA+ reallocation for this slot
                alloc = await DCRA_Algorithm.allocate_room_for_entry(
                    db,
                    timetable_id=tt.id,
                    subject=entry.subject,
                    faculty=entry.faculty,
                    department=tt.department,
                    year=tt.year,
                    section=tt.section,
                    day=entry.day,
                    start_time=entry.start_time.strftime("%H:%M"),
                    end_time=entry.end_time.strftime("%H:%M")
                )
                
                # Update room in timetable entry
                entry.room = alloc["room"]
                
                # Update/Create ClassroomAllocation
                new_room_obj = None
                if alloc["room"] != "TBD":
                    r_res = await db.execute(select(Classroom).where(Classroom.room_number == alloc["room"]))
                    new_room_obj = r_res.scalar_one_or_none()
                
                if new_room_obj:
                    # Update or insert allocation record
                    ca_stmt = select(ClassroomAllocation).where(ClassroomAllocation.timetable_entry_id == entry.id)
                    ca_res = await db.execute(ca_stmt)
                    ca = ca_res.scalar_one_or_none()
                    if not ca:
                        ca = ClassroomAllocation(timetable_entry_id=entry.id)
                        db.add(ca)
                    
                    ca.classroom_id = new_room_obj.id
                    ca.suitability_score = alloc["suitability_score"]
                    ca.predicted_occupancy = alloc["predicted_occupancy"]
                    ca.occupancy_confidence = alloc["occupancy_confidence"]
                    ca.student_movement_distance = alloc["student_movement_distance"]
                    ca.faculty_movement_distance = alloc["faculty_movement_distance"]
                    ca.explanation = alloc["explanation"]
                    ca.status = "modified"
                
                # Log to ReallocationLogs
                log = ReallocationLog(
                    timetable_id=tt.id,
                    timetable_entry_id=entry.id,
                    event_trigger=f"{event_type.capitalize()} Event - {details}",
                    previous_room=prev_room,
                    new_room=alloc["room"],
                    reason=f"DCRA+ reallocated due to room {prev_room} status change to {room.maintenance_status}."
                )
                db.add(log)
                
                reallocated_slots.append({
                    "entry_id": entry.id,
                    "subject": entry.subject,
                    "previous_room": prev_room,
                    "new_room": alloc["room"],
                    "suitability_score": alloc["suitability_score"]
                })
                
            await db.flush()

        elif event_type == "faculty_leave":
            # Faculty is on leave. The class slot might be cancelled or handled by sub.
            # We can mark it or change allocation if there's a substitute.
            # details can contain substitute faculty name
            stmt = select(TimetableEntry, Timetable).join(Timetable).where(
                TimetableEntry.id == target_id
            )
            res = await db.execute(stmt)
            row = res.one_or_none()
            if row:
                entry, tt = row
                prev_room = entry.room
                
                # If there's a substitute faculty in details, update faculty and reallocate
                sub_faculty = details if details else "Substitute Faculty"
                entry.faculty = sub_faculty
                
                alloc = await DCRA_Algorithm.allocate_room_for_entry(
                    db,
                    timetable_id=tt.id,
                    subject=entry.subject,
                    faculty=sub_faculty,
                    department=tt.department,
                    year=tt.year,
                    section=tt.section,
                    day=entry.day,
                    start_time=entry.start_time.strftime("%H:%M"),
                    end_time=entry.end_time.strftime("%H:%M")
                )
                
                entry.room = alloc["room"]
                
                # Log reallocation
                log = ReallocationLog(
                    timetable_id=tt.id,
                    timetable_entry_id=entry.id,
                    event_trigger="Faculty Leave",
                    previous_room=prev_room,
                    new_room=alloc["room"],
                    reason=f"Faculty Leave. Substitute: {sub_faculty}. Reallocated room via DCRA+."
                )
                db.add(log)
                
                reallocated_slots.append({
                    "entry_id": entry.id,
                    "subject": entry.subject,
                    "previous_room": prev_room,
                    "new_room": alloc["room"],
                    "suitability_score": alloc["suitability_score"]
                })
                await db.flush()
                
        return reallocated_slots
