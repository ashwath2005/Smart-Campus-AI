import asyncio
from app.database import async_session
from app.models.user import User
from app.services.auth_service import hash_password

async def seed_users():
    async with async_session() as db:
        hashed = hash_password("password123")
        
        users = [
            User(
                name="Student User",
                email="student1@campus.com",
                password=hashed,
                role="student",
                department="CSE",
                roll_number="CS001",
                semester=4,
                section="A",
            ),
            User(
                name="Faculty Staff",
                email="faculty1@campus.com",
                password=hashed,
                role="faculty",
                department="CSE",
                employee_id="EMP001",
                staff_room="Block A, Room 101",
            ),
            User(
                name="Admin User",
                email="admin@campus.com",
                password=hashed,
                role="admin",
                employee_id="ADM001",
            )
        ]

        for u in users:
            # Check if user already exists
            from sqlalchemy import select
            res = await db.execute(select(User).where(User.email == u.email))
            if res.scalar_one_or_none() is None:
                db.add(u)
                print(f"User {u.email} created.")
        
        await db.commit()
    print("Clean user accounts seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_users())
