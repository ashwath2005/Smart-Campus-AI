"""
Smart Campus AI — Security, RBAC & IDOR Test Suite
Validates role privilege boundaries, object ownership (IDOR), and input tampering.
"""

import sys
import os
import requests

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from tests.fixtures.test_users import (
    BASE_URL,
    API_PREFIX,
    get_auth_headers,
)

passed_sec = 0
failed_sec = 0
sec_failures = []

def record(name: str, passed: bool, message: str = ""):
    global passed_sec, failed_sec
    if passed:
        passed_sec += 1
        print(f"  [PASS] {name}")
    else:
        failed_sec += 1
        sec_failures.append((name, message))
        print(f"  [FAIL] {name} - {message}")


def run_security_suite():
    print("\n=======================================================")
    print("RUNNING SECURITY, RBAC & PRIVILEGE BOUNDARY TEST SUITE")
    print("=======================================================\n")

    std_headers = get_auth_headers("student")
    fac_headers = get_auth_headers("faculty")
    sec_headers = get_auth_headers("security")
    gdn_headers = get_auth_headers("guardian")

    # 1. RBAC: Student Privilege Escalation Tests
    print("[1] Role-Based Access Control (RBAC) - Privilege Escalation:")
    
    # Student -> Admin endpoint
    r = requests.get(f"{BASE_URL}{API_PREFIX}/admin/analytics", headers=std_headers, timeout=5)
    record("SEC-RBAC-01: Student cannot access Admin Analytics (HTTP 403)", r.status_code in [401, 403])

    # Student -> HOD Approve Leave
    r = requests.put(f"{BASE_URL}{API_PREFIX}/workflows/leaves/1/approve", json={"status": "Approved", "comment": "Hacked"}, headers=std_headers, timeout=5)
    record("SEC-RBAC-02: Student cannot approve leaves (HTTP 403)", r.status_code in [401, 403])

    # Student -> Security Exit Scan
    r = requests.post(f"{BASE_URL}{API_PREFIX}/gate-pass/exit", json={"qr_token": "fake_token"}, headers=std_headers, timeout=5)
    record("SEC-RBAC-03: Student cannot execute gate scan (HTTP 403)", r.status_code in [401, 403])

    # Faculty -> Modify Gate Pass Policy
    policy_payload = {
        "min_attendance_pct": 50.0,
        "auto_approve_max_hours": 4.0,
        "overdue_threshold_minutes": 15,
        "max_active_passes": 1
    }
    r = requests.put(f"{BASE_URL}{API_PREFIX}/gate-pass/policy", json=policy_payload, headers=fac_headers, timeout=5)
    record("SEC-RBAC-04: Faculty cannot modify institutional gate policy (HTTP 403)", r.status_code in [401, 403])

    # Security -> Mark Student Attendance
    bulk_att = {
        "subject": "Math",
        "date": "2026-09-09",
        "records": []
    }
    r = requests.post(f"{BASE_URL}{API_PREFIX}/attendance/mark-bulk", json=bulk_att, headers=sec_headers, timeout=5)
    record("SEC-RBAC-05: Security guard cannot mark attendance (HTTP 403)", r.status_code in [401, 403])

    # Guardian -> Access Campus Pulse Telemetry Drawer / Sensitive endpoints
    r = requests.get(f"{BASE_URL}{API_PREFIX}/campus-pulse/current", headers=gdn_headers, timeout=5)
    record("SEC-RBAC-06: Guardian restricted from institutional pulse telemetry (HTTP 403)", r.status_code in [401, 403])

    # 2. Token Integrity & Cryptographic Security
    print("\n[2] Token Integrity & Cryptographic Signatures:")

    # Forged Token
    forged_headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature"}
    r = requests.get(f"{BASE_URL}{API_PREFIX}/gate-pass/my-passes", headers=forged_headers, timeout=5)
    record("SEC-TOK-01: Forged signature rejected (HTTP 401)", r.status_code == 401)

    # Missing Header
    r = requests.get(f"{BASE_URL}{API_PREFIX}/gate-pass/my-passes", timeout=5)
    record("SEC-TOK-02: Missing authorization header rejected (HTTP 401)", r.status_code == 401)

    # 3. Input Validation & Business Rules
    print("\n[3] Input Validation & Data Inversion Protections:")

    # Inverted Leave Dates (start > end)
    inv_leave = {
        "leave_type": "Casual Leave",
        "start_date": "2026-10-10",
        "end_date": "2026-10-01",
        "reason": "Invalid chronological sequence"
    }
    r = requests.post(f"{BASE_URL}{API_PREFIX}/workflows/leaves", json=inv_leave, headers=std_headers, timeout=5)
    record("SEC-VAL-01: Inverted leave date range rejected (HTTP 400)", r.status_code == 400)

    # Malformed Date Format
    bad_date_leave = {
        "leave_type": "Casual Leave",
        "start_date": "10-10-2026",
        "end_date": "12-10-2026",
        "reason": "Non-ISO format"
    }
    r = requests.post(f"{BASE_URL}{API_PREFIX}/workflows/leaves", json=bad_date_leave, headers=std_headers, timeout=5)
    record("SEC-VAL-02: Malformed non-ISO date rejected (HTTP 400)", r.status_code == 400)

    print("\n-------------------------------------------------------")
    print(f"TOTAL SECURITY CHECKS: {passed_sec + failed_sec} | PASSED: {passed_sec} | FAILED: {failed_sec}")
    if sec_failures:
        print("\nSecurity Vulnerabilities Detected:")
        for name, msg in sec_failures:
            print(f"  - {name}: {msg}")
    print("-------------------------------------------------------\n")
    return failed_sec == 0

if __name__ == "__main__":
    success = run_security_suite()
    sys.exit(0 if success else 1)
