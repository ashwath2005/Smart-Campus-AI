import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger("websocket")

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> Set of WebSockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, role: str, department: str = None, semester: int = None):
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        
        # Store metadata on websocket scope
        websocket.scope["user_id"] = user_id
        websocket.scope["role"] = role
        websocket.scope["department"] = department
        websocket.scope["semester"] = semester
        
        logger.info(f"WebSocket connected for user {user_id} ({role})")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}")

    async def broadcast_notification(self, notification_data: dict):
        """Broadcast a notification to all active connections that match the target audience."""
        target_role = notification_data.get("target_role")
        target_dept = notification_data.get("department")
        target_year = notification_data.get("target_year")
        target_user_id = notification_data.get("user_id")

        # Prepare payload
        payload = {
            "type": "notification",
            "data": {
                "id": notification_data.get("id"),
                "title": notification_data.get("title"),
                "message": notification_data.get("message"),
                "category": notification_data.get("category") or notification_data.get("notification_type"),
                "priority": notification_data.get("priority") or "normal",
                "created_at": str(notification_data.get("created_at")) if notification_data.get("created_at") else None,
                "expires_at": str(notification_data.get("expires_at")) if notification_data.get("expires_at") else None,
                "target_role": target_role,
                "department": target_dept,
                "target_year": target_year,
            }
        }

        # Iterate over all connected sockets
        for user_id, sockets in list(self.active_connections.items()):
            # If targeted to a single user
            if target_user_id is not None and user_id != target_user_id:
                continue

            for ws in list(sockets):
                ws_role = ws.scope.get("role")
                ws_dept = ws.scope.get("department")
                ws_sem = ws.scope.get("semester")

                # Match role
                role_match = not target_role or ws_role == target_role
                
                # Match department (string matching)
                dept_match = not target_dept or ws_dept == target_dept

                # Match year
                year_match = True
                if target_year and ws_sem:
                    ws_year = (int(ws_sem) + 1) // 2
                    year_match = (ws_year == int(target_year))
                elif target_year:
                    # Target year specified but student has no semester info
                    year_match = False

                # Broadcast if all filters match
                if role_match and dept_match and year_match:
                    try:
                        await ws.send_json(payload)
                        logger.info(f"Broadcasted notification to user {user_id}")
                    except Exception as e:
                        logger.warning(f"Error sending WebSocket message to user {user_id}: {e}")
                        self.disconnect(ws, user_id)

    async def send_personal_message(self, user_id: int, message: dict):
        """Send a JSON message directly to a specific user's active sockets."""
        if user_id in self.active_connections:
            for ws in list(self.active_connections[user_id]):
                try:
                    await ws.send_json(message)
                    logger.info(f"Sent personal message to user {user_id}")
                except Exception as e:
                    logger.warning(f"Error sending personal message to user {user_id}: {e}")
                    self.disconnect(ws, user_id)

    async def broadcast_to_role(self, role: str, message: dict):
        """Broadcast a JSON message to all connected users with a given role."""
        for user_id, sockets in list(self.active_connections.items()):
            for ws in list(sockets):
                if ws.scope.get("role") == role or (role == "admin" and ws.scope.get("role") == "admin"):
                    try:
                        await ws.send_json(message)
                    except Exception as e:
                        logger.warning(f"Error broadcasting to role {role}: {e}")
                        self.disconnect(ws, user_id)

    async def broadcast_all(self, message: dict):
        """Broadcast a JSON message to all active sockets."""
        for user_id, sockets in list(self.active_connections.items()):
            for ws in list(sockets):
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.warning(f"Error broadcasting message: {e}")
                    self.disconnect(ws, user_id)

# Global connection manager instance
manager = ConnectionManager()
