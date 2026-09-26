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
            ),
            User(
                name="Dr. Sunita Rao",
                email="hod1@campus.com",
                password=hashed,
                role="hod",
                department="CSE",
                employee_id="EMP003",
                staff_room="Block A, HOD Office 102",
            ),
            User(
                name="Chief Hostel Warden",
                email="warden@campus.com",
                password=hashed,
                role="warden",
                department="Hostel Administration",
                employee_id="WAR001",
                staff_room="Hostel Office Block A",
                phone_number="+91 98765 43222",
            ),
            User(
                name="Gate Security Officer",
                email="security@campus.com",
                password=hashed,
                role="security",
                department="Security",
                employee_id="SEC001",
                phone_number="+91 98765 43210",
            ),
            User(
                name="Suresh Sharma (Guardian)",
                email="guardian@campus.com",
                password=hashed,
                role="guardian",
                department="Parent Community",
                phone_number="+91 98765 43210",
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
