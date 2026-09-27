import sys
import json
from datetime import date
from fastapi.testclient import TestClient

# Ensure backend directory is in python path
sys.path.append(".")

try:
    from app.main import app
except ImportError as e:
    print(f"Error: Could not import app.main. Make sure you run this from the backend directory. {e}")
    sys.exit(1)

client = TestClient(app)

# Global test state
test_results = []
tokens = {}
user_ids = {}

def record_test(name, success, message=""):
    test_results.append({
        "name": name,
        "success": success,
        "message": message
    })
    status_icon = "PASS" if success else "FAIL"
    msg_suffix = f" - {message}" if message else ""
    print(f"[{status_icon}] : {name}{msg_suffix}")

print("==================================================")
print("Starting Smart Campus AI Endpoint Test Suite")
print("==================================================")

# 1. Basic Health & Docs Check
try:
    response = client.get("/")
    if response.status_code == 200 and "status" in response.json():
        record_test("Root Health Check (GET /)", True)
    else:
        record_test("Root Health Check (GET /)", False, f"Status: {response.status_code}, Body: {response.text}")
except Exception as e:
    record_test("Root Health Check (GET /)", False, str(e))

try:
    response = client.get("/openapi.json")
    if response.status_code == 200:
        schema = response.json()
        record_test("OpenAPI Schema (GET /openapi.json)", True, f"Title: '{schema.get('info', {}).get('title')}'")
    else:
        record_test("OpenAPI Schema (GET /openapi.json)", False, f"Status: {response.status_code}")
except Exception as e:
    record_test("OpenAPI Schema (GET /openapi.json)", False, str(e))

try:
    response = client.get("/docs")
    if response.status_code == 200:
        record_test("Swagger Documentation UI (GET /docs)", True)
    else:
        record_test("Swagger Documentation UI (GET /docs)", False, f"Status: {response.status_code}")
except Exception as e:
    record_test("Swagger Documentation UI (GET /docs)", False, str(e))


# Helper function to login and fetch token
def login_as(email, password, role_name):
    try:
        response = client.post("/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            data = response.json()
            tokens[role_name] = data["token"]
            user_ids[role_name] = data["user_id"]
            record_test(f"Authentication - Login as {role_name.capitalize()}", True, f"User ID: {data['user_id']}")
            return True
        else:
            record_test(f"Authentication - Login as {role_name.capitalize()}", False, f"Status: {response.status_code}, Detail: {response.text}")
            return False
    except Exception as e:
        record_test(f"Authentication - Login as {role_name.capitalize()}", False, str(e))
        return False

# Attempt Logins (requires database to be seeded)
print("\nLogging in to retrieve authorization tokens...")
student_ok = login_as("student1@campus.com", "password123", "student")
faculty_ok = login_as("faculty1@campus.com", "password123", "faculty")
admin_ok = login_as("admin@campus.com", "password123", "admin")

if not (student_ok or faculty_ok or admin_ok):
    print("\nWARNING: All login attempts failed. Ensure that the database is initialized and seeded:")
    print("  .\\venv\\Scripts\\python.exe create_tables.py")
    print("  .\\venv\\Scripts\\python.exe seed_data.py")
    print("Tests requiring authentication will be skipped.\n")

# Helper for authenticated headers
def get_auth_headers(role):
    return {"Authorization": f"Bearer {tokens[role]}"}

# 2. Student Role Tests
if student_ok:
    print("\nRunning Student Endpoints Tests...")
    headers = get_auth_headers("student")
    
    # Auth Profile (/api/auth/me)
    try:
        res = client.get("/api/auth/me", headers=headers)
        if res.status_code == 200 and res.json().get("role") == "student":
            record_test("Auth Profile (GET /api/auth/me)", True, f"Name: {res.json().get('name')}")
        else:
            record_test("Auth Profile (GET /api/auth/me)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Auth Profile (GET /api/auth/me)", False, str(e))

    # Student Me (/api/students/me)
    try:
        res = client.get("/api/students/me", headers=headers)
        if res.status_code == 200:
            record_test("Student Profile (GET /api/students/me)", True, f"Roll: {res.json().get('roll_number')}")
        else:
            record_test("Student Profile (GET /api/students/me)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Student Profile (GET /api/students/me)", False, str(e))

    # Student Dashboard (/api/students/dashboard)
    try:
        res = client.get("/api/students/dashboard", headers=headers)
        if res.status_code == 200:
            data = res.json()
            record_test("Student Dashboard (GET /api/students/dashboard)", True, 
                        f"Attendance %: {data.get('attendance_percentage', 'N/A')}, Pending assignments: {data.get('pending_assignments', 'N/A')}")
        else:
            record_test("Student Dashboard (GET /api/students/dashboard)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Student Dashboard (GET /api/students/dashboard)", False, str(e))

    # Student Timetable Today (/api/students/timetable/today)
    try:
        res = client.get("/api/students/timetable/today", headers=headers)
        if res.status_code == 200:
            record_test("Student Timetable Today (GET /api/students/timetable/today)", True, f"Classes count: {len(res.json().get('classes', []))}")
        else:
            record_test("Student Timetable Today (GET /api/students/timetable/today)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Student Timetable Today (GET /api/students/timetable/today)", False, str(e))

    # Attendance My (/api/attendance/my)
    try:
        res = client.get("/api/attendance/my", headers=headers)
        if res.status_code == 200:
            record_test("Student Attendance Records (GET /api/attendance/my)", True, f"Subjects track: {len(res.json())}")
        else:
            record_test("Student Attendance Records (GET /api/attendance/my)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Student Attendance Records (GET /api/attendance/my)", False, str(e))

    # Placements List (/api/placements/)
    try:
        res = client.get("/api/placements/", headers=headers)
        if res.status_code == 200:
            record_test("Placements List (GET /api/placements/)", True, f"Postings count: {len(res.json())}")
        else:
            record_test("Placements List (GET /api/placements/)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Placements List (GET /api/placements/)", False, str(e))

    # Placements Companies List (/api/placements/companies)
    try:
        res = client.get("/api/placements/companies", headers=headers)
        if res.status_code == 200:
            record_test("Placements Companies List (GET /api/placements/companies)", True, f"Companies count: {len(res.json())}")
        else:
            record_test("Placements Companies List (GET /api/placements/companies)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Placements Companies List (GET /api/placements/companies)", False, str(e))

    # Events List (/api/events/)
    try:
        res = client.get("/api/events/", headers=headers)
        if res.status_code == 200:
            record_test("Events List (GET /api/events/)", True, f"Events count: {len(res.json())}")
        else:
            record_test("Events List (GET /api/events/)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Events List (GET /api/events/)", False, str(e))

    # Announcements List (/api/announcements/)
    try:
        res = client.get("/api/announcements/", headers=headers)
        if res.status_code == 200:
            record_test("Announcements List (GET /api/announcements/)", True, f"Announcements count: {len(res.json())}")
        else:
            record_test("Announcements List (GET /api/announcements/)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Announcements List (GET /api/announcements/)", False, str(e))

    # Timetable My (/api/timetable/my)
    try:
        res = client.get("/api/timetable/my", headers=headers)
        if res.status_code == 200:
            record_test("Student Timetable My (GET /api/timetable/my)", True, f"Entries count: {len(res.json())}")
        else:
            record_test("Student Timetable My (GET /api/timetable/my)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Student Timetable My (GET /api/timetable/my)", False, str(e))

    # Study Materials List (/api/study-materials/)
    try:
        res = client.get("/api/study-materials/", headers=headers)
        if res.status_code == 200:
            record_test("Study Materials List (GET /api/study-materials/)", True, f"Materials count: {len(res.json())}")
        else:
            record_test("Study Materials List (GET /api/study-materials/)", False, f"Status: {res.status_code}")
    except Exception as e:
        record_test("Study Materials List (GET /api/study-materials/)", False, str(e))

    # 3. Authorization Role Check (Student should fail Admin actions)
    try:
        res = client.post("/api/placements/companies", headers=headers, json={
            "name": "Unauthorized Company",
            "industry": "Tech"
        })
        if res.status_code == 403:
            record_test("Authorization - Student blocked from Admin Company Create (POST)", True)
        else:
            record_test("Authorization - Student blocked from Admin Company Create (POST)", False, f"Status: {res.status_code} (Expected 403)")
    except Exception as e:
        record_test("Authorization - Student blocked from Admin Company Create (POST)", False, str(e))

# 4. Faculty Role Tests
if faculty_ok:
    print("\nRunning Faculty Endpoints Tests...")
    headers = get_auth_headers("faculty")
    
    # Mark Attendance (POST /api/attendance/mark)
    try:
        res = client.post("/api/attendance/mark", headers=headers, json={
            "student_id": user_ids.get("student", 1),
            "subject": "Data Structures",
            "date": str(date.today()),
            "status": "present"
        })
        if res.status_code == 200:
            record_test("Faculty Mark Attendance (POST /api/attendance/mark)", True)
        else:
            record_test("Faculty Mark Attendance (POST /api/attendance/mark)", False, f"Status: {res.status_code}, Detail: {res.text}")
    except Exception as e:
        record_test("Faculty Mark Attendance (POST /api/attendance/mark)", False, str(e))

# 5. Admin Role Tests
if admin_ok:
    print("\nRunning Admin Endpoints Tests...")
    headers = get_auth_headers("admin")
    
    # Create Company (POST /api/placements/companies)
    company_id = None
    try:
        res = client.post("/api/placements/companies", headers=headers, json={
            "name": "Test Google Inc",
            "industry": "Internet Technology",
            "website": "https://google.com",
            "description": "Search and AI Services"
        })
        if res.status_code == 200:
            company_id = res.json().get("id")
            record_test("Admin Create Company (POST /api/placements/companies)", True, f"Company ID: {company_id}")
        else:
            record_test("Admin Create Company (POST /api/placements/companies)", False, f"Status: {res.status_code}, Detail: {res.text}")
    except Exception as e:
        record_test("Admin Create Company (POST /api/placements/companies)", False, str(e))

    # Create Placement Listing (POST /api/placements/)
    if company_id:
        try:
            res = client.post("/api/placements/", headers=headers, json={
                "company_id": company_id,
                "title": "Software Development Engineer Test",
                "description": "Build tests and write automated script architectures.",
                "placement_type": "fulltime",
                "package_lpa": 18.5,
                "eligibility_criteria": "CGPA > 8.0, CSE/ECE only",
                "deadline": str(date.today())
            })
            if res.status_code == 200:
                record_test("Admin Create Placement Job (POST /api/placements/)", True)
            else:
                record_test("Admin Create Placement Job (POST /api/placements/)", False, f"Status: {res.status_code}, Detail: {res.text}")
        except Exception as e:
            record_test("Admin Create Placement Job (POST /api/placements/)", False, str(e))

    # Create Announcement (POST /api/announcements/)
    try:
        res = client.post("/api/announcements/", headers=headers, json={
            "title": "Endpoint Test Run Emergency Notice",
            "content": "Automated system test run announcement.",
            "target_role": "all",
            "target_dept": "all",
            "is_emergency": True
        })
        if res.status_code == 200:
            record_test("Admin Create Announcement (POST /api/announcements/)", True)
        else:
            record_test("Admin Create Announcement (POST /api/announcements/)", False, f"Status: {res.status_code}, Detail: {res.text}")
    except Exception as e:
        record_test("Admin Create Announcement (POST /api/announcements/)", False, str(e))

    # Create Event (POST /api/events/)
    try:
        res = client.post("/api/events/", headers=headers, json={
            "title": "Smart Campus AI Technical Symposia",
            "description": "A technical gathering showcasing Gemini AI applications.",
            "event_date": str(date.today())
        })
        if res.status_code == 200:
            record_test("Admin Create Event (POST /api/events/)", True)
        else:
            record_test("Admin Create Event (POST /api/events/)", False, f"Status: {res.status_code}, Detail: {res.text}")
    except Exception as e:
        record_test("Admin Create Event (POST /api/events/)", False, str(e))


# 6. Test Summary Report
print("\n" + "="*50)
print("Endpoint Verification Summary")
print("="*50)
passed = [t for t in test_results if t["success"]]
failed = [t for t in test_results if not t["success"]]

print(f"Total Tests Run: {len(test_results)}")
print(f"Passed: {len(passed)}")
print(f"Failed: {len(failed)}")

if failed:
    print("\nFailed Tests:")
    for f in failed:
        print(f"  - {f['name']}: {f['message']}")
    sys.exit(1)
else:
    print("\nAll tested endpoints responded successfully!")
    sys.exit(0)
