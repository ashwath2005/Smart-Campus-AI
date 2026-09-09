import asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
from app.database import engine
from app.routes.timetable import get_dcra_analytics

async def test_analytics():
    print("Testing get_dcra_analytics route...")
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        try:
            res = await get_dcra_analytics(current_user={"id": 1, "role": "admin"}, db=session)
            print("Analytics response successfully generated:")
            print(res.keys())
        except Exception as e:
            import traceback
            print("ERROR encountered:")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_analytics())
