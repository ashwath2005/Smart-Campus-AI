"""
Smart Campus AI — Master API Test Suite
Automated validation of backend REST endpoints across all domains and roles.
"""

import sys
import os
import requests

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from tests.fixtures.test_users import (
    BASE_URL,
    API_PREFIX,
    get_auth_headers,
    get_auth_token,
    DEMO_CREDENTIALS,
)

passed_tests = 0
failed_tests = 0
failures = []

def record(test_name: str, passed: bool, message: str = ""):
    global passed_tests, failed_tests
    if passed:
        passed_tests += 1
        print(f"  [PASS] {test_name}")
    else:
        failed_tests += 1
        failures.append((test_name, message))
        print(f"  [FAIL] {test_name} - {message}")


def run_api_suite():
    print("\n=======================================================")
    print("RUNNING MASTER API TEST SUITE (FastAPI + MySQL)")
    print("=======================================================\n")

    # 1. Health & OpenApi
    print("[1] Server Health & Documentation Endpoints:")
    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        record("GET / (Root Health Check)", r.status_code == 200 and r.json().get("status") == "online")
    except Exception as e:
        record("GET / (Root Health Check)", False, str(e))

    try:
        r = requests.get(f"{BASE_URL}/openapi.json", timeout=5)
        record("GET /openapi.json (OpenAPI 3.0 Schema)", r.status_code == 200 and "paths" in r.json())
    except Exception as e:
        record("GET /openapi.json", False, str(e))

    # 2. Multi-Role Authentication
    print("\n[2] Multi-Role Authentication & Token Retrieval:")
    for role in ["student", "faculty", "hod", "admin", "security", "guardian"]:
        try:
            token = get_auth_token(role, force_refresh=True)
            record(f"Login & JWT Token for role '{role}'", bool(token and len(token) > 20))
        except Exception as e:
            record(f"Login & JWT Token for role '{role}'", False, str(e))

    # 3. User Profile
    print("\n[3] User Identity & Verification:")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/auth/me", headers=headers, timeout=5)
        record("GET /auth/me (Student Profile)", r.status_code == 200 and "email" in r.json())
    except Exception as e:
        record("GET /auth/me", False, str(e))

    # 4. Gate Pass Endpoints
    print("\n[4] Autonomous Gate Pass Endpoints:")
    try:
        r = requests.get(f"{BASE_URL}{API_PREFIX}/gate-pass/policy", timeout=5)
        record("GET /gate-pass/policy (Policy Configuration)", r.status_code == 200 and "minAttendancePct" in r.json())
    except Exception as e:
        record("GET /gate-pass/policy", False, str(e))

    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/gate-pass/my-passes", headers=headers, timeout=5)
        record("GET /gate-pass/my-passes (Student Active Passes)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /gate-pass/my-passes", False, str(e))

    try:
        headers = get_auth_headers("security")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/gate-pass/all-passes", headers=headers, timeout=5)
        record("GET /gate-pass/all-passes (Security Pass Roster)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /gate-pass/all-passes", False, str(e))

    # 5. Workflows (Leaves & OD)
    print("\n[5] Workflows (Leaves & On-Duty):")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/workflows/leaves", headers=headers, timeout=5)
        record("GET /workflows/leaves (Student Leaves)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /workflows/leaves", False, str(e))

    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/workflows/ods", headers=headers, timeout=5)
        record("GET /workflows/ods (Student OD Requests)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /workflows/ods", False, str(e))

    # 6. Attendance
    print("\n[6] Attendance Management:")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/attendance/my", headers=headers, timeout=5)
        record("GET /attendance/my (Student Attendance Breakdown)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /attendance/my", False, str(e))

    try:
        headers = get_auth_headers("faculty")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/attendance/students?department=CSE", headers=headers, timeout=5)
        record("GET /attendance/students (Faculty Class Roster)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /attendance/students", False, str(e))

    # 7. Assignments
    print("\n[7] Coursework & Assignments:")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/assignments", headers=headers, timeout=5)
        record("GET /assignments (Student Coursework)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /assignments", False, str(e))

    # 8. Placements & Career
    print("\n[8] Campus Placements:")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/placements", headers=headers, timeout=5)
        record("GET /placements (Placement Drives)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /placements", False, str(e))

    # 9. Events & Campus Life
    print("\n[9] Events & Symposiums:")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/events", headers=headers, timeout=5)
        record("GET /events (Campus Events)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /events", False, str(e))

    # 10. Study Materials
    print("\n[10] Study Materials:")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/study-materials", headers=headers, timeout=5)
        record("GET /study-materials (Course Notes & Pdfs)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /study-materials", False, str(e))

    # 11. Peer Discussion Forum
    print("\n[11] Peer Discussion Forum:")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/forum/posts", headers=headers, timeout=5)
        data = r.json()
        record("GET /forum/posts (Forum Post Threads)", r.status_code == 200 and ("posts" in data or "items" in data or isinstance(data, list)))
    except Exception as e:
        record("GET /forum/posts", False, str(e))

    # 12. Campus Pulse 3D & Telemetry
    print("\n[12] Campus Pulse 3D Telemetry:")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/campus-pulse/current", headers=headers, timeout=5)
        record("GET /campus-pulse/current (Real-time Pulse Score)", r.status_code == 200 and "activityScore" in r.json())
    except Exception as e:
        record("GET /campus-pulse/current", False, str(e))

    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/campus-pulse/history?timeframe=today", headers=headers, timeout=5)
        record("GET /campus-pulse/history (Telemetry Time-Series)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /campus-pulse/history", False, str(e))

    # 13. Academic Risk Predictor
    print("\n[13] AI SGPA Early-Warning System:")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/academic-risk/predict", headers=headers, timeout=5)
        data = r.json()
        record("GET /academic-risk/predict (3-Week SGPA Predictor)", r.status_code == 200 and ("predictedSGPA" in data or "predicted_sgpa" in data))
    except Exception as e:
        record("GET /academic-risk/predict", False, str(e))

    # 14. Faculty Locator
    print("\n[14] Faculty Locator:")
    try:
        headers = get_auth_headers("student")
        r = requests.get(f"{BASE_URL}{API_PREFIX}/faculty-locator/search", headers=headers, timeout=5)
        record("GET /faculty-locator/search (Faculty Physical Presence)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        record("GET /faculty-locator/search", False, str(e))

    print("\n-------------------------------------------------------")
    print(f"TOTAL API TESTS: {passed_tests + failed_tests} | PASSED: {passed_tests} | FAILED: {failed_tests}")
    if failures:
        print("\nFailures:")
        for name, msg in failures:
            print(f"  - {name}: {msg}")
    print("-------------------------------------------------------\n")
    return failed_tests == 0

if __name__ == "__main__":
    success = run_api_suite()
    sys.exit(0 if success else 1)
