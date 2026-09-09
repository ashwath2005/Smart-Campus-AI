import asyncio
import sys
from sqlalchemy import text
from app.database import engine, Base
import app.models  # Register all models on Base

async def run_migrations():
    print("Database: Running database schema extensions...")
    
    # 1. Create all new tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("  - New tables created or verified.")

    # 2. Add new columns to existing tables using ALTER TABLE
    # Note: SQLite supports ALTER TABLE ADD COLUMN, and MySQL does too.
    async with engine.connect() as conn:
        # Check and add columns for study_materials
        try:
            res = await conn.execute(text("SELECT department, semester, section, unit, tags FROM study_materials LIMIT 1"))
            await res.all()
            print("  - study_materials columns already exist.")
        except Exception:
            # Let's add them one by one (checkfirst pattern in try/except)
            print("  - Adding missing columns to study_materials...")
            for col, col_type in [("department", "VARCHAR(100)"), ("semester", "INTEGER"), ("section", "VARCHAR(50)"), ("unit", "VARCHAR(50)"), ("tags", "VARCHAR(200)")]:
                try:
                    await conn.execute(text(f"ALTER TABLE study_materials ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column study_materials.{col}")
                except Exception as e:
                    print(f"    (column study_materials.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for attendance
        try:
            res = await conn.execute(text("SELECT status_type, edited_by, remarks FROM attendance LIMIT 1"))
            await res.all()
            print("  - attendance columns already exist.")
        except Exception:
            print("  - Adding missing columns to attendance...")
            for col, col_type in [("status_type", "VARCHAR(50) DEFAULT 'present'"), ("edited_by", "INTEGER"), ("remarks", "VARCHAR(255)")]:
                try:
                    await conn.execute(text(f"ALTER TABLE attendance ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column attendance.{col}")
                except Exception as e:
                    print(f"    (column attendance.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for submissions
        try:
            res = await conn.execute(text("SELECT file_url, github_link, drive_link FROM submissions LIMIT 1"))
            await res.all()
            print("  - submissions columns already exist.")
        except Exception:
            print("  - Adding missing columns to submissions...")
            for col, col_type in [("file_url", "VARCHAR(500)"), ("github_link", "VARCHAR(500)"), ("drive_link", "VARCHAR(500)")]:
                try:
                    await conn.execute(text(f"ALTER TABLE submissions ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column submissions.{col}")
                except Exception as e:
                    print(f"    (column submissions.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for users
        try:
            res = await conn.execute(text("SELECT advisor_id FROM users LIMIT 1"))
            await res.all()
            print("  - users advisor_id column already exists.")
        except Exception:
            print("  - Adding missing advisor_id column to users...")
            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN advisor_id INTEGER"))
                print("    + Added column users.advisor_id")
            except Exception as e:
                print(f"    (column users.advisor_id might already exist: {e})")
            await conn.commit()

        # Check and add columns for faculty_leaves
        try:
            res = await conn.execute(text("SELECT supporting_document FROM faculty_leaves LIMIT 1"))
            await res.all()
            print("  - faculty_leaves supporting_document column already exists.")
        except Exception:
            print("  - Adding missing supporting_document column to faculty_leaves...")
            try:
                await conn.execute(text("ALTER TABLE faculty_leaves ADD COLUMN supporting_document VARCHAR(500)"))
                print("    + Added column faculty_leaves.supporting_document")
            except Exception as e:
                print(f"    (column faculty_leaves.supporting_document might already exist: {e})")
            await conn.commit()

        # Check and add columns for assignments
        try:
            res = await conn.execute(text("SELECT department, year, class_name, section, attachments FROM assignments LIMIT 1"))
            await res.all()
            print("  - assignments columns already exist.")
        except Exception:
            print("  - Adding missing columns to assignments...")
            for col, col_type in [("department", "VARCHAR(50)"), ("year", "VARCHAR(20)"), ("class_name", "VARCHAR(50)"), ("section", "VARCHAR(10)"), ("attachments", "VARCHAR(500)")]:
                try:
                    await conn.execute(text(f"ALTER TABLE assignments ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column assignments.{col}")
                except Exception as e:
                    print(f"    (column assignments.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for departments
        try:
            res = await conn.execute(text("SELECT department_block, total_semesters, active FROM departments LIMIT 1"))
            await res.all()
            print("  - departments columns already exist.")
        except Exception:
            print("  - Adding missing columns to departments...")
            for col, col_type in [("department_block", "VARCHAR(100)"), ("total_semesters", "INTEGER DEFAULT 8"), ("active", "INTEGER DEFAULT 1")]:
                try:
                    await conn.execute(text(f"ALTER TABLE departments ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column departments.{col}")
                except Exception as e:
                    print(f"    (column departments.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for classrooms (DCRA+ / CHI extension)
        try:
            res = await conn.execute(text("SELECT has_smartboard, has_internet, has_ac, projector_health FROM classrooms LIMIT 1"))
            await res.all()
            print("  - classrooms DCRA+ columns already exist.")
        except Exception:
            print("  - Adding missing DCRA+ columns to classrooms...")
            for col, col_type in [
                ("has_smartboard", "TINYINT DEFAULT 0"),
                ("has_internet", "TINYINT DEFAULT 1"),
                ("has_ac", "TINYINT DEFAULT 0"),
                ("projector_health", "FLOAT DEFAULT 100.0"),
                ("smartboard_health", "FLOAT DEFAULT 100.0"),
                ("internet_health", "FLOAT DEFAULT 100.0"),
                ("ac_health", "FLOAT DEFAULT 100.0"),
                ("complaint_count", "INTEGER DEFAULT 0"),
                ("maintenance_status", "VARCHAR(50) DEFAULT 'active'"),
                ("energy_efficiency_rating", "FLOAT DEFAULT 5.0")
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE classrooms ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column classrooms.{col}")
                except Exception as e:
                    print(f"    (column classrooms.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for classroom_allocations (DCRA+ extension)
        try:
            res = await conn.execute(text("SELECT suitability_score, explanation, predicted_occupancy FROM classroom_allocations LIMIT 1"))
            await res.all()
            print("  - classroom_allocations DCRA+ columns already exist.")
        except Exception:
            print("  - Adding missing DCRA+ columns to classroom_allocations...")
            for col, col_type in [
                ("suitability_score", "FLOAT DEFAULT 100.0"),
                ("explanation", "TEXT"),
                ("predicted_occupancy", "INTEGER DEFAULT 0"),
                ("occupancy_confidence", "FLOAT DEFAULT 1.0"),
                ("student_movement_distance", "FLOAT DEFAULT 0.0"),
                ("faculty_movement_distance", "FLOAT DEFAULT 0.0"),
                ("is_manual_override", "TINYINT DEFAULT 0"),
                ("override_reason", "TEXT"),
                ("original_ai_room", "VARCHAR(50)")
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE classroom_allocations ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column classroom_allocations.{col}")
                except Exception as e:
                    print(f"    (column classroom_allocations.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for classrooms (Permanent Classroom additions)
        try:
            res = await conn.execute(text("SELECT room_type, smart_classroom, department_block FROM classrooms LIMIT 1"))
            await res.all()
            print("  - classrooms Permanent Classroom columns already exist.")
        except Exception:
            print("  - Adding missing Permanent Classroom columns to classrooms...")
            for col, col_type in [
                ("room_type", "VARCHAR(20) DEFAULT 'THEORY'"),
                ("smart_classroom", "TINYINT DEFAULT 0"),
                ("department_block", "VARCHAR(50)"),
                ("active", "TINYINT DEFAULT 1")
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE classrooms ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column classrooms.{col}")
                except Exception as e:
                    print(f"    (column classrooms.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for timetable_entries (Permanent Classroom additions)
        try:
            res = await conn.execute(text("SELECT faculty_id, subject_id, department_id, classroom_id FROM timetable_entries LIMIT 1"))
            await res.all()
            print("  - timetable_entries Permanent Classroom columns already exist.")
        except Exception:
            print("  - Adding missing Permanent Classroom columns to timetable_entries...")
            for col, col_type in [
                ("faculty_id", "INTEGER"),
                ("subject_id", "INTEGER"),
                ("department_id", "INTEGER"),
                ("semester", "INTEGER"),
                ("section", "VARCHAR(10)"),
                ("period", "INTEGER"),
                ("classroom_id", "INTEGER")
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE timetable_entries ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column timetable_entries.{col}")
                except Exception as e:
                    print(f"    (column timetable_entries.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for subjects (Timetable Generator additions)
        try:
            res = await conn.execute(text("SELECT weekly_hours, is_lab FROM subjects LIMIT 1"))
            await res.all()
            print("  - subjects Timetable Generator columns already exist.")
        except Exception:
            print("  - Adding missing Timetable Generator columns to subjects...")
            for col, col_type in [
                ("weekly_hours", "INTEGER DEFAULT 4"),
                ("is_lab", "TINYINT DEFAULT 0")
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE subjects ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column subjects.{col}")
                except Exception as e:
                    print(f"    (column subjects.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for users (Timetable Generator additions)
        try:
            res = await conn.execute(text("SELECT max_workload, preferred_availability FROM users LIMIT 1"))
            await res.all()
            print("  - users Timetable Generator columns already exist.")
        except Exception:
            print("  - Adding missing Timetable Generator columns to users...")
            for col, col_type in [
                ("max_workload", "INTEGER DEFAULT 18"),
                ("preferred_availability", "TEXT")
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column users.{col}")
                except Exception as e:
                    print(f"    (column users.{col} might already exist: {e})")
            await conn.commit()

        # Check and add columns for import_history (Bulk Import additions)
        try:
            res = await conn.execute(text("SELECT import_type, failed_records_log FROM import_history LIMIT 1"))
            await res.all()
            print("  - import_history Bulk Import columns already exist.")
        except Exception:
            print("  - Adding missing Bulk Import columns to import_history...")
            for col, col_type in [
                ("import_type", "VARCHAR(100)"),
                ("failed_records_log", "TEXT"),
                ("processing_time_ms", "INTEGER DEFAULT 0"),
                ("status", "VARCHAR(50) DEFAULT 'completed'")
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE import_history ADD COLUMN {col} {col_type}"))
                    print(f"    + Added column import_history.{col}")
                except Exception as e:
                    print(f"    (column import_history.{col} might already exist: {e})")
            await conn.commit()

    # 3. Seed Classrooms with rich DCRA+ and CHI details if empty
    from sqlalchemy import select
    from app.models.academic import Classroom
    
    from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        c_check = await session.execute(select(Classroom).limit(1))
        if not c_check.scalar_one_or_none():
            print("  - Seeding classrooms with rich DCRA+ and CHI parameters...")
            # We seed a set of classrooms across buildings with various attributes
            default_rooms = [
                Classroom(room_number="Room 101", building="CS Block", floor=1, capacity=60, is_lab=False, has_projector=True, has_smartboard=True, has_internet=True, has_ac=True, projector_health=95.0, smartboard_health=98.0, internet_health=90.0, ac_health=92.0, complaint_count=0, maintenance_status="active", energy_efficiency_rating=4.5, room_type="THEORY", smart_classroom=True, department_block="CS Block", active=True),
                Classroom(room_number="Room 102", building="CS Block", floor=1, capacity=60, is_lab=False, has_projector=True, has_smartboard=False, has_internet=True, has_ac=True, projector_health=80.0, smartboard_health=100.0, internet_health=95.0, ac_health=85.0, complaint_count=1, maintenance_status="active", energy_efficiency_rating=4.0, room_type="THEORY", smart_classroom=False, department_block="CS Block", active=True),
                Classroom(room_number="Room 201", building="CS Block", floor=2, capacity=40, is_lab=False, has_projector=True, has_smartboard=True, has_internet=True, has_ac=False, projector_health=98.0, smartboard_health=92.0, internet_health=88.0, ac_health=100.0, complaint_count=0, maintenance_status="active", energy_efficiency_rating=4.8, room_type="THEORY", smart_classroom=True, department_block="CS Block", active=True),
                Classroom(room_number="Room 202", building="ECE Block", floor=2, capacity=50, is_lab=False, has_projector=True, has_smartboard=False, has_internet=True, has_ac=True, projector_health=45.0, smartboard_health=100.0, internet_health=70.0, ac_health=40.0, complaint_count=3, maintenance_status="maintenance", energy_efficiency_rating=2.5, room_type="THEORY", smart_classroom=False, department_block="ECE Block", active=True),
                Classroom(room_number="OS Lab", building="CS Block", floor=1, capacity=30, is_lab=True, has_projector=True, has_smartboard=True, has_internet=True, has_ac=True, projector_health=90.0, smartboard_health=95.0, internet_health=100.0, ac_health=90.0, complaint_count=0, maintenance_status="active", energy_efficiency_rating=4.2, room_type="LAB", smart_classroom=True, department_block="CS Block", active=True),
                Classroom(room_number="DBMS Lab", building="CS Block", floor=2, capacity=35, is_lab=True, has_projector=True, has_smartboard=True, has_internet=True, has_ac=True, projector_health=92.0, smartboard_health=90.0, internet_health=92.0, ac_health=95.0, complaint_count=0, maintenance_status="active", energy_efficiency_rating=4.3, room_type="LAB", smart_classroom=True, department_block="CS Block", active=True),
                Classroom(room_number="VLSI Lab", building="ECE Block", floor=1, capacity=30, is_lab=True, has_projector=True, has_smartboard=False, has_internet=True, has_ac=True, projector_health=88.0, smartboard_health=100.0, internet_health=85.0, ac_health=88.0, complaint_count=1, maintenance_status="active", energy_efficiency_rating=3.9, room_type="LAB", smart_classroom=False, department_block="ECE Block", active=True),
                Classroom(room_number="Mech Workshop", building="ME Block", floor=1, capacity=50, is_lab=True, has_projector=False, has_smartboard=False, has_internet=False, has_ac=False, projector_health=100.0, smartboard_health=100.0, internet_health=100.0, ac_health=100.0, complaint_count=0, maintenance_status="active", energy_efficiency_rating=3.0, room_type="LAB", smart_classroom=False, department_block="ME Block", active=True),
            ]
            session.add_all(default_rooms)
            await session.commit()
            print("  - Classroom seed data committed.")

    # 4. Create index optimization query blocks for high-frequency queries
    print("  - Building indexes for performance optimization...")
    async with engine.connect() as conn:
        indexes = [
            ("ix_subjects_course_id", "subjects(course_id)"),
            ("ix_subjects_faculty_id", "subjects(faculty_id)"),
            ("ix_courses_department_id", "courses(department_id)"),
            ("ix_sections_department_id", "sections(department_id)"),
            ("ix_timetable_entries_timetable_id", "timetable_entries(timetable_id)"),
            ("ix_attendance_student_id", "attendance(student_id)"),
            ("ix_attendance_date", "attendance(date)"),
            ("ix_assignments_faculty_id", "assignments(faculty_id)"),
            ("ix_submissions_assignment_id", "submissions(assignment_id)"),
            ("ix_submissions_student_id", "submissions(student_id)"),
            ("ix_users_role", "users(role)"),
            ("ix_users_department", "users(department)")
        ]
        for idx_name, idx_target in indexes:
            try:
                await conn.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {idx_target}"))
                print(f"    + Created or verified index {idx_name}")
            except Exception as e:
                print(f"    (Index {idx_name} creation message: {e})")
        await conn.commit()

    print("Database schema extensions completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_migrations())
