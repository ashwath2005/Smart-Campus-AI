import os
import pymysql
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

use_mysql = settings.USE_MYSQL

if use_mysql:
    try:
        conn = pymysql.connect(
            host=settings.MYSQL_HOST,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            port=int(settings.MYSQL_PORT),
            database=settings.MYSQL_DATABASE,
            connect_timeout=2,
        )
        conn.close()
        print("Database: Successfully connected to MySQL database.")
    except pymysql.err.OperationalError as e:
        if len(e.args) > 0 and e.args[0] == 1049:
            try:
                conn = pymysql.connect(
                    host=settings.MYSQL_HOST,
                    user=settings.MYSQL_USER,
                    password=settings.MYSQL_PASSWORD,
                    port=int(settings.MYSQL_PORT),
                    connect_timeout=2,
                )
                cursor = conn.cursor()
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {settings.MYSQL_DATABASE}")
                cursor.close()
                conn.close()
                print(f"Database: Successfully created and connected to MySQL database '{settings.MYSQL_DATABASE}'.")
            except Exception as create_err:
                print(f"Database: MySQL database '{settings.MYSQL_DATABASE}' creation failed ({create_err}). Falling back to SQLite.")
                use_mysql = False
        else:
            print(f"Database: MySQL operational error ({e}). Falling back to SQLite.")
            use_mysql = False
    except Exception as e:
        print(f"Database: MySQL connection failed ({e}). Falling back to SQLite.")
        use_mysql = False
else:
    print("Database: Using SQLite by default. Set USE_MYSQL=true to enable MySQL.")

if use_mysql:
    db_url = settings.DATABASE_URL
    engine = create_async_engine(db_url, echo=settings.DEBUG)
else:
    db_url = "sqlite+aiosqlite:///smartcampus.db"
    engine = create_async_engine(
        db_url,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False, "timeout": 30}
    )

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    """FastAPI async dependency yielding an AsyncSession."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
