"""
Database Schema Initialization Script
"""
import asyncio
import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sci", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import engine, Base
import app.models

async def main():
    print("Connecting to database and initializing all ORM schemas...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("SUCCESS: All database tables initialized successfully.")

if __name__ == "__main__":
    asyncio.run(main())
