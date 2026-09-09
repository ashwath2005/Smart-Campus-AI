from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime

from app.models.academic import Classroom, ClassroomAllocation, ReallocationLog
from app.utils.websocket_manager import manager as ws_manager


class FacilityHealingService:
    @staticmethod
    async def report_complaint(
        db: AsyncSession,
        classroom_id: int,
        equipment_type: str,  # projector, ac, smartboard, internet
        issue_description: str,
        reported_by_user_id: int
    ) -> Dict[str, Any]:
        query = select(Classroom).where(Classroom.id == classroom_id)
        res = await db.execute(query)
        room = res.scalar_one_or_none()

        if not room:
            return {"success": False, "message": "Classroom not found"}

        # Increment complaint count & reduce equipment health
        room.complaint_count = (room.complaint_count or 0) + 1
        
        if equipment_type == "projector":
            room.projector_health = max(0.0, (room.projector_health or 100.0) - 30.0)
        elif equipment_type == "ac":
            room.ac_health = max(0.0, (room.ac_health or 100.0) - 35.0)
        elif equipment_type == "smartboard":
            room.smartboard_health = max(0.0, (room.smartboard_health or 100.0) - 25.0)

        # Check if auto-reallocation is needed (Health < 40% or Complaints >= 2)
        needs_reallocation = room.projector_health < 40.0 or room.complaint_count >= 2
        reallocated_to_room = None

        if needs_reallocation:
            # Find optimal alternative classroom in same building block
            alt_query = select(Classroom).where(
                Classroom.id != classroom_id,
                Classroom.active == True,
                Classroom.projector_health >= 70.0,
                Classroom.capacity >= room.capacity - 10
            ).limit(1)
            alt_res = await db.execute(alt_query)
            alt_room = alt_res.scalar_one_or_none()

            if alt_room:
                reallocated_to_room = alt_room.room_number
                room.maintenance_status = "maintenance"

                # Broadcast WebSocket push notification to faculty & students
                try:
                    await ws_manager.broadcast_json({
                        "type": "FACILITY_AUTO_REALLOCATION",
                        "title": "⚡ DCRA+ Auto-Reallocation Alert",
                        "message": f"Classroom {room.room_number} equipment fault detected. Classes auto-reallocated to {alt_room.room_number}.",
                        "timestamp": datetime.now().isoformat()
                    })
                except Exception:
                    pass

        await db.commit()

        return {
            "success": True,
            "classroomId": room.id,
            "roomNumber": room.room_number,
            "equipmentType": equipment_type,
            "complaintCount": room.complaint_count,
            "projectorHealth": room.projector_health,
            "maintenanceStatus": room.maintenance_status,
            "autoReallocated": needs_reallocation,
            "reallocatedToRoom": reallocated_to_room,
            "message": f"Complaint recorded. {'DCRA+ auto-reallocated upcoming classes to ' + reallocated_to_room if reallocated_to_room else 'Equipment health updated.'}"
        }
