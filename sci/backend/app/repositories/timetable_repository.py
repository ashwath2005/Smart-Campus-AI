from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.models.user import Timetable, TimetableEntry

class TimetableRepository:
    @staticmethod
    async def get_active_timetable(
        db: AsyncSession, department: str, semester: int, section: str, academic_year: str
    ) -> Optional[Timetable]:
        stmt = select(Timetable).where(
            Timetable.department == department,
            Timetable.section == section,
            Timetable.year == academic_year,
            Timetable.is_active == True
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def get_entries_by_timetable_id(db: AsyncSession, timetable_id: int) -> List[TimetableEntry]:
        stmt = select(TimetableEntry).where(TimetableEntry.timetable_id == timetable_id).order_by(
            TimetableEntry.day, TimetableEntry.period
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def deactivate_previous_timetables(
        db: AsyncSession, department: str, semester: int, section: str, academic_year: str
    ):
        stmt = (
            update(Timetable)
            .where(
                Timetable.department == department,
                Timetable.section == section,
                Timetable.year == academic_year,
                Timetable.is_active == True
            )
            .values(is_active=False)
        )
        await db.execute(stmt)
        await db.flush()

    @staticmethod
    async def create_timetable(db: AsyncSession, department: str, section: str, academic_year: str) -> Timetable:
        timetable = Timetable(
            department=department,
            year=academic_year,
            section=section,
            is_active=True
        )
        db.add(timetable)
        await db.flush()
        return timetable

    @staticmethod
    async def add_entries(db: AsyncSession, entries: List[TimetableEntry]):
        db.add_all(entries)
        await db.flush()

    @staticmethod
    async def delete_entries_by_timetable_id(db: AsyncSession, timetable_id: int):
        stmt = delete(TimetableEntry).where(TimetableEntry.timetable_id == timetable_id)
        await db.execute(stmt)
        await db.flush()
