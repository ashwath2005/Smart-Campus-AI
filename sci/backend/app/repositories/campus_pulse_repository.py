from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from datetime import datetime, timedelta
import json
from app.models.campus_pulse import CampusActivity, CampusPulseSnapshot


class CampusPulseRepository:
    @staticmethod
    async def log_activity(
        db: AsyncSession,
        activity_type: str,
        user_id: int = None,
        department_id: int = None,
        location_id: int = None,
        building_name: str = None,
        metadata_dict: dict = None
    ) -> CampusActivity:
        meta_str = json.dumps(metadata_dict) if metadata_dict else None
        act = CampusActivity(
            activity_type=activity_type,
            user_id=user_id,
            department_id=department_id,
            location_id=location_id,
            building_name=building_name,
            timestamp=datetime.now(),
            metadata_json=meta_str
        )
        db.add(act)
        await db.commit()
        await db.refresh(act)
        return act

    @staticmethod
    async def create_snapshot(
        db: AsyncSession,
        activity_score: float,
        status: str,
        student_score: float,
        faculty_score: float,
        room_score: float,
        event_score: float,
        lab_score: float,
        active_students: int,
        active_faculty: int,
        occupied_rooms: int,
        active_events: int,
        active_labs: int,
        department_id: int = None,
        metadata_dict: dict = None
    ) -> CampusPulseSnapshot:
        meta_str = json.dumps(metadata_dict) if metadata_dict else None
        snap = CampusPulseSnapshot(
            timestamp=datetime.now(),
            activity_score=round(activity_score, 1),
            status=status,
            student_score=round(student_score, 1),
            faculty_score=round(faculty_score, 1),
            room_score=round(room_score, 1),
            event_score=round(event_score, 1),
            lab_score=round(lab_score, 1),
            active_students=active_students,
            active_faculty=active_faculty,
            occupied_rooms=occupied_rooms,
            active_events=active_events,
            active_labs=active_labs,
            department_id=department_id,
            metadata_json=meta_str
        )
        db.add(snap)
        await db.commit()
        await db.refresh(snap)
        return snap

    @staticmethod
    async def get_history(
        db: AsyncSession,
        department_id: int = None,
        timeframe: str = "today",
        limit: int = 48
    ):
        now = datetime.now()
        if timeframe == "7d":
            start_date = now - timedelta(days=7)
        elif timeframe == "30d":
            start_date = now - timedelta(days=30)
        else:  # today
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)

        query = select(CampusPulseSnapshot).where(CampusPulseSnapshot.timestamp >= start_date)
        if department_id:
            query = query.where(CampusPulseSnapshot.department_id == department_id)
        else:
            query = query.where(CampusPulseSnapshot.department_id.is_(None))

        query = query.order_by(CampusPulseSnapshot.timestamp.asc()).limit(limit)
        res = await db.execute(query)
        return res.scalars().all()

    @staticmethod
    async def get_recent_activities(db: AsyncSession, limit: int = 10):
        query = select(CampusActivity).order_by(CampusActivity.timestamp.desc()).limit(limit)
        res = await db.execute(query)
        return res.scalars().all()
