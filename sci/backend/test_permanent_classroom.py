import asyncio
import sys
from sqlalchemy import select
from app.database import engine, Base
from app.models.academic import Classroom, Section
from app.models.department import Department, Subject, Course
from app.models.user import User, Timetable
from app.algorithms.timetable_service import TimetableService
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

async def run_tests():
    print("Starting AI Timetable & Permanent Classroom Engine verification tests...")
    
    # Initialize DB Session
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Test Suitability Score Weight calculations
        print("\nTest 1: Testing Classroom Suitability Scoring Formula...")
        test_room = Classroom(
            room_number="Test Room 99",
            building="CS Block",
            floor=1,
            capacity=60,
            room_type="THEORY",
            smart_classroom=True,
            department_block="CS Block",
            is_accessible=True
        )
        
        # Calculate score with: strength = 50, dept_block = "CS Block"
        score = TimetableService.calculate_permanent_room_score(test_room, 50, "CS Block")
        print(f"  - Classroom score computed: {score}")
        # Expected:
        # Capacity Match: 1.0 - (60-50)/60 = 0.83. 0.83 * 0.4 = 0.33
        # Same Dept Block: 1.0. 1.0 * 0.3 = 0.3
        # Equipment Match: 1.0. 1.0 * 0.2 = 0.2
        # Accessibility: 1.0. 1.0 * 0.1 = 0.1
        # Total: ~0.93
        assert score > 0.9, f"Failed suitability scoring: expected > 0.9, got {score}"
        print("  - Test 1 passed: Suitability weights verified successfully!")

        # 2. Test Section Permanent Room auto-assignment
        print("\nTest 2: Testing Section Permanent Room auto-assignment...")
        dept_res = await session.execute(select(Department).limit(1))
        dept = dept_res.scalar_one_or_none()
        if not dept:
            # Create a test department
            dept = Department(code="TEST_DEPT", name="Test Department", department_block="CS Block")
            session.add(dept)
            await session.commit()
            await session.refresh(dept)
        
        classroom_res = await session.execute(select(Classroom).where(Classroom.room_type == "THEORY"))
        classrooms = classroom_res.scalars().all()
        if not classrooms:
            # Add classrooms
            c1 = Classroom(room_number="R101", building="CS Block", floor=1, capacity=60, room_type="THEORY", smart_classroom=True, active=True)
            session.add(c1)
            await session.commit()
        
        assigned_room = await TimetableService.get_or_assign_permanent_room(session, dept.name, 1, "A", 50)
        print(f"  - Permanent Room auto-assigned: {assigned_room.room_number if assigned_room else 'None'}")
        assert assigned_room is not None, "Failed to auto-assign permanent classroom"
        print("  - Test 2 passed: Auto-assignment verified successfully!")

        # 3. Test 8-Stage Timetable Generator
        print("\nTest 3: Testing 8-Stage Timetable Generation Solver...")
        subjects = ["Data Structures", "Computer Networks", "OS Lab"]
        workloads = {"Data Structures": 4, "Computer Networks": 4, "OS Lab": 6}
        faculty_list = ["Dr. Smith", "Prof. Johnson"]
        
        entries = await TimetableService.generate_smart_timetable(
            db=session,
            department=dept.name,
            year="I",
            section="A",
            semester=1,
            faculty_list=faculty_list,
            subjects=subjects,
            workloads=workloads,
            classrooms=["R101"],
            labs=["OS Lab"]
        )
        
        print(f"  - Generated {len(entries)} timetable slots (including lunch breaks).")
        assert len(entries) > 0, "Failed to generate any timetable slots"
        
        theory_entries = [e for e in entries if e["subject"] == "Data Structures"]
        print(f"  - Theory Entry Example: {theory_entries[0] if theory_entries else 'None'}")
        
        # Verify theory rooms map exactly to permanent assigned room
        for e in theory_entries:
            assert e["room"] == assigned_room.room_number, f"Theory room mismatch: expected {assigned_room.room_number}, got {e['room']}"
        
        print("  - Test 3 passed: 8-Stage generator locked theory to permanent room successfully!")

    print("\nAll verification tests completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_tests())
