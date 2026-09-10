import asyncio
import random
from datetime import date, timedelta, time
from sqlalchemy import select
from app.database import async_session
from app.models.user import User, Timetable, Announcement, TimetableEntry, TimetableVersion, FacultyLeave
from app.models.attendance import Attendance
from app.models.assignment import Assignment
from app.models.event import Event
from app.models.department import Department, Course, Subject
from app.models.academic import StudyMaterial, InternalMark, SemesterResult, AcademicCalendarEvent
from app.models.placement import Company, Placement, PlacementApplication
from app.models.communication import Notification
from app.services.auth_service import hash_password


async def seed():
    async with async_session() as db:
        # ------------------------------------------------------------------
        # 1. Departments, Courses, and Subjects
        # ------------------------------------------------------------------
        # Seed Departments
        depts_data = [
            ("Computer Science & Engineering", "CSE", "Dr. Amit Kumar"),
            ("Electronics & Communication Engineering", "ECE", "Dr. Rajesh Sharma"),
            ("Mechanical Engineering", "ME", "Dr. Vikram Singh"),
            ("Information Technology", "IT", "Dr. Sunita Rao"),
        ]
        
        depts = []
        for name, code, hod in depts_data:
            res = await db.execute(select(Department).where(Department.code == code))
            dept = res.scalar_one_or_none()
            if not dept:
                dept = Department(name=name, code=code, hod_name=hod, description=f"{name} department")
                db.add(dept)
                await db.flush()
            depts.append(dept)

        # Seed Courses
        courses_data = [
            ("Bachelor of Technology in CSE", "BTECH-CSE", depts[0].id, 4, 180),
            ("Bachelor of Technology in ECE", "BTECH-ECE", depts[1].id, 4, 180),
        ]
        courses = []
        for name, code, dept_id, sem, credits in courses_data:
            res = await db.execute(select(Course).where(Course.code == code))
            course = res.scalar_one_or_none()
            if not course:
                course = Course(name=name, code=code, department_id=dept_id, semester=sem, credits=credits)
                db.add(course)
                await db.flush()
            courses.append(course)

        # ------------------------------------------------------------------
        # 2. Demo Users
        # ------------------------------------------------------------------
        hashed = hash_password("password123")

        users = [
            User(
                name="Rahul Sharma",
                email="student1@campus.com",
                password=hashed,
                role="student",
                department="CSE",
                roll_number="CS001",
                semester=4,
                section="A",
            ),
            User(
                name="Priya Patel",
                email="student2@campus.com",
                password=hashed,
                role="student",
                department="CSE",
                roll_number="CS002",
                semester=6,
                section="A",
            ),
            User(
                name="Dr. Amit Kumar",
                email="faculty1@campus.com",
                password=hashed,
                role="faculty",
                department="CSE",
                employee_id="EMP001",
                staff_room="Block A, Room 101",
            ),
            User(
                name="Dr. Sneha Gupta",
                email="faculty2@campus.com",
                password=hashed,
                role="faculty",
                department="CSE",
                employee_id="EMP002",
                staff_room="Block A, Room 103",
            ),
            User(
                name="Admin User",
                email="admin@campus.com",
                password=hashed,
                role="admin",
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
                name="Suresh Sharma (Parent)",
                email="guardian@campus.com",
                password=hashed,
                role="guardian",
                department="Parent Community",
                phone_number="+91 98765 43210",
            ),
        ]

        for u in users:
            result = await db.execute(select(User).where(User.email == u.email))
            if result.scalar_one_or_none() is None:
                db.add(u)

        await db.flush()

        # Fetch user IDs
        result = await db.execute(select(User).where(User.email == "student1@campus.com"))
        student1 = result.scalar_one()

        result = await db.execute(select(User).where(User.email == "student2@campus.com"))
        student2 = result.scalar_one()

        result = await db.execute(select(User).where(User.email == "faculty1@campus.com"))
        faculty1 = result.scalar_one()

        result = await db.execute(select(User).where(User.email == "faculty2@campus.com"))
        faculty2 = result.scalar_one()

        result = await db.execute(select(User).where(User.email == "admin@campus.com"))
        admin_user = result.scalar_one()

        result = await db.execute(select(User).where(User.email == "hod1@campus.com"))
        hod_user = result.scalar_one()

        # Assign student advisors
        student1.advisor_id = faculty1.id
        student2.advisor_id = faculty2.id
        await db.flush()

        # Seed Subjects
        subjects_data = [
            ("Data Structures", "CS301", courses[0].id, faculty1.id, 4),
            ("Operating Systems", "CS302", courses[0].id, faculty1.id, 4),
            ("Database Systems", "CS303", courses[0].id, faculty2.id, 4),
            ("Computer Networks", "CS304", courses[0].id, faculty2.id, 4),
            ("Software Engineering", "CS305", courses[0].id, faculty1.id, 3),
        ]
        for name, code, course_id, fac_id, credits in subjects_data:
            res = await db.execute(select(Subject).where(Subject.code == code))
            if not res.scalar_one_or_none():
                subj = Subject(name=name, code=code, course_id=course_id, faculty_id=fac_id, semester=4)
                db.add(subj)

        # ------------------------------------------------------------------
        # 3. Timetable for CSE II-A and CSE III-A
        # ------------------------------------------------------------------
        # Find if active CSE II-A timetable exists
        res_t1 = await db.execute(select(Timetable).where(Timetable.department == "CSE", Timetable.year == "II", Timetable.section == "A"))
        if not res_t1.scalar_one_or_none():
            t1 = Timetable(department="CSE", year="II", section="A", is_active=True)
            db.add(t1)
            await db.flush()
            
            timetable_data_ii = [
                ("Monday", "Data Structures", "Dr. Amit Kumar", time(9, 0), time(10, 0), "Room 101"),
                ("Monday", "Operating Systems", "Dr. Amit Kumar", time(10, 0), time(11, 0), "Room 102"),
                ("Monday", "Database Systems", "Dr. Sneha Gupta", time(11, 30), time(12, 30), "Room 103"),
                ("Tuesday", "Computer Networks", "Dr. Sneha Gupta", time(9, 0), time(10, 0), "Room 201"),
                ("Tuesday", "Data Structures", "Dr. Amit Kumar", time(10, 0), time(11, 0), "Room 101"),
                ("Tuesday", "Software Engineering", "Dr. Amit Kumar", time(11, 30), time(12, 30), "Room 202"),
                ("Wednesday", "Operating Systems", "Dr. Amit Kumar", time(9, 0), time(10, 0), "Room 102"),
                ("Wednesday", "Database Systems", "Dr. Sneha Gupta", time(10, 0), time(11, 0), "Room 103"),
                ("Wednesday", "Computer Networks", "Dr. Sneha Gupta", time(11, 30), time(12, 30), "Room 201"),
                ("Thursday", "Software Engineering", "Dr. Amit Kumar", time(9, 0), time(10, 0), "Room 202"),
                ("Thursday", "Data Structures", "Dr. Amit Kumar", time(10, 0), time(11, 0), "Room 101"),
                ("Thursday", "Operating Systems", "Dr. Amit Kumar", time(11, 30), time(12, 30), "Room 102"),
                ("Friday", "Database Systems", "Dr. Sneha Gupta", time(9, 0), time(10, 0), "Room 103"),
                ("Friday", "Computer Networks", "Dr. Sneha Gupta", time(10, 0), time(11, 0), "Room 201"),
                ("Friday", "Software Engineering", "Dr. Amit Kumar", time(11, 30), time(12, 30), "Room 202"),
            ]
            for day, subject, faculty_name, st, et, room in timetable_data_ii:
                db.add(
                    TimetableEntry(
                        timetable_id=t1.id,
                        subject=subject,
                        faculty=faculty_name,
                        room=room,
                        day=day,
                        start_time=st,
                        end_time=et,
                    )
                )

        res_t2 = await db.execute(select(Timetable).where(Timetable.department == "CSE", Timetable.year == "III", Timetable.section == "A"))
        if not res_t2.scalar_one_or_none():
            t2 = Timetable(department="CSE", year="III", section="A", is_active=True)
            db.add(t2)
            await db.flush()

            timetable_data_iii = [
                ("Monday", "Computer Networks", "Dr. Sneha Gupta", time(9, 0), time(10, 0), "Room 201"),
                ("Monday", "Software Engineering", "Dr. Amit Kumar", time(10, 0), time(11, 0), "Room 202"),
                ("Tuesday", "Operating Systems", "Dr. Amit Kumar", time(9, 0), time(10, 0), "Room 102"),
                ("Tuesday", "Database Systems", "Dr. Sneha Gupta", time(11, 30), time(12, 30), "Room 103"),
                ("Wednesday", "Data Structures", "Dr. Amit Kumar", time(9, 0), time(10, 0), "Room 101"),
                ("Wednesday", "Software Engineering", "Dr. Amit Kumar", time(10, 0), time(11, 0), "Room 202"),
                ("Thursday", "Database Systems", "Dr. Sneha Gupta", time(9, 0), time(10, 0), "Room 103"),
                ("Thursday", "Computer Networks", "Dr. Sneha Gupta", time(11, 30), time(12, 30), "Room 201"),
                ("Friday", "Operating Systems", "Dr. Amit Kumar", time(9, 0), time(10, 0), "Room 102"),
                ("Friday", "Data Structures", "Dr. Amit Kumar", time(10, 0), time(11, 0), "Room 101"),
            ]
            for day, subject, faculty_name, st, et, room in timetable_data_iii:
                db.add(
                    TimetableEntry(
                        timetable_id=t2.id,
                        subject=subject,
                        faculty=faculty_name,
                        room=room,
                        day=day,
                        start_time=st,
                        end_time=et,
                    )
                )

        # ------------------------------------------------------------------
        # 4. Attendance records for student1 (last 30 days)
        # ------------------------------------------------------------------
        subjects_list = [
            "Data Structures",
            "Operating Systems",
            "Database Systems",
            "Computer Networks",
            "Software Engineering",
        ]
        present_prob = {
            "Data Structures": 0.85,
            "Operating Systems": 0.80,
            "Database Systems": 0.82,
            "Computer Networks": 0.70,
            "Software Engineering": 0.78,
        }

        result = await db.execute(
            select(Attendance).where(Attendance.student_id == student1.id).limit(1)
        )
        if result.scalar_one_or_none() is None:
            today = date.today()
            random.seed(42)
            for subject in subjects_list:
                for i in range(30):
                    d = today - timedelta(days=30 - i)
                    if d.weekday() >= 5:
                        continue
                    status = (
                        "present"
                        if random.random() < present_prob[subject]
                        else "absent"
                    )
                    db.add(
                        Attendance(
                            student_id=student1.id,
                            faculty_id=faculty1.id,
                            subject=subject,
                            date=d,
                            status=status,
                        )
                    )

        # ------------------------------------------------------------------
        # 5. Assignments
        # ------------------------------------------------------------------
        result = await db.execute(select(Assignment).limit(1))
        if result.scalar_one_or_none() is None:
            assignments = [
                Assignment(
                    title="Data Structures Assignment 3",
                    subject="Data Structures",
                    description="Implement AVL tree operations",
                    due_date=date.today() + timedelta(days=7),
                    faculty_id=faculty1.id,
                ),
                Assignment(
                    title="OS Lab Report",
                    subject="Operating Systems",
                    description="Write a report on process scheduling algorithms",
                    due_date=date.today() + timedelta(days=3),
                    faculty_id=faculty1.id,
                ),
                Assignment(
                    title="Database ER Diagram",
                    subject="Database Systems",
                    description="Design ER diagram for hospital management system",
                    due_date=date.today() + timedelta(days=14),
                    faculty_id=faculty2.id,
                ),
            ]
            for a in assignments:
                db.add(a)

        # ------------------------------------------------------------------
        # 6. Events
        # ------------------------------------------------------------------
        result = await db.execute(select(Event).limit(1))
        if result.scalar_one_or_none() is None:
            events = [
                Event(
                    title="Tech Fest 2024",
                    description="Annual technology festival with coding competitions, hackathons, and tech talks",
                    event_date=date.today() + timedelta(days=30),
                    created_by=admin_user.id,
                ),
                Event(
                    title="Campus Placement Drive",
                    description="Major IT companies visiting for campus placements. Prepare your resumes!",
                    event_date=date.today() + timedelta(days=45),
                    created_by=admin_user.id,
                ),
            ]
            for e in events:
                db.add(e)

        # ------------------------------------------------------------------
        # 7. Announcements
        # ------------------------------------------------------------------
        result = await db.execute(select(Announcement).limit(1))
        if result.scalar_one_or_none() is None:
            announcements = [
                Announcement(
                    title="Mid-Semester Exams Schedule",
                    content="Mid-semester examinations will begin from next month. Check your department notice board for detailed schedule.",
                    created_by=admin_user.id,
                ),
                Announcement(
                    title="Library Hours Extended",
                    content="Library will remain open until 10 PM during exam season. Make use of the extended hours for preparation.",
                    created_by=admin_user.id,
                ),
            ]
            for a in announcements:
                db.add(a)

        # ------------------------------------------------------------------
        # 8. Companies and Placements
        # ------------------------------------------------------------------
        result = await db.execute(select(Company).limit(1))
        if result.scalar_one_or_none() is None:
            companies = [
                Company(name="Google", industry="Software/Internet", website="google.com", description="Internet search and advertising leader"),
                Company(name="Microsoft", industry="Software", website="microsoft.com", description="Leading computer software provider"),
                Company(name="Amazon", industry="E-commerce", website="amazon.com", description="Global e-commerce and cloud giant"),
            ]
            for c in companies:
                db.add(c)
            await db.flush()

            placements = [
                Placement(
                    company_id=companies[0].id,
                    title="Associate Software Engineer",
                    description="Full stack dev engineering role using Go and React.",
                    placement_type="fulltime",
                    package_lpa=18.5,
                    eligibility_criteria="CGPA >= 8.0, No active backlogs",
                    deadline=date.today() + timedelta(days=10),
                    is_active=True,
                ),
                Placement(
                    company_id=companies[1].id,
                    title="Software Engineer Intern",
                    description="Summer software development internship.",
                    placement_type="internship",
                    package_lpa=8.0,
                    eligibility_criteria="CGPA >= 7.5, open to CSE/ECE students",
                    deadline=date.today() + timedelta(days=5),
                    is_active=True,
                ),
            ]
            for p in placements:
                db.add(p)

        # ------------------------------------------------------------------
        # 9. Academic Marks, Results, Calendar Events & Study Materials
        # ------------------------------------------------------------------
        result = await db.execute(select(InternalMark).limit(1))
        if result.scalar_one_or_none() is None:
            marks = [
                InternalMark(student_id=student1.id, subject_name="Data Structures", exam_type="cat1", marks_obtained=42.0, max_marks=50.0, semester=4),
                InternalMark(student_id=student1.id, subject_name="Data Structures", exam_type="cat2", marks_obtained=45.0, max_marks=50.0, semester=4),
                InternalMark(student_id=student1.id, subject_name="Operating Systems", exam_type="cat1", marks_obtained=38.0, max_marks=50.0, semester=4),
                InternalMark(student_id=student1.id, subject_name="Operating Systems", exam_type="cat2", marks_obtained=40.0, max_marks=50.0, semester=4),
            ]
            for m in marks:
                db.add(m)

        result = await db.execute(select(SemesterResult).limit(1))
        if result.scalar_one_or_none() is None:
            results = [
                SemesterResult(student_id=student1.id, semester=3, subject_name="Discrete Mathematics", grade="A", grade_points=9.0, credits=4, sgpa=8.5, cgpa=8.6),
                SemesterResult(student_id=student1.id, semester=3, subject_name="Object Oriented Programming", grade="O", grade_points=10.0, credits=4, sgpa=8.5, cgpa=8.6),
                SemesterResult(student_id=student1.id, semester=3, subject_name="Digital Electronics", grade="B+", grade_points=8.0, credits=4, sgpa=8.5, cgpa=8.6),
            ]
            for r in results:
                db.add(r)

        result = await db.execute(select(AcademicCalendarEvent).limit(1))
        if result.scalar_one_or_none() is None:
            cal_events = [
                AcademicCalendarEvent(title="CAT 1 Examinations", description="Continuous Assessment Test 1", event_date=date.today() + timedelta(days=15), event_type="exam", semester=4),
                AcademicCalendarEvent(title="National Holiday", description="Independence Day holiday", event_date=date.today() + timedelta(days=20), event_type="holiday", semester=4),
                AcademicCalendarEvent(title="Assignment 3 Submission Deadline", description="Submit DS Assignment 3", event_date=date.today() + timedelta(days=7), event_type="deadline", semester=4),
            ]
            for ce in cal_events:
                db.add(ce)

        result = await db.execute(select(StudyMaterial).limit(1))
        if result.scalar_one_or_none() is None:
            materials = [
                StudyMaterial(title="AVL Tree Lecture Notes", description="Comprehensive guide to AVL trees, insertion and rotations", subject_name="Data Structures", uploaded_by=faculty1.id, file_url="https://www.cs.usfca.edu/~galles/visualization/AVLtree.html", material_type="notes"),
                StudyMaterial(title="Process Scheduling Lecture Slides", description="Slides covering FCFS, SJF, RR, Priority scheduling", subject_name="Operating Systems", uploaded_by=faculty1.id, file_url="https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf", material_type="slides"),
            ]
            for mat in materials:
                db.add(mat)

        # ------------------------------------------------------------------
        # 10. Notifications
        # ------------------------------------------------------------------
        result = await db.execute(select(Notification).limit(1))
        if result.scalar_one_or_none() is None:
            notifications = [
                Notification(
                    title="Welcome to Smart Campus!",
                    message="Explore the new AI-powered platform today.",
                    category="announcement",
                    priority="normal",
                    created_by=admin_user.id,
                ),
                Notification(
                    title="New Assignment Posted",
                    message="Dr. Amit Kumar posted Data Structures Assignment 3",
                    category="assignment",
                    priority="normal",
                    created_by=faculty1.id,
                    user_id=student1.id,
                ),
                Notification(
                    title="Urgent: System Maintenance",
                    message="The student portal will be offline for maintenance on Saturday midnight.",
                    category="emergency",
                    priority="high",
                    created_by=admin_user.id,
                ),
                Notification(
                    title="CSE Department Meeting",
                    message="Meeting for all CSE faculty and students regarding final projects.",
                    category="academic",
                    priority="normal",
                    department="CSE",
                    created_by=faculty1.id,
                ),
                Notification(
                    title="Placement Drive: Amazon",
                    message="Amazon is hiring ASE Interns. Registrations open now.",
                    category="placement",
                    priority="high",
                    target_role="student",
                    created_by=admin_user.id,
                ),
            ]
            for n in notifications:
                db.add(n)

        # Seed Faculty Leaves
        res_amit = await db.execute(select(User).where(User.email == "faculty1@campus.com"))
        amit = res_amit.scalar_one()
        
        res_sneha = await db.execute(select(User).where(User.email == "faculty2@campus.com"))
        sneha = res_sneha.scalar_one()

        leaves_to_seed = [
            FacultyLeave(
                faculty_id=sneha.id,
                leave_type="Casual Leave",
                start_date=date.today() - timedelta(days=1),
                end_date=date.today() + timedelta(days=1),
                status="Approved",
                reason="Medical checkup and personal work"
            ),
            FacultyLeave(
                faculty_id=amit.id,
                leave_type="Duty Leave",
                start_date=date.today() + timedelta(days=5),
                end_date=date.today() + timedelta(days=7),
                status="Pending",
                reason="Attending international research conference"
            )
        ]
        
        # Check if already seeded
        leave_check = await db.execute(select(FacultyLeave).limit(1))
        if leave_check.scalar_one_or_none() is None:
            for l in leaves_to_seed:
                db.add(l)

        await db.commit()

    print("Demo data seeded successfully!")
    print()
    print("Login Credentials:")
    print("  Student:  student1@campus.com / password123")
    print("  Student:  student2@campus.com / password123")
    print("  Faculty:  faculty1@campus.com / password123")
    print("  Faculty:  faculty2@campus.com / password123")
    print("  Admin:    admin@campus.com    / password123")


if __name__ == "__main__":
    asyncio.run(seed())

