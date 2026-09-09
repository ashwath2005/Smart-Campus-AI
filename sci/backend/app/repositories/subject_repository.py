from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.models.department import Subject, Course, Department

class SubjectRepository:
    @staticmethod
    async def get_subjects_by_department_and_semester(
        db: AsyncSession, department_code_or_name: str, semester: int
    ) -> List[Subject]:
        dept_stmt = select(Department).where(
            (Department.code == department_code_or_name) |
            (Department.name == department_code_or_name) |
            (Department.name.like(f"%{department_code_or_name}%"))
        )
        dept_res = await db.execute(dept_stmt)
        departments = dept_res.scalars().all()
        if not departments:
            stmt_fallback = select(Subject).where(Subject.semester == semester)
            res_fb = await db.execute(stmt_fallback)
            fb_list = list(res_fb.scalars().all())
            if not fb_list:
                res_all = await db.execute(select(Subject))
                fb_list = list(res_all.scalars().all())
            return fb_list

        dept_ids = [d.id for d in departments]
        stmt = (
            select(Subject)
            .join(Course, Subject.course_id == Course.id)
            .where(
                Course.department_id.in_(dept_ids),
                Subject.semester == semester
            )
        )
        res = await db.execute(stmt)
        subjs = list(res.scalars().all())
        if not subjs:
            res_all = await db.execute(select(Subject))
            subjs = list(res_all.scalars().all())
        return subjs

    @staticmethod
    async def get_all_by_department(
        db: AsyncSession, department_code_or_name: str
    ) -> List[Subject]:
        dept_stmt = select(Department).where(
            (Department.code == department_code_or_name) |
            (Department.name == department_code_or_name) |
            (Department.name.like(f"%{department_code_or_name}%"))
        )
        dept_res = await db.execute(dept_stmt)
        departments = dept_res.scalars().all()
        if not departments:
            stmt = select(Subject)
            res = await db.execute(stmt)
            return list(res.scalars().all())

        dept_ids = [d.id for d in departments]
        stmt = (
            select(Subject)
            .join(Course, Subject.course_id == Course.id)
            .where(
                Course.department_id.in_(dept_ids)
            )
        )
        res = await db.execute(stmt)
        subjs = list(res.scalars().all())
        if not subjs:
            res_all = await db.execute(select(Subject))
            subjs = list(res_all.scalars().all())
        return subjs
