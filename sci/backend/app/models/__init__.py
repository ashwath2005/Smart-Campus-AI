from app.models.user import User, Timetable, Announcement, TimetableEntry, TimetableVersion, ImportHistory, FacultyLeave, StudentLeave, StudentOD
from app.models.attendance import Attendance
from app.models.assignment import Assignment, Submission
from app.models.event import Event, EventRegistration
from app.models.department import Department, Course, Subject
from app.models.academic import StudyMaterial, InternalMark, SemesterResult, AcademicCalendarEvent, StudySession, StudentStudyPlan, Classroom, ClassroomAllocation, ReallocationLog, Section, Building, AcademicYear, Semester
from app.models.placement import Company, Placement, PlacementApplication
from app.models.communication import Notification, NotificationRead, ChatHistory, UserPreference
from app.models.token import RefreshToken
from app.models.forum import ForumPost, ForumReply
from app.models.audit_log import AuditLog
from app.models.campus_pulse import CampusActivity, CampusPulseSnapshot
from app.models.gate_pass import GatePass
from app.models.learning_intelligence import StudentLearningInteraction, StudentCognitiveProfile, StudentTopicKnowledge
from app.models.ai_learning_engine import (
    StudentLearningProfile, StudentSkillProfile, StudentCareerRoadmap,
    UploadedDocument, DocumentChunk, Quiz, QuizQuestion, QuizAttempt,
    QuizAnalytics, BehaviourHistory, AIInsight
)

__all__ = [
    "User",
    "Timetable",
    "Announcement",
    "TimetableEntry",
    "TimetableVersion",
    "ImportHistory",
    "FacultyLeave",
    "StudentLeave",
    "StudentOD",

    "Attendance",
    "Assignment",
    "Submission",
    "Event",
    "EventRegistration",
    "Department",
    "Course",
    "Subject",
    "StudyMaterial",
    "InternalMark",
    "SemesterResult",
    "AcademicCalendarEvent",
    "StudySession",
    "StudentStudyPlan",
    "Classroom",
    "ClassroomAllocation",
    "ReallocationLog",
    "Section",
    "Building",
    "AcademicYear",
    "Semester",
    "Company",
    "Placement",
    "PlacementApplication",
    "Notification",
    "NotificationRead",
    "ChatHistory",
    "UserPreference",
    "RefreshToken",
    "ForumPost",
    "ForumReply",
    "AuditLog",
    "StudentLearningInteraction",
    "StudentCognitiveProfile",
    "StudentTopicKnowledge",
    "StudentLearningProfile",
    "StudentSkillProfile",
    "StudentCareerRoadmap",
    "UploadedDocument",
    "DocumentChunk",
    "Quiz",
    "QuizQuestion",
    "QuizAttempt",
    "QuizAnalytics",
    "BehaviourHistory",
    "AIInsight",
    "CampusActivity",
    "CampusPulseSnapshot",
    "GatePass"
]
