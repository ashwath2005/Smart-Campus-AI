from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.models.academic import Classroom

class ClassroomRepository:
    @staticmethod
    async def get_all_active_classrooms(db: AsyncSession) -> List[Classroom]:
        stmt = select(Classroom).where(
            Classroom.active == True,
            Classroom.maintenance_status == "active"
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())
