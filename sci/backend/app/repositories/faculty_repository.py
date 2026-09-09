from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.models.user import User, FacultyLeave
from app.models.academic import FacultyWorkload

class FacultyRepository:
    @staticmethod
    async def get_all_faculty_by_department(db: AsyncSession, department: str) -> List[User]:
        # Handle exact match or loose matches (e.g. CSE / ECE vs full name)
        stmt = select(User).where(
            User.role == "faculty",
            (User.department == department) | 
            (User.department.like(f"%{department}%"))
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_approved_leaves_by_faculty_id(db: AsyncSession, faculty_id: int) -> List[FacultyLeave]:
        stmt = select(FacultyLeave).where(
            FacultyLeave.faculty_id == faculty_id,
            FacultyLeave.status == "Approved"
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_workloads_by_department(db: AsyncSession, department: str) -> List[FacultyWorkload]:
        stmt = (
            select(FacultyWorkload)
            .join(User, FacultyWorkload.faculty_id == User.id)
            .where(
                User.role == "faculty",
                (User.department == department) |
                (User.department.like(f"%{department}%"))
            )
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())
