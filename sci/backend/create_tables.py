import asyncio
from app.database import engine, Base
import app.models

async def main():
    print("Connecting to database and creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("SUCCESS: All database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(main())
