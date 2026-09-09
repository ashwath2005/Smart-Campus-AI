from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    priority = Column(String(20), default="normal", nullable=False)
    target_role = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    target_year = Column(Integer, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=True)

    @property
    def notification_type(self):
        return self.category

    @notification_type.setter
    def notification_type(self, value):
        self.category = value


class NotificationRead(Base):
    __tablename__ = "notification_reads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_read = Column(Boolean, default=True, nullable=False)
    read_at = Column(DateTime, default=func.now(), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(String(100), nullable=False)
    role = Column(
        Enum("user", "assistant", name="chat_role_enum"),
        nullable=False,
    )
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    theme = Column(String(20), default="system")
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
