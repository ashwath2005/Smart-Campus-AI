from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.models.academic import Section
from app.models.department import Department

class SectionRepository:
    @staticmethod
    async def get_sections_by_department_and_semester(
        db: AsyncSession, department_code_or_name: str, semester: int
    ) -> List[Section]:
        # Resolve department ID first
        dept_stmt = select(Department).where(
            (Department.code == department_code_or_name) |
            (Department.name == department_code_or_name) |
            (Department.name.like(f"%{department_code_or_name}%"))
        )
        dept_res = await db.execute(dept_stmt)
        departments = dept_res.scalars().all()
        if not departments:
            return []

        dept_ids = [d.id for d in departments]
        stmt = select(Section).where(
            Section.department_id.in_(dept_ids),
            Section.semester == semester
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())
