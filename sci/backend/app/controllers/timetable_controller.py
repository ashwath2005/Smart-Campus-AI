from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.dtos.timetable_dto import GenerateTimetableRequest, GenerateTimetableResponse, SectionTimetableReport
from app.services.timetable_generation_service import TimetableGenerationService
from app.repositories.timetable_repository import TimetableRepository

class TimetableController:
    @staticmethod
    async def generate_timetable(
        req: GenerateTimetableRequest, db: AsyncSession, current_user: dict
    ) -> GenerateTimetableResponse:
        """Endpoint to initiate CSP-based Backtracking automatic timetable generation."""
        if current_user.get("role") != "admin" and current_user.get("role") != "hod":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Administrators or Heads of Department are authorized to generate timetables."
            )
        try:
            response = await TimetableGenerationService.generate(db, req)
            return response
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred during automatic generation: {str(e)}"
            )

    @staticmethod
    async def get_timetable_by_dept_and_semester(
        department: str, semester: int, db: AsyncSession
    ) -> List[SectionTimetableReport]:
        """Endpoint to query and fetch active published timetables."""
        try:
            schedules = await TimetableGenerationService.get_by_dept_and_sem(db, department, semester)
            return schedules
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch timetable schedules: {str(e)}"
            )

    @staticmethod
    async def publish_timetable(
        timetable_id: int, db: AsyncSession, current_user: dict
    ) -> dict:
        """Endpoint to commit draft generated timetable to live/active state."""
        if current_user.get("role") != "admin" and current_user.get("role") != "hod":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Administrators or Heads of Department are authorized to publish timetables."
            )
        
        success = await TimetableGenerationService.publish(db, timetable_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Draft timetable record with ID {timetable_id} not found."
            )
        return {"status": "success", "message": f"Timetable ID {timetable_id} has been published and set to active."}

    @staticmethod
    async def regenerate_timetable(
        timetable_id: int, db: AsyncSession, current_user: dict
    ) -> dict:
        """Endpoint to cancel draft timetable and clear generated entries."""
        if current_user.get("role") != "admin" and current_user.get("role") != "hod":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Administrators or Heads of Department are authorized to manage draft allocations."
            )
        
        # Delete entries and parent timetable safely
        await TimetableRepository.delete_entries_by_timetable_id(db, timetable_id)
        
        from sqlalchemy import text
        await db.execute(text("DELETE FROM timetables WHERE id = :tid"), {"tid": timetable_id})
        await db.commit()
        
        return {"status": "success", "message": f"Draft timetable ID {timetable_id} and its allocations have been cleared."}
