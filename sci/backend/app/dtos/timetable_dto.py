from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class GenerateTimetableRequest(BaseModel):
    department: str = Field(..., description="E.g., Computer Science and Engineering")
    semester: Optional[int] = Field(None, description="E.g., 4")
    year: Optional[str] = Field(None, description="E.g., II")
    academic_year: Optional[str] = Field("2026-2027", description="E.g., 2026-2027")
    sections: Optional[List[str]] = Field(None, description="E.g., ['A', 'B']")
    section: Optional[str] = Field(None, description="E.g., 'A'")
    max_slots_per_day: Optional[int] = 7
    working_days: Optional[int] = 5

class TimetableCellEntry(BaseModel):
    day: str
    period: int
    subject: str
    faculty: str
    room: str
    is_lab: bool
    start_time: str
    end_time: str

class SectionTimetableReport(BaseModel):
    section: str
    entries: List[TimetableCellEntry]

class ConflictReportItem(BaseModel):
    conflict_type: str  # E.g. "faculty_clash", "classroom_clash"
    details: str

class GenerateTimetableResponse(BaseModel):
    timetable_id: int
    department: str
    semester: int
    academic_year: str
    schedules: List[SectionTimetableReport]
    entries: Optional[List[Dict[str, Any]]] = []
    quality_score: float = 100.0
    conflicts: List[ConflictReportItem] = []
    validation_report: str = "All constraints validated."
