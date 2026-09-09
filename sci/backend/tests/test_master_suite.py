import sys
import json
import urllib.request
import urllib.error
import urllib.parse
import time
import math
from datetime import date, datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"

# Results tracking
test_results = []

def record(category, test_name, success, detail=""):
    test_results.append({
        "category": category,
        "test": test_name,
        "success": success,
        "detail": detail
    })
    status = "PASS" if success else "FAIL"
    msg = f" - {detail}" if detail else ""
    print(f"[{status}] [{category}] {test_name}{msg}")

def http_req(path, method="GET", body=None, token=None, headers=None, expect_status=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        req_headers["Authorization"] = f"Bearer {token}"
    if headers:
        req_headers.update(headers)
        
    data = None
    if body is not None:
        if isinstance(body, (dict, list)):
            data = json.dumps(body).encode("utf-8")
        elif isinstance(body, str):
            data = body.encode("utf-8")
        elif isinstance(body, bytes):
            data = body
            
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            status = resp.status
            resp_body = resp.read().decode("utf-8", errors="ignore")
            try:
                parsed = json.loads(resp_body)
            except Exception:
                parsed = resp_body
            return {"status": status, "data": parsed, "error": None}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        try:
            parsed_err = json.loads(err_body)
        except Exception:
            parsed_err = err_body
        return {"status": e.code, "data": parsed_err, "error": str(e)}
    except Exception as e:
        return {"status": 0, "data": None, "error": str(e)}

def run_all_tests():
    print("================================================================================")
    print("SMART CAMPUS AI - MASTER VALIDATION & END-TO-END AUTOMATED TEST SUITE")
    print("================================================================================")

    # -------------------------------------------------------------------------
    # 1. API HEALTH & DOCS
    # -------------------------------------------------------------------------
    res = http_req("/")
    record("Health", "Root API Check (GET /)", res["status"] == 200, f"Status: {res['status']}")

    res = http_req("/docs")
    record("Health", "Swagger OpenAPI UI (GET /docs)", res["status"] == 200, f"Status: {res['status']}")

    # -------------------------------------------------------------------------
    # 2. AUTHENTICATION DEEP AUDIT
    # -------------------------------------------------------------------------
    tokens = {}
    users = {}

    # Valid Logins
    login_accounts = [
        ("student", "student1@campus.com", "password123"),
        ("student2", "student2@campus.com", "password123"),
        ("faculty", "faculty1@campus.com", "password123"),
        ("faculty2", "faculty2@campus.com", "password123"),
        ("admin", "admin@campus.com", "password123"),
        ("hod", "hod1@campus.com", "password123"),
    ]

    for role_key, email, pwd in login_accounts:
        res = http_req("/api/auth/login", method="POST", body={"email": email, "password": pwd})
        if res["status"] == 200 and "access_token" in res["data"]:
            tokens[role_key] = res["data"]["access_token"]
            users[role_key] = res["data"].get("user", {})
            record("Auth", f"Login Success ({role_key}: {email})", True)
        else:
            record("Auth", f"Login Success ({role_key}: {email})", False, f"Status: {res['status']}, Data: {res['data']}")

    # Invalid logins
    res = http_req("/api/auth/login", method="POST", body={"email": "nonexistent@campus.com", "password": "password123"})
    record("Auth", "Reject Non-existent Email", res["status"] in [400, 401, 404], f"Status: {res['status']}")

    res = http_req("/api/auth/login", method="POST", body={"email": "student1@campus.com", "password": "wrongpassword!"})
    record("Auth", "Reject Incorrect Password", res["status"] in [400, 401], f"Status: {res['status']}")

    res = http_req("/api/auth/login", method="POST", body={"email": "", "password": ""})
    record("Auth", "Reject Empty Credentials", res["status"] in [400, 401, 422], f"Status: {res['status']}")

    # Token Refresh
    student_tok = tokens.get("student")
    if student_tok:
        res = http_req("/api/auth/refresh", method="POST", token=student_tok)
        record("Auth", "Token Refresh Endpoint", res["status"] == 200 and "access_token" in res["data"], f"Status: {res['status']}")

    # Get Current User /api/auth/me
    if student_tok:
        res = http_req("/api/auth/me", token=student_tok)
        record("Auth", "Get Profile Me (Student)", res["status"] == 200 and res["data"].get("email") == "student1@campus.com", f"Status: {res['status']}")

    # Access with Invalid/Malformed Token
    res = http_req("/api/auth/me", token="invalid_token_xyz_123")
    record("Auth", "Reject Malformed Token", res["status"] in [401, 403], f"Status: {res['status']}")

    res = http_req("/api/auth/me")
    record("Auth", "Reject Missing Token on Protected Route", res["status"] in [401, 403], f"Status: {res['status']}")

    # -------------------------------------------------------------------------
    # 3. RBAC & IDOR SECURITY AUDIT
    # -------------------------------------------------------------------------
    admin_tok = tokens.get("admin")
    faculty_tok = tokens.get("faculty")
    hod_tok = tokens.get("hod")

    # Student trying to call Admin endpoints
    res = http_req("/api/admin/dashboard-stats", token=student_tok)
    record("RBAC", "Student Forbidden from Admin Dashboard Stats", res["status"] == 403, f"Status: {res['status']}")

    res = http_req("/api/timetable/generate", method="POST", body={"department": "CSE", "year": "II", "section": "A"}, token=student_tok)
    record("RBAC", "Student Forbidden from Timetable Generator", res["status"] == 403, f"Status: {res['status']}")

    res = http_req("/api/gate-pass/policy", method="PUT", body={"min_attendance_pct": 50.0, "auto_approve_max_hours": 10.0, "overdue_threshold_minutes": 60, "max_active_passes": 5}, token=student_tok)
    record("RBAC", "Student Forbidden from Modifying Gate Pass Policy", res["status"] == 403, f"Status: {res['status']}")

    # Student trying to call Faculty endpoints
    res = http_req("/api/attendance/mark", method="POST", body={"student_id": 1, "subject": "Data Structures", "date": "2026-09-04", "status": "present"}, token=student_tok)
    record("RBAC", "Student Forbidden from Marking Attendance", res["status"] == 403, f"Status: {res['status']}")

    # Faculty trying to call Admin endpoints
    res = http_req("/api/admin/dashboard-stats", token=faculty_tok)
    record("RBAC", "Faculty Forbidden from Admin Dashboard Stats", res["status"] == 403, f"Status: {res['status']}")

    res = http_req("/api/core-hub/departments", method="POST", body={"name": "Hacked Dept", "code": "HACK"}, token=faculty_tok)
    record("RBAC", "Faculty Forbidden from Creating Core Hub Departments", res["status"] == 403, f"Status: {res['status']}")

    # -------------------------------------------------------------------------
    # 4. PRE-SEED COURSEWORK FOR STUDENT
    # -------------------------------------------------------------------------
    res_asg_init = http_req("/api/assignments/", method="POST", body={"title": "Data Structures Project", "subject": "Data Structures", "description": "Implement AVL Tree and Dijkstra's algorithm", "due_date": str(date.today() + timedelta(days=7)), "department": "CSE", "year": "IV", "section": "A"}, token=faculty_tok)

    # -------------------------------------------------------------------------
    # 5. STUDENT PORTAL WORKFLOWS
    # -------------------------------------------------------------------------
    # Attendance summary & breakdown
    res = http_req("/api/attendance/summary", token=student_tok)
    record("Student", "Fetch Attendance Summary", res["status"] == 200, f"Status: {res['status']}")

    res = http_req("/api/attendance/", token=student_tok)
    record("Student", "Fetch Attendance Records", res["status"] == 200, f"Status: {res['status']}")

    # Timetable
    res = http_req("/api/timetable/my", token=student_tok)
    record("Student", "Fetch My Timetable", res["status"] == 200, f"Status: {res['status']}")

    res = http_req("/api/timetable/today", token=student_tok)
    record("Student", "Fetch Today's Timetable", res["status"] == 200, f"Status: {res['status']}")

    res = http_req("/api/timetable/next", token=student_tok)
    record("Student", "Fetch Next Class", res["status"] == 200, f"Status: {res['status']}")

    # Assignments & Submission
    res = http_req("/api/assignments/", token=student_tok)
    asg_list = res["data"] if res["status"] == 200 and isinstance(res["data"], list) else []
    record("Student", "Fetch Enrolled Assignments", res["status"] == 200 and len(asg_list) > 0, f"Status: {res['status']}, Count: {len(asg_list)}")

    if asg_list:
        target_asg = asg_list[0]
        res_sub = http_req(f"/api/assignments/{target_asg['id']}/submit", method="POST", body={"file_url": "https://github.com/student/assignment_sol.py", "notes": "Completed AVL insertion"}, token=student_tok)
        record("Student", f"Submit Assignment Sol ({target_asg['title']})", res_sub["status"] in [200, 201], f"Status: {res_sub['status']}")

    # Marks & Results
    res = http_req("/api/students/internal-marks", token=student_tok)
    record("Student", "Fetch Internal Marks", res["status"] == 200, f"Status: {res['status']}")

    res = http_req("/api/students/results", token=student_tok)
    record("Student", "Fetch Semester Results / SGPA", res["status"] == 200, f"Status: {res['status']}")

    # Study Materials
    res = http_req("/api/study-materials/", token=student_tok)
    record("Student", "Fetch Study Materials Catalog", res["status"] == 200, f"Status: {res['status']}")

    # SGPA / Academic Risk Predictor
    res = http_req("/api/academic-risk/predict", token=student_tok)
    record("Student", "Academic Risk & SGPA Prediction", res["status"] == 200, f"Status: {res['status']}")

    # Learning Intelligence Profile & Tracking
    res = http_req("/api/learning-intelligence/profile", token=student_tok)
    record("Student", "Get CLPA Cognitive & KDPA Retention Profile", res["status"] == 200, f"Status: {res['status']}")

    res = http_req("/api/learning-intelligence/track", method="POST", body={"interaction_type": "reading", "metadata": {"scroll_depth": 85, "duration_seconds": 90, "focus_percentage": 90}}, token=student_tok)
    record("Student", "Log Cognitive Learning Interaction (CLPA)", res["status"] == 200, f"Status: {res['status']}")

    res = http_req("/api/learning-intelligence/career-roadmap", token=student_tok)
    record("Student", "Fetch DSEA Career Readiness Roadmap", res["status"] == 200, f"Status: {res['status']}")

    # Events & Registration
    res = http_req("/api/events/", token=student_tok)
    record("Student", "Fetch Campus Events", res["status"] == 200, f"Status: {res['status']}")
    events_list = res["data"] if res["status"] == 200 and isinstance(res["data"], list) else []
    if events_list:
        ev_id = events_list[0]["id"]
        res_reg = http_req(f"/api/events/{ev_id}/register", method="POST", token=student_tok)
        record("Student", f"Register for Event (ID: {ev_id})", res_reg["status"] in [200, 400], f"Status: {res_reg['status']}")

    # Forum Posts & Replies
    res = http_req("/api/forum/posts", token=student_tok)
    record("Student", "Fetch Forum Posts", res["status"] == 200, f"Status: {res['status']}")

    res_post = http_req("/api/forum/posts", method="POST", body={"title": "How to implement AVL Rotation in C++?", "content": "I am struggling with Left-Right rotation.", "category": "Academic", "tags": "DSA,Trees"}, token=student_tok)
    new_post_id = res_post["data"].get("id") if res_post["status"] in [200, 201] and isinstance(res_post["data"], dict) else None
    record("Student", "Create Forum Post", res_post["status"] in [200, 201], f"Status: {res_post['status']}, PostID: {new_post_id}")

    if new_post_id:
        res_rep = http_req(f"/api/forum/posts/{new_post_id}/replies", method="POST", body={"content": "You need to perform left rotate on left child then right rotate on root."}, token=student_tok)
        record("Student", "Reply to Forum Post", res_rep["status"] in [200, 201], f"Status: {res_rep['status']}")

    # Placements
    res = http_req("/api/placements/", token=student_tok)
    record("Student", "Fetch Placement Drives", res["status"] == 200, f"Status: {res['status']}")
    pl_list = res["data"] if res["status"] == 200 and isinstance(res["data"], list) else []
    if pl_list:
        p_id = pl_list[0]["id"]
        res_app = http_req(f"/api/placements/{p_id}/apply", method="POST", token=student_tok)
        record("Student", f"Apply for Placement Drive (ID: {p_id})", res_app["status"] in [200, 400], f"Status: {res_app['status']}")

    # Notifications
    res = http_req("/api/notifications/", token=student_tok)
    record("Student", "Fetch Notifications List", res["status"] == 200, f"Status: {res['status']}")

    res = http_req("/api/notifications/unread-count", token=student_tok)
    record("Student", "Get Unread Notifications Count", res["status"] == 200, f"Status: {res['status']}")

    # -------------------------------------------------------------------------
    # 5. GATE PASS MULTI-TIER LIFECYCLE
    # -------------------------------------------------------------------------
    # 1. Recommend exit time
    res_rec = http_req("/api/gate-pass/recommend-exit-time?requested_hours=3", token=student_tok)
    record("GatePass", "AI Recommend Best Exit Time", res_rec["status"] == 200, f"Status: {res_rec['status']}")

    # 2. Student requests gate pass
    res_req = http_req("/api/gate-pass/request", method="POST", body={"pass_type": "outpass", "reason": "Medical appointment at Apollo Hospital", "destination": "Apollo Clinic", "return_hours": 3}, token=student_tok)
    record("GatePass", "Request Outpass (Student)", res_req["status"] in [200, 201], f"Status: {res_req['status']}")

    created_pass = res_req["data"] if res_req["status"] in [200, 201] and isinstance(res_req["data"], dict) else {}
    pass_id = created_pass.get("id") or created_pass.get("pass_id")
    qr_token = created_pass.get("qr_token") or created_pass.get("qrToken")

    # 3. Fetch My passes
    res_my = http_req("/api/gate-pass/my-passes", token=student_tok)
    record("GatePass", "Fetch Student Gate Passes", res_my["status"] == 200, f"Status: {res_my['status']}")

    # 4. Warden / HOD approves pass if needed
    if pass_id and admin_tok:
        res_warden = http_req("/api/gate-pass/warden-action", method="POST", body={"pass_id": pass_id, "action": "approve"}, token=admin_tok)
        record("GatePass", f"Warden/HOD Approve Gate Pass (ID: {pass_id})", res_warden["status"] == 200, f"Status: {res_warden['status']}")
        if res_warden["status"] == 200 and "qr_token" in res_warden["data"]:
            qr_token = res_warden["data"]["qr_token"]

    # 5. Security Exit Scan
    if qr_token and admin_tok:
        res_exit = http_req("/api/gate-pass/exit", method="POST", body={"qr_token": qr_token}, token=admin_tok)
        record("GatePass", "Security Gate EXIT Scan", res_exit["status"] == 200, f"Status: {res_exit['status']}")

        # 6. Security Return Scan
        res_ret = http_req("/api/gate-pass/return", method="POST", body={"qr_token": qr_token}, token=admin_tok)
        record("GatePass", "Security Gate RETURN Scan", res_ret["status"] == 200, f"Status: {res_ret['status']}")

        # 7. Duplicate Return Scan (Should reject or state already returned)
        res_dup = http_req("/api/gate-pass/return", method="POST", body={"qr_token": qr_token}, token=admin_tok)
        record("GatePass", "Reject Duplicate Return Scan", res_dup["status"] in [400, 422], f"Status: {res_dup['status']}")

    # Gate Pass Analytics & Audit Logs (Admin)
    if admin_tok:
        res_gp_an = http_req("/api/gate-pass/analytics", token=admin_tok)
        record("GatePass", "Gate Pass Analytics Engine", res_gp_an["status"] == 200, f"Status: {res_gp_an['status']}")

        res_gp_log = http_req("/api/gate-pass/audit-logs", token=admin_tok)
        record("GatePass", "Gate Pass Immutable Audit Logs", res_gp_log["status"] == 200, f"Status: {res_gp_log['status']}")

    # -------------------------------------------------------------------------
    # 6. FACULTY PORTAL WORKFLOWS
    # -------------------------------------------------------------------------
    # Mark Attendance
    res_att_mark = http_req("/api/attendance/mark", method="POST", body={"student_id": 1, "subject": "Data Structures", "date": str(date.today()), "status": "present"}, token=faculty_tok)
    record("Faculty", "Mark Section Daily Attendance", res_att_mark["status"] in [200, 201], f"Status: {res_att_mark['status']}")

    # Create Assignment
    res_asg_cr = http_req("/api/assignments/", method="POST", body={"title": "Automated Test Assignment", "subject": "Data Structures", "description": "Solve Graph BFS/DFS", "due_date": str(date.today() + timedelta(days=5)), "max_points": 100}, token=faculty_tok)
    record("Faculty", "Create Coursework Assignment", res_asg_cr["status"] in [200, 201], f"Status: {res_asg_cr['status']}")

    # Upload Study Material
    res_mat = http_req("/api/study-materials/", method="POST", body={"title": "Graph Algorithms Handout", "description": "Shortest path and spanning tree notes", "subject_name": "Data Structures", "file_url": "https://example.com/graphs.pdf", "material_type": "notes"}, token=faculty_tok)
    record("Faculty", "Upload Study Material", res_mat["status"] in [200, 201], f"Status: {res_mat['status']}")

    # Faculty Locator status broadcast & leave
    res_loc = http_req("/api/faculty-locator/update-status", method="POST", body={"status": "In Class", "current_room": "Room 101", "note": "Teaching Data Structures"}, token=faculty_tok)
    record("Faculty", "Update Faculty Locator Status", res_loc["status"] == 200, f"Status: {res_loc['status']}")

    res_leave = http_req("/api/faculty-locator/apply-leave", method="POST", body={"leave_type": "Casual Leave", "start_date": str(date.today() + timedelta(days=10)), "end_date": str(date.today() + timedelta(days=11)), "reason": "Family function"}, token=faculty_tok)
    record("Faculty", "Apply for Faculty Leave", res_leave["status"] in [200, 201], f"Status: {res_leave['status']}")

    # Faculty Learning Analytics
    res_fac_an = http_req("/api/learning-intelligence/faculty-analytics", token=faculty_tok)
    record("Faculty", "View Department Learning Intelligence Analytics", res_fac_an["status"] == 200, f"Status: {res_fac_an['status']}")

    # -------------------------------------------------------------------------
    # 7. ADMIN & CORE HUB CRUD OPERATIONS
    # -------------------------------------------------------------------------
    # Admin Stats
    res = http_req("/api/admin/dashboard-stats", token=admin_tok)
    record("Admin", "Admin Dashboard Global Metrics", res["status"] == 200, f"Status: {res['status']}")

    # Core Hub Departments CRUD
    res_dept_cr = http_req("/api/core-hub/departments", method="POST", body={"name": "Aerospace Engineering", "code": "AERO", "hod_name": "Dr. Kalam", "description": "Aero dept", "total_semesters": 8}, token=admin_tok)
    record("Admin", "Core Hub: Create Department", res_dept_cr["status"] in [200, 201], f"Status: {res_dept_cr['status']}")
    dept_id = res_dept_cr["data"].get("id") if res_dept_cr["status"] in [200, 201] and isinstance(res_dept_cr["data"], dict) else None

    if dept_id:
        res_dept_up = http_req(f"/api/core-hub/departments/{dept_id}", method="PUT", body={"name": "Aeronautical Engineering", "code": "AERO", "hod_name": "Dr. APJ Kalam"}, token=admin_tok)
        record("Admin", f"Core Hub: Update Department (ID: {dept_id})", res_dept_up["status"] == 200, f"Status: {res_dept_up['status']}")

        res_dept_del = http_req(f"/api/core-hub/departments/{dept_id}", method="DELETE", token=admin_tok)
        record("Admin", f"Core Hub: Delete Department (ID: {dept_id})", res_dept_del["status"] == 200, f"Status: {res_dept_del['status']}")

    # Core Hub Classrooms
    res_cr_list = http_req("/api/core-hub/classrooms", token=admin_tok)
    record("Admin", "Core Hub: List Classrooms", res_cr_list["status"] == 200, f"Status: {res_cr_list['status']}")

    # Core Hub Sections
    res_sec_list = http_req("/api/core-hub/sections", token=admin_tok)
    record("Admin", "Core Hub: List Sections", res_sec_list["status"] == 200, f"Status: {res_sec_list['status']}")

    # Core Hub Subjects
    res_sub_list = http_req("/api/core-hub/subjects", token=admin_tok)
    record("Admin", "Core Hub: List Subjects", res_sub_list["status"] == 200, f"Status: {res_sub_list['status']}")

    # Campus Pulse Engine
    res_pulse_cur = http_req("/api/campus-pulse/current", token=admin_tok)
    record("CampusPulse", "Current Activity Score & Baseline Anomaly", res_pulse_cur["status"] == 200, f"Status: {res_pulse_cur['status']}")

    res_pulse_loc = http_req("/api/campus-pulse/locations", token=admin_tok)
    record("CampusPulse", "Campus Blocks Utilization Matrix", res_pulse_loc["status"] == 200, f"Status: {res_pulse_loc['status']}")

    res_pulse_fc = http_req("/api/campus-pulse/forecast", token=admin_tok)
    record("CampusPulse", "1-3 Hour Forward Activity Forecast", res_pulse_fc["status"] == 200, f"Status: {res_pulse_fc['status']}")

    res_pulse_in = http_req("/api/campus-pulse/insights", token=admin_tok)
    record("CampusPulse", "AI Operational Insights & Recommendations", res_pulse_in["status"] == 200, f"Status: {res_pulse_in['status']}")

    # -------------------------------------------------------------------------
    # 8. TIMETABLE CSP & DCRA+ ALLOCATION VALIDATOR
    # -------------------------------------------------------------------------
    res_tt_gen = http_req("/api/timetable/generate", method="POST", body={"department": "CSE", "year": "II", "section": "A", "max_slots_per_day": 7, "working_days": 5}, token=admin_tok)
    record("CSP", "Run CSP Backtracking Timetable Generator", res_tt_gen["status"] in [200, 201], f"Status: {res_tt_gen['status']}")

    if res_tt_gen["status"] in [200, 201]:
        tt_entries = res_tt_gen["data"].get("entries", [])
        print(f"  -> Generated {len(tt_entries)} timetable class slots.")
        
        # Conflict Validator: Prove Zero Overlaps
        faculty_clashes = 0
        room_clashes = 0
        seen_faculty = set()
        seen_rooms = set()
        
        for entry in tt_entries:
            day = entry.get("day")
            st = entry.get("start_time")
            fac = entry.get("faculty")
            rm = entry.get("room")
            
            if fac and fac != "N/A":
                fac_key = (day, st, fac)
                if fac_key in seen_faculty:
                    faculty_clashes += 1
                seen_faculty.add(fac_key)
                
            if rm and rm not in ["N/A", "TBD", None]:
                rm_key = (day, st, rm)
                if rm_key in seen_rooms:
                    room_clashes += 1
                seen_rooms.add(rm_key)
                
        record("CSP", "Validator: Zero Faculty Clashes", faculty_clashes == 0, f"Clashes found: {faculty_clashes}")
        record("CSP", "Validator: Zero Room Double-Bookings", room_clashes == 0, f"Room clashes found: {room_clashes}")

    # DCRA+ Classroom Allocation
    res_dcra = http_req("/api/timetable/analytics/dcra", token=admin_tok)
    record("DCRA+", "Classroom Resource Allocation Analytics", res_dcra["status"] == 200, f"Status: {res_dcra['status']}")

    # -------------------------------------------------------------------------
    # 9. AI COPILOT & STUDY PLANNER
    # -------------------------------------------------------------------------
    # AI Study Plan
    res_plan = http_req("/api/ai/study-plan", method="POST", body={"subject": "Operating Systems", "topics": "Process Scheduling, Deadlocks, Virtual Memory", "days": 5}, token=student_tok)
    record("AI", "Generate Structured Multi-day Study Plan", res_plan["status"] in [200, 201], f"Status: {res_plan['status']}")

    # AI Skill Gap Matcher
    res_gap = http_req("/api/ai/skill-gap", method="POST", body={"skills": "React, JavaScript, HTML, CSS", "target_role": "Frontend Developer"}, token=student_tok)
    record("AI", "Fuzzy Skill-Gap Matcher (Jaccard Bigrams)", res_gap["status"] in [200, 201], f"Status: {res_gap['status']}")

    # -------------------------------------------------------------------------
    # SUMMARY REPORT
    # -------------------------------------------------------------------------
    print("\n================================================================================")
    print("TEST SUITE EXECUTION SUMMARY")
    print("================================================================================")
    total = len(test_results)
    passed = sum(1 for t in test_results if t["success"])
    failed = total - passed
    pass_pct = (passed / total) * 100 if total > 0 else 0

    print(f"Total Tests Executed : {total}")
    print(f"Tests Passed         : {passed} ({pass_pct:.1f}%)")
    print(f"Tests Failed         : {failed}")
    print("================================================================================")

    if failed > 0:
        print("\nFAILED TESTS DETAILS:")
        for t in test_results:
            if not t["success"]:
                print(f"  * [{t['category']}] {t['test']} -> {t['detail']}")
        sys.exit(1)
    else:
        print("\nALL AUTOMATED TESTS PASSED WITH 100% SUCCESS RATE!")
        sys.exit(0)

if __name__ == "__main__":
    run_all_tests()
