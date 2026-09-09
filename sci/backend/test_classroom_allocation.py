import asyncio
from app.database import engine, Base
from app.models.academic import Classroom, ClassroomAllocation
from app.algorithms.dcra_service import (
    DCRA_Algorithm,
    ClassroomHealthIndexCalculator,
    SuitabilityIndexCalculator,
    PredictiveOccupancyEngine,
    MovementOptimizer,
    FutureConflictPredictor
)
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
from sqlalchemy import select

async def run_tests():
    print("Executing DCRA+ Algorithmic Tests...")
    
    # 1. Test Classroom Health Index (CHI)
    mock_classroom = Classroom(
        room_number="Test Room 999",
        building="Test Block",
        floor=3,
        capacity=60,
        projector_health=90.0,
        smartboard_health=80.0,
        internet_health=95.0,
        ac_health=85.0,
        complaint_count=1,
        maintenance_status="active"
    )
    
    chi = ClassroomHealthIndexCalculator.calculate_chi(mock_classroom)
    print(f"  - CHI Score: {chi['score']}, Status: {chi['status']} (Expected: Good/Excellent)")
    assert chi['score'] > 50.0, "CHI score calculation error"
    
    # 2. Test Suitability Index Calculator
    suitability = SuitabilityIndexCalculator.calculate_suitability(
        room=mock_classroom,
        chi=chi,
        class_size=40,
        predicted_occupancy=36,
        needs_lab=False,
        subject="Computer Networks Lecture",
        department="CSE",
        student_distance=50.0,
        faculty_distance=20.0,
        future_conflict_score=10.0
    )
    
    print(f"  - Suitability Index Score: {suitability['score']}%")
    print(f"  - Score Breakdown: {suitability['breakdown']}")
    assert suitability['score'] > 50.0, "Suitability index calculation error"
    
    # 3. Test walking distance calculation
    room_a = Classroom(building="CS Block", floor=1)
    room_b = Classroom(building="CS Block", floor=3)
    room_c = Classroom(building="ECE Block", floor=1)
    
    dist_same_bld = MovementOptimizer.calculate_walking_distance(room_a, room_b)
    dist_diff_bld = MovementOptimizer.calculate_walking_distance(room_a, room_c)
    
    print(f"  - Walking Distance (Same Block, Floor 1 to 3): {dist_same_bld}m")
    print(f"  - Walking Distance (Diff Block): {dist_diff_bld}m")
    assert dist_same_bld < dist_diff_bld, "Walking distance comparison error"
    
    print("DCRA+ Algorithmic Tests Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(run_tests())
