import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Smart Campus AI Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Debug
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in {"true", "1", "yes"}

    # Database Settings
    USE_MYSQL: bool = os.getenv("USE_MYSQL", "").lower() in {"1", "true", "yes"}
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "smartcampus")
    
    @property
    def DATABASE_URL(self) -> str:
        if self.USE_MYSQL:
            return f"mysql+aiomysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
        return "sqlite+aiosqlite:///smartcampus.db"

    # Security & JWT Settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "smartcampus_secret_key_2024")
    JWT_ALGORITHM: str = "HS256"
    HMAC_SECRET: str = os.getenv("HMAC_SECRET", "SCME_AWN_SECURITY_HMAC_KEY_2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # AI & External Integrations
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    AI_API_KEY_1: str = os.getenv("AI_API_KEY_1", "")
    AI_API_KEY_2: str = os.getenv("AI_API_KEY_2", "")
    AI_API_KEY_3: str = os.getenv("AI_API_KEY_3", "")

    # Storage & Uploads
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25"))


settings = Settings()

# Backward-compatibility flat exports
MYSQL_USER = settings.MYSQL_USER
MYSQL_PASSWORD = settings.MYSQL_PASSWORD
MYSQL_HOST = settings.MYSQL_HOST
MYSQL_PORT = settings.MYSQL_PORT
MYSQL_DATABASE = settings.MYSQL_DATABASE
DATABASE_URL = settings.DATABASE_URL
JWT_SECRET = settings.JWT_SECRET
JWT_ALGORITHM = settings.JWT_ALGORITHM
HMAC_SECRET = settings.HMAC_SECRET
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS
GEMINI_API_KEY = settings.GEMINI_API_KEY
AI_API_KEY_1 = settings.AI_API_KEY_1
AI_API_KEY_2 = settings.AI_API_KEY_2
AI_API_KEY_3 = settings.AI_API_KEY_3
