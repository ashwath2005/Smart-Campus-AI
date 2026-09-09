from datetime import date, timedelta
from typing import List, Dict, Any, Optional, Tuple
import json

class ConstraintChecker:
    @staticmethod
    def is_faculty_free(faculty_id: int, day: str, periods: List[int], schedule: Dict[str, Dict[int, List[Dict[str, Any]]]]) -> bool:
        """Check if faculty is already assigned to any class during the specified periods on a given day."""
        if not faculty_id:
            return True
        day_schedule = schedule.get(day, {})
        for p in periods:
            slot_assignments = day_schedule.get(p, [])
            for assignment in slot_assignments:
                if assignment.get("faculty_id") == faculty_id:
                    return False
        return True

    @staticmethod
    def is_classroom_free(classroom_id: int, day: str, periods: List[int], schedule: Dict[str, Dict[int, List[Dict[str, Any]]]]) -> bool:
        """Check if classroom is already assigned to any class during the specified periods on a given day."""
        if not classroom_id:
            return True
        day_schedule = schedule.get(day, {})
        for p in periods:
            slot_assignments = day_schedule.get(p, [])
            for assignment in slot_assignments:
                if assignment.get("classroom_id") == classroom_id:
                    return False
        return True

    @staticmethod
    def is_section_free(section_name: str, day: str, periods: List[int], schedule: Dict[str, Dict[int, List[Dict[str, Any]]]]) -> bool:
        """Check if section is already assigned during the specified periods on a given day."""
        day_schedule = schedule.get(day, {})
        for p in periods:
            slot_assignments = day_schedule.get(p, [])
            for assignment in slot_assignments:
                if assignment.get("section") == section_name:
                    return False
        return True

    @staticmethod
    def is_faculty_on_leave(faculty_id: int, day: str, leaves: List[Any]) -> bool:
        """Check if the faculty has approved leave on the given weekday."""
        if not faculty_id:
            return False
        
        # Map weekday name to a calendar date in the current week
        today = date.today()
        current_weekday = today.weekday()  # Monday is 0, Sunday is 6
        
        day_map = {
            "Monday": 0,
            "Tuesday": 1,
            "Wednesday": 2,
            "Thursday": 3,
            "Friday": 4,
            "Saturday": 5,
            "Sunday": 6
        }
        
        target_weekday = day_map.get(day, 0)
        days_diff = target_weekday - current_weekday
        target_date = today + timedelta(days=days_diff)
        
        for leave in leaves:
            if leave.faculty_id == faculty_id:
                # Check if target date falls between start_date and end_date
                if leave.start_date <= target_date <= leave.end_date:
                    return True
        return False


class FacultyAllocator:
    @staticmethod
    def get_preferred_slots(faculty: Any) -> List[Tuple[str, int]]:
        """Parse faculty preferred slots from JSON configuration."""
        try:
            if faculty.preferred_availability:
                # E.g. list of ["Monday:1", "Tuesday:3"]
                slots = json.loads(faculty.preferred_availability)
                preferred = []
                for s in slots:
                    parts = s.split(":")
                    if len(parts) == 2:
                        preferred.append((parts[0], int(parts[1])))
                return preferred
        except Exception:
            pass
        return []


class ClassroomAllocator:
    @staticmethod
    def get_suitable_rooms(classrooms: List[Any], is_lab: bool) -> List[Any]:
        """Filter classrooms matching THEORY vs LAB type."""
        return [
            r for r in classrooms
            if (is_lab and (r.room_type == "LAB" or r.is_lab)) or 
               (not is_lab and (r.room_type == "THEORY" or not r.is_lab))
        ]


class SubjectAllocator:
    @staticmethod
    def sort_demands_by_difficulty(demands: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sort subjects demanding slots: Labs first, then higher workloads first."""
        return sorted(
            demands,
            key=lambda x: (not x["is_lab"], -x["duration"], x["subject_id"])
        )


class BacktrackingScheduler:
    def __init__(self, sections: List[Any], subjects: List[Any], classrooms: List[Any], faculties: List[Any], leaves: List[Any]):
        self.sections = sections
        self.subjects = subjects
        self.classrooms = classrooms
        self.faculties = faculties
        self.leaves = leaves
        self.backtrack_count = 0
        self.max_backtracks = 15000
        
        # Initialize schedule data structure: day -> period -> list of assignments
        self.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        self.periods = list(range(1, 8))  # Periods 1 to 7
        
        # Period-major slot ordering to prevent spatial packing/clustering conflicts
        self.slots = []
        for p in self.periods:
            for d in self.days:
                self.slots.append((d, p))
        
        self.schedule = {}
        for d in self.days:
            self.schedule[d] = {}
            for p in self.periods:
                self.schedule[d][p] = []

    def solve(self) -> bool:
        # 1. Expand subjects into slot demands
        demands = []
        for sect in self.sections:
            sect_subjects = [s for s in self.subjects if s.semester == sect.semester]
            for sub in sect_subjects:
                hours = sub.weekly_hours or 4
                is_lab = sub.is_lab
                
                if is_lab:
                    # Labs scheduled in 3-hour blocks
                    blocks = max(1, hours // 3)
                    for _ in range(blocks):
                        demands.append({
                            "section": sect.section_name,
                            "semester": sect.semester,
                            "subject_id": sub.id,
                            "subject_name": sub.name,
                            "faculty_id": sub.faculty_id,
                            "is_lab": True,
                            "duration": 3
                        })
                else:
                    # Theory scheduled in 1-hour slots
                    for _ in range(hours):
                        demands.append({
                            "section": sect.section_name,
                            "semester": sect.semester,
                            "subject_id": sub.id,
                            "subject_name": sub.name,
                            "faculty_id": sub.faculty_id,
                            "is_lab": False,
                            "duration": 1
                        })

        # 2. Sort demands using difficulty heuristic
        sorted_demands = SubjectAllocator.sort_demands_by_difficulty(demands)

        # 3. Start Backtracking CSP Solver
        return self._backtrack(0, sorted_demands)

    def _backtrack(self, index: int, demands: List[Dict[str, Any]]) -> bool:
        self.backtrack_count += 1
        if self.backtrack_count > self.max_backtracks:
            raise ValueError(
                "The automatic scheduler reached its search limit without finding a conflict-free solution. "
                "This usually happens when too many subjects are mapped to a single faculty member, or classroom availability is restricted. "
                "Please distribute subjects across multiple faculty members and retry."
            )

        if index >= len(demands):
            return True  # All demands satisfied successfully!

        demand = demands[index]
        is_lab = demand["is_lab"]
        duration = demand["duration"]
        faculty_id = demand["faculty_id"]
        sect_name = demand["section"]
        
        # Find faculty record
        faculty_obj = next((f for f in self.faculties if f.id == faculty_id), None)
        faculty_name = faculty_obj.name if faculty_obj else "N/A"
        
        # Get rooms matching type
        matching_classrooms = ClassroomAllocator.get_suitable_rooms(self.classrooms, is_lab)
        if not matching_classrooms:
            return False

        # Get faculty preferences
        pref_slots = FacultyAllocator.get_preferred_slots(faculty_obj) if faculty_obj else []

        # Order days and periods using the period-major slot sequence
        for day, start_p in self.slots:
            # Check leave status
            if ConstraintChecker.is_faculty_on_leave(faculty_id, day, self.leaves):
                continue
                
            # Check consecutive period boundaries
            if start_p + duration - 1 > 7:
                continue
            
            periods_block = list(range(start_p, start_p + duration))
            
            # Check hard constraints on Section & Faculty availability
            if not ConstraintChecker.is_section_free(sect_name, day, periods_block, self.schedule):
                continue
            if not ConstraintChecker.is_faculty_free(faculty_id, day, periods_block, self.schedule):
                continue

            # Optimize subject distribution (Soft constraint: no repeating same subject on the same day)
            if not is_lab:
                day_schedule = self.schedule.get(day, {})
                already_scheduled_today = False
                for p in self.periods:
                    for assignment in day_schedule.get(p, []):
                        if assignment.get("section") == sect_name and assignment.get("subject_id") == demand["subject_id"]:
                            already_scheduled_today = True
                            break
                if already_scheduled_today:
                    continue

            # Iterate classrooms
            for room in matching_classrooms:
                if not ConstraintChecker.is_classroom_free(room.id, day, periods_block, self.schedule):
                    continue

                # Soft constraint: Prioritize preferred availability slots
                is_preferred = (day, start_p) in pref_slots if pref_slots else False

                # Make assignment
                for p in periods_block:
                    self.schedule[day][p].append({
                        "section": sect_name,
                        "semester": demand["semester"],
                        "subject_id": demand["subject_id"],
                        "subject_name": demand["subject_name"],
                        "faculty_id": faculty_id,
                        "faculty_name": faculty_name,
                        "classroom_id": room.id,
                        "room_number": room.room_number,
                        "is_lab": is_lab,
                        "is_preferred": is_preferred
                    })

                # Recurse
                if self._backtrack(index + 1, demands):
                    return True

                # Backtrack
                for p in periods_block:
                    self.schedule[day][p] = [
                        a for a in self.schedule[day][p]
                        if not (a["section"] == sect_name and a["subject_id"] == demand["subject_id"] and a["classroom_id"] == room.id)
                    ]
                        
        return False
