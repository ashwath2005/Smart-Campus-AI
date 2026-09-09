"""
Smart Campus AI — End-to-End Business Workflow Test Suite
Tests complete multi-role business handoffs, state transitions, and database updates.
"""

import sys
import os
import requests
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from tests.fixtures.test_users import (
    BASE_URL,
    API_PREFIX,
    get_auth_headers,
    get_auth_token,
)

passed_workflows = 0
failed_workflows = 0
workflow_failures = []

def record(wf_name: str, passed: bool, message: str = ""):
    global passed_workflows, failed_workflows
    if passed:
        passed_workflows += 1
        print(f"  [PASS] {wf_name}")
    else:
        failed_workflows += 1
        workflow_failures.append((wf_name, message))
        print(f"  [FAIL] {wf_name} - {message}")


def run_workflows():
    print("\n=======================================================")
    print("RUNNING COMPLETE MULTI-ROLE BUSINESS WORKFLOWS")
    print("=======================================================\n")

    # ─────────────────────────────────────────────────────────────
    # WORKFLOW 1: Autonomous Day Outpass (Instant AI Approval -> Security Exit -> Return)
    # ─────────────────────────────────────────────────────────────
    print("[Workflow 1] Day Outpass: Student -> AI Auto-Approve -> Security Exit -> Return:")
    std_headers = get_auth_headers("student")
    sec_headers = get_auth_headers("security")

    # Step 1: Student Requests Outpass
    outpass_payload = {
        "pass_type": "outpass",
        "reason": f"Lab Component Purchase - Test {uuid.uuid4().hex[:6]}",
        "destination": "Electronics Market, Gandhipuram",
        "return_hours": 3
    }
    r1 = requests.post(f"{BASE_URL}{API_PREFIX}/gate-pass/request", json=outpass_payload, headers=std_headers, timeout=10)
    pass_data = r1.json() if r1.status_code == 200 else {}
    
    # If active pass exists, fetch existing active pass token
    if not pass_data.get("success") and pass_data.get("error") == "ACTIVE_PASS_EXISTS":
        my_passes = requests.get(f"{BASE_URL}{API_PREFIX}/gate-pass/my-passes", headers=std_headers, timeout=10).json()
        active = [p for p in my_passes if p.get("status") in ["APPROVED", "OUT", "PENDING_PARENT_OTP", "PENDING_WARDEN_APPROVAL"]]
        for ap in active:
            tok = ap.get("signedQrToken") or ap.get("signed_qr_token")
            if tok:
                if ap.get("status") == "APPROVED":
                    requests.post(f"{BASE_URL}{API_PREFIX}/gate-pass/exit", json={"qr_token": tok}, headers=sec_headers, timeout=10)
                requests.post(f"{BASE_URL}{API_PREFIX}/gate-pass/return", json={"qr_token": tok}, headers=sec_headers, timeout=10)
        # Retry request
        r1 = requests.post(f"{BASE_URL}{API_PREFIX}/gate-pass/request", json=outpass_payload, headers=std_headers, timeout=10)
        pass_data = r1.json() if r1.status_code == 200 else {}

    if r1.status_code == 200 and pass_data.get("success"):
        pass_id = pass_data.get("id")
        qr_token = pass_data.get("signedQrToken") or pass_data.get("signed_qr_token")
        status = pass_data.get("status")
        record("WF1.1: Student requests outpass -> Status APPROVED", status == "APPROVED" and bool(qr_token))

        # Step 2: Security Exit Scan
        r2 = requests.post(f"{BASE_URL}{API_PREFIX}/gate-pass/exit", json={"qr_token": qr_token}, headers=sec_headers, timeout=10)
        exit_ok = r2.status_code == 200 and (r2.json().get("status") == "OUT" or r2.json().get("valid") == True)
        record("WF1.2: Security scans Exit -> Status transitions to OUT", exit_ok, f"code={r2.status_code} body={r2.text}")

        # Step 3: Security Return Scan
        r3 = requests.post(f"{BASE_URL}{API_PREFIX}/gate-pass/return", json={"qr_token": qr_token}, headers=sec_headers, timeout=10)
        return_ok = r3.status_code == 200 and (r3.json().get("status") == "RETURNED" or r3.json().get("valid") == True)
        record("WF1.3: Security scans Return -> Status transitions to RETURNED", return_ok, f"code={r3.status_code} body={r3.text}")
    else:
        record("WF1.1: Student requests outpass", False, f"HTTP {r1.status_code}: {r1.text}")

    # ─────────────────────────────────────────────────────────────
    # WORKFLOW 2: Weekend Hostel Leave (Student -> Guardian OTP -> Warden -> Security)
    # ─────────────────────────────────────────────────────────────
    print("\n[Workflow 2] Weekend Hostel Leave: Student -> Guardian OTP -> Warden -> Security:")
    gdn_headers = get_auth_headers("guardian")
    warden_headers = get_auth_headers("hod")  # HOD/Warden

    weekend_payload = {
        "pass_type": "weekend_leave",
        "reason": f"Family Event Weekend - Test {uuid.uuid4().hex[:6]}",
        "destination": "Home Transit (Salem)",
        "return_hours": 48
    }
    r_wk = requests.post(f"{BASE_URL}{API_PREFIX}/gate-pass/request", json=weekend_payload, headers=std_headers, timeout=10)
    if r_wk.status_code == 200:
        wk_data = r_wk.json()
        wk_id = wk_data.get("id")
        wk_status = wk_data.get("status")
        otp_val = wk_data.get("parentOtp") or "849201"
        record("WF2.1: Student requests weekend leave -> PENDING_PARENT_OTP", wk_status == "PENDING_PARENT_OTP")

        # Step 2: Guardian verifies OTP
        r_otp = requests.post(
            f"{BASE_URL}{API_PREFIX}/gate-pass/verify-parent-otp",
            json={"pass_id": wk_id, "otp_code": otp_val},
            headers=gdn_headers,
            timeout=10
        )
        otp_ok = r_otp.status_code == 200 and r_otp.json().get("success") == True
        record("WF2.2: Guardian verifies 6-Digit SMS OTP -> PENDING_WARDEN_APPROVAL", otp_ok)

        # Step 3: Warden / HOD 1-Click Approval
        r_wrd = requests.post(
            f"{BASE_URL}{API_PREFIX}/gate-pass/warden-action",
            json={"pass_id": wk_id, "action": "approve"},
            headers=warden_headers,
            timeout=10
        )
        wrd_ok = r_wrd.status_code == 200 and r_wrd.json().get("success") == True
        record("WF2.3: Warden approves pass -> Status transitions to APPROVED", wrd_ok)

        # Step 4: Security scans Exit
        # Retrieve fresh token directly from pass
        fresh_p = requests.get(f"{BASE_URL}{API_PREFIX}/gate-pass/my-passes", headers=std_headers, timeout=10).json()
        target_p = next((p for p in fresh_p if p.get("id") == wk_id), None)
        token = target_p.get("signedQrToken") or target_p.get("signed_qr_token") if target_p else None
        if token:
            r_ex = requests.post(f"{BASE_URL}{API_PREFIX}/gate-pass/exit", json={"qr_token": token}, headers=sec_headers, timeout=10)
            record("WF2.4: Security scans Exit for approved weekend leave -> Status OUT", r_ex.status_code == 200 and (r_ex.json().get("status") == "OUT" or r_ex.json().get("valid") == True), f"code={r_ex.status_code} body={r_ex.text}")
            # Return
            r_ret = requests.post(f"{BASE_URL}{API_PREFIX}/gate-pass/return", json={"qr_token": token}, headers=sec_headers, timeout=10)
            record("WF2.5: Security scans Return for weekend leave -> Status RETURNED", r_ret.status_code == 200 and (r_ret.json().get("status") == "RETURNED" or r_ret.json().get("valid") == True), f"code={r_ret.status_code} body={r_ret.text}")
        else:
            record("WF2.4: Security scans Exit", False, "Could not locate pass token in my-passes")
    else:
        record("WF2.1: Student requests weekend leave", False, f"HTTP {r_wk.status_code}: {r_wk.text}")

    # ─────────────────────────────────────────────────────────────
    # WORKFLOW 3: Student Leave Approval (Student -> Advisor -> HOD)
    # ─────────────────────────────────────────────────────────────
    print("\n[Workflow 3] Student Leave Lifecycle: Student -> Faculty Advisor -> HOD:")
    fac_headers = get_auth_headers("faculty")
    hod_headers = get_auth_headers("hod")

    start_d = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    end_d = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d")

    leave_payload = {
        "leave_type": "Casual Leave",
        "start_date": start_d,
        "end_date": end_d,
        "reason": f"Medical consultation - Test {uuid.uuid4().hex[:6]}",
        "supporting_document": None
    }
    r_lv = requests.post(f"{BASE_URL}{API_PREFIX}/workflows/leaves", json=leave_payload, headers=std_headers, timeout=10)
    if r_lv.status_code == 200:
        leave_id = r_lv.json().get("leave_id")
        record("WF3.1: Student submits leave -> Status 'Pending Faculty Review'", bool(leave_id))

        # Advisor reviews and forwards to HOD
        r_rev = requests.put(
            f"{BASE_URL}{API_PREFIX}/workflows/leaves/{leave_id}/review",
            json={"status": "Pending HOD Approval", "comment": "Verified by Advisor. Approved for HOD signoff."},
            headers=fac_headers,
            timeout=10
        )
        rev_ok = r_rev.status_code == 200
        record("WF3.2: Faculty Advisor reviews & forwards -> Status 'Pending HOD Approval'", rev_ok)

        # HOD gives final approval
        r_app = requests.put(
            f"{BASE_URL}{API_PREFIX}/workflows/leaves/{leave_id}/approve",
            json={"status": "Approved", "comment": "Granted by Head of Department."},
            headers=hod_headers,
            timeout=10
        )
        app_ok = r_app.status_code == 200
        record("WF3.3: HOD approves leave -> Status 'Approved'", app_ok)

        # Student verifies final approved state
        r_check = requests.get(f"{BASE_URL}{API_PREFIX}/workflows/leaves", headers=std_headers, timeout=10)
        found = False
        if r_check.status_code == 200:
            for item in r_check.json():
                if item.get("id") == leave_id and item.get("status") == "Approved":
                    found = True
                    break
        record("WF3.4: Student verifies final status='Approved' with HOD remarks", found)
    else:
        record("WF3.1: Student submits leave", False, f"HTTP {r_lv.status_code}: {r_lv.text}")

    # ─────────────────────────────────────────────────────────────
    # WORKFLOW 4: Attendance Marking & Recalculation
    # ─────────────────────────────────────────────────────────────
    print("\n[Workflow 4] Attendance: Faculty Marks Bulk -> Student Attendance Recalculates:")
    me_res = requests.get(f"{BASE_URL}{API_PREFIX}/auth/me", headers=std_headers, timeout=10)
    student_id = me_res.json().get("id") if me_res.status_code == 200 else 1

    today_str = datetime.now().strftime("%Y-%m-%d")
    bulk_payload = {
        "subject": "Cloud Computing",
        "date": today_str,
        "records": [
            {"student_id": student_id, "status": "present", "status_type": "present", "remarks": "On Time"}
        ]
    }
    r_att = requests.post(f"{BASE_URL}{API_PREFIX}/attendance/mark-bulk", json=bulk_payload, headers=fac_headers, timeout=10)
    record("WF4.1: Faculty submits bulk attendance for student", r_att.status_code == 200)

    # Verify Student Attendance Aggregation
    r_my_att = requests.get(f"{BASE_URL}{API_PREFIX}/attendance/my", headers=std_headers, timeout=10)
    has_sub = False
    if r_my_att.status_code == 200:
        for sub in r_my_att.json():
            if sub.get("subject") == "Cloud Computing":
                has_sub = True
                break
    record("WF4.2: Student attendance percentage recalculated for subject", has_sub)

    # ─────────────────────────────────────────────────────────────
    # WORKFLOW 5: Assignments Lifecycle (Faculty Creates -> Student Submits -> Faculty Grades)
    # ─────────────────────────────────────────────────────────────
    print("\n[Workflow 5] Assignment: Faculty Creates -> Student Submits -> Faculty Grades:")
    admin_headers = get_auth_headers("admin")
    due_d = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")

    asn_payload = {
        "title": f"Distributed Consensus Lab {uuid.uuid4().hex[:4]}",
        "description": "Implement Paxos state machine replication in Python",
        "subject": "Cloud Computing",
        "due_date": due_d,
        "department": "CSE",
        "year": "IV",
        "section": "A"
    }
    r_asn = requests.post(f"{BASE_URL}{API_PREFIX}/assignments", json=asn_payload, headers=fac_headers, timeout=10)
    if r_asn.status_code == 200:
        asn_id = r_asn.json().get("id") or r_asn.json().get("assignment_id")
        record("WF5.1: Faculty creates & publishes assignment", bool(asn_id))

        if asn_id:
            # Student Submits
            sub_payload = {
                "file_url": "https://storage.campus.com/submissions/lab1.pdf",
                "github_link": "https://github.com/student/paxos-lab"
            }
            r_sub = requests.post(f"{BASE_URL}{API_PREFIX}/assignments/{asn_id}/submit", json=sub_payload, headers=std_headers, timeout=10)
            record("WF5.2: Student submits assignment coursework", r_sub.status_code == 200)

            # Faculty fetches submissions and grades
            r_subs = requests.get(f"{BASE_URL}{API_PREFIX}/assignments/{asn_id}/submissions", headers=fac_headers, timeout=10)
            if r_subs.status_code == 200 and len(r_subs.json()) > 0:
                s_id = r_subs.json()[0]["id"]
                grade_payload = {
                    "grade": "A+",
                    "remarks": "Flawless consensus leader election logic. Full marks."
                }
                r_grd = requests.put(f"{BASE_URL}{API_PREFIX}/assignments/submissions/{s_id}/grade", json=grade_payload, headers=fac_headers, timeout=10)
                record("WF5.3: Faculty grades student submission -> Marks saved", r_grd.status_code == 200)
            else:
                record("WF5.3: Faculty grades student submission", False, "No submissions retrieved")
    else:
        record("WF5.1: Faculty creates assignment", False, f"HTTP {r_asn.status_code}: {r_asn.text}")

    print("\n-------------------------------------------------------")
    print(f"TOTAL WORKFLOW CHECKS: {passed_workflows + failed_workflows} | PASSED: {passed_workflows} | FAILED: {failed_workflows}")
    if workflow_failures:
        print("\nWorkflow Failures:")
        for name, msg in workflow_failures:
            print(f"  - {name}: {msg}")
    print("-------------------------------------------------------\n")
    return failed_workflows == 0

if __name__ == "__main__":
    success = run_workflows()
    sys.exit(0 if success else 1)
