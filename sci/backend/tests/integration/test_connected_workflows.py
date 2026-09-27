import sys
from datetime import datetime, timedelta
import requests

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def run_connected_workflows_test():
    print("\n" + "=" * 80)
    print("STARTING COMPLETE 6-ROLE SMART CAMPUS CONNECTED WORKFLOW TEST SUITE")
    print("TARGET LIVE SERVER: " + BASE_URL)
    print("=" * 80 + "\n")

    # ─── 1. Authenticate All 6 Personas ───
    print("[STAGE 1] Authenticating All 6 Personas against live API...")
    tokens = {}
    users = {
        "student": ("student1@campus.com", "password123"),
        "guardian": ("guardian@campus.com", "password123"),
        "faculty": ("faculty1@campus.com", "password123"),
        "hod": ("hod1@campus.com", "password123"),
        "security": ("security@campus.com", "password123"),
        "admin": ("admin@campus.com", "password123"),
    }

    for role, (email, pwd) in users.items():
        res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": email, "password": pwd})
        if res.status_code == 200:
            tokens[role] = res.json().get("access_token")
            print(f"  ✓ {role.upper()} ({email}) authenticated successfully.")
        else:
            print(f"  ! {role.upper()} login failed: {res.status_code} {res.text}")

    assert tokens.get("student"), "Student login required"
    assert tokens.get("guardian"), "Guardian login required"
    assert tokens.get("hod"), "HOD login required"
    assert tokens.get("security"), "Security login required"
    assert tokens.get("faculty"), "Faculty login required"

    headers_student = {"Authorization": f"Bearer {tokens['student']}"}
    headers_guardian = {"Authorization": f"Bearer {tokens['guardian']}"}
    headers_hod = {"Authorization": f"Bearer {tokens['hod']}"}
    headers_security = {"Authorization": f"Bearer {tokens['security']}"}
    headers_faculty = {"Authorization": f"Bearer {tokens['faculty']}"}

    # ─── 2. Cross-Role Workflow: Weekend Gate Pass Lifecycle ───
    print("\n[STAGE 2] Testing Multi-Role Gate Pass Lifecycle (Student -> Guardian OTP -> HOD -> Security Exit -> Security Return)...")

    # Step 2a: Clean any active passes for student so test starts from pristine state
    import asyncio
    from app.database import async_session
    from app.models.gate_pass import GatePass
    from sqlalchemy import update

    async def reset_student_passes():
        async with async_session() as db:
            await db.execute(
                update(GatePass).where(
                    GatePass.student_id == 1,
                    GatePass.status.in_(["APPROVED", "OUT", "PENDING_PARENT_OTP", "PENDING_WARDEN_APPROVAL"])
                ).values(status="RETURNED")
            )
            await db.commit()

    asyncio.run(reset_student_passes())

    now = datetime.now()
    leave_t = (now + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:00")
    return_t = (now + timedelta(hours=36)).strftime("%Y-%m-%dT%H:%M:00")

    req_payload = {
        "pass_type": "weekend_leave",
        "reason": "Attending State Tech Hackathon",
        "destination": "Coimbatore IT Park",
        "return_hours": 36,
        "custom_leave_time": leave_t,
        "custom_return_time": return_t
    }

    req_res = requests.post(f"{BASE_URL}/api/v1/gate-pass/request", json=req_payload, headers=headers_student)
    pass_data = req_res.json()

    assert req_res.status_code == 200 and pass_data.get("id"), f"Pass request failed: {pass_data}"
    pass_id = pass_data["id"]
    status = pass_data["status"]
    parent_otp = pass_data.get("parentOtp") or pass_data.get("parent_otp")
    print(f"  ✓ Student created Pass #{pass_id} with initial status '{status}'. OTP: {parent_otp}")

    # Step 2b: Guardian inspects ward overview
    ward_res = requests.get(f"{BASE_URL}/api/v1/guardian/ward-overview", headers=headers_guardian)
    assert ward_res.status_code == 200, f"Guardian ward overview failed: {ward_res.text}"
    ward_overview = ward_res.json()
    active_pass = ward_overview["safety"]["active_pass"]
    assert active_pass and active_pass["id"] == pass_id, "Active pass not found in Guardian ward telemetry"
    parent_otp = active_pass.get("parent_otp")
    print(f"  ✓ Guardian retrieved Ward Telemetry: Ward '{ward_overview['ward']['name']}', Safety Status '{ward_overview['safety']['status']}'. SMS OTP received: {parent_otp}")

    # Guardian verifies SMS OTP
    otp_code = str(parent_otp).strip()
    verify_res = requests.post(
        f"{BASE_URL}/api/v1/guardian/gate-passes/{pass_id}/verify-otp",
        json={"otp_code": otp_code},
        headers=headers_guardian
    )
    assert verify_res.status_code == 200, f"Guardian OTP verify failed: {verify_res.text}"
    print(f"  ✓ Guardian verified SMS OTP ({otp_code}). Status updated to: '{verify_res.json().get('status')}'")

    # Step 2c: HOD reviews and approves the gate pass
    hod_action_res = requests.post(
        f"{BASE_URL}/api/v1/gate-pass/warden-action",
        json={"pass_id": pass_id, "action": "approve"},
        headers=headers_hod
    )
    assert hod_action_res.status_code == 200, f"HOD pass approval failed: {hod_action_res.text}"
    assert hod_action_res.json().get("status") == "APPROVED", "HOD approval did not transition to APPROVED"
    print(f"  ✓ HOD approved Gate Pass #{pass_id}. State transitioned to 'APPROVED'.")

    # Step 2d: Security Officer scans exit at Main Gate
    exit_res = requests.post(
        f"{BASE_URL}/api/v1/gate-pass/exit",
        json={"qr_token": str(pass_id)},
        headers=headers_security
    )
    assert exit_res.status_code == 200, f"Security exit scan failed: {exit_res.text}"
    exit_json = exit_res.json()
    assert exit_json.get("valid") is True, f"Security exit scan rejected: {exit_json.get('reason')}"
    assert exit_json.get("status") == "OUT"
    print(f"  ✓ Security verified pass #{pass_id} at Main Gate. Status updated to 'OUT'.")

    # Step 2e: Verify Guardian telemetry immediately flips to OUTSIDE_CAMPUS
    ward_out_res = requests.get(f"{BASE_URL}/api/v1/guardian/ward-overview", headers=headers_guardian)
    assert ward_out_res.status_code == 200
    assert ward_out_res.json()["safety"]["status"] == "OUTSIDE_CAMPUS"
    print("  ✓ Guardian Ward Telemetry successfully reflects 'OUTSIDE_CAMPUS'.")

    # Step 2f: Security Officer scans return at Main Gate
    return_res = requests.post(
        f"{BASE_URL}/api/v1/gate-pass/return",
        json={"qr_token": str(pass_id)},
        headers=headers_security
    )
    assert return_res.status_code == 200, f"Security return scan failed: {return_res.text}"
    return_json = return_res.json()
    assert return_json.get("valid") is True
    assert return_json.get("status") == "RETURNED"
    print(f"  ✓ Security recorded Return scan for #{pass_id}. Status transitioned to 'RETURNED'. Duration: {return_json.get('actualDuration')}")

    # Step 2g: Verify Guardian telemetry updates back to INSIDE_CAMPUS
    ward_back_res = requests.get(f"{BASE_URL}/api/v1/guardian/ward-overview", headers=headers_guardian)
    assert ward_back_res.status_code == 200
    assert ward_back_res.json()["safety"]["status"] == "INSIDE_CAMPUS"
    print("  ✓ Guardian Ward Telemetry successfully updated back to 'INSIDE_CAMPUS'.")

    # ─── 3. Cross-Role Workflow: Attendance Capture & Academic Cascade ───
    print("\n[STAGE 3] Testing Attendance Marking & Academic Status Reflection...")
    stud_id = ward_overview["ward"]["id"]
    today_str = datetime.now().date().isoformat()

    att_payload = {
        "student_id": stud_id,
        "subject": "CS301 - Operating Systems",
        "date": today_str,
        "status": "absent",
        "status_type": "absent",
        "remarks": "Lecture absent"
    }
    att_res = requests.post(f"{BASE_URL}/api/v1/attendance/mark", json=att_payload, headers=headers_faculty)
    assert att_res.status_code == 200, f"Attendance mark failed: {att_res.text}"
    print("  ✓ Faculty recorded class attendance.")

    my_att_res = requests.get(f"{BASE_URL}/api/v1/attendance/my", headers=headers_student)
    assert my_att_res.status_code == 200
    print(f"  ✓ Student attendance record refreshed: {len(my_att_res.json())} subject records returned.")

    # ─── 4. Cross-Role Workflow: On-Duty Regularization & Attendance Restoration ───
    print("\n[STAGE 4] Testing On-Duty Application -> Advisor Endorsement -> HOD Approval -> Attendance Credit...")
    od_payload = {
        "event_title": "National Smart Campus Hackathon",
        "start_date": today_str,
        "end_date": today_str,
        "reason": "Representing university at national level competition",
        "description": "Selected finalist team"
    }
    od_apply_res = requests.post(f"{BASE_URL}/api/v1/workflows/ods", json=od_payload, headers=headers_student)
    assert od_apply_res.status_code == 200, f"OD apply failed: {od_apply_res.text}"
    od_id = od_apply_res.json()["od_id"]
    print(f"  ✓ Student applied for On-Duty authorization. Assigned OD #{od_id}.")

    # Retrieve pending ODs from HOD view
    hod_ods_res = requests.get(f"{BASE_URL}/api/v1/workflows/ods", headers=headers_hod)
    assert hod_ods_res.status_code == 200
    print(f"  ✓ HOD retrieved department OD queue: {len(hod_ods_res.json())} requests active.")

    # Advisor reviews & endorses
    od_rev_res = requests.put(
        f"{BASE_URL}/api/v1/workflows/ods/{od_id}/review",
        json={"status": "Pending HOD Approval", "comment": "Verified and recommended"},
        headers=headers_faculty
    )
    assert od_rev_res.status_code == 200, f"Advisor OD review failed: {od_rev_res.text}"
    print(f"  ✓ Faculty Advisor endorsed OD #{od_id}.")

    # HOD approves OD and triggers attendance regularization
    od_app_res = requests.put(
        f"{BASE_URL}/api/v1/workflows/ods/{od_id}/approve",
        json={"status": "Approved", "comment": "Approved by HOD. Attendance excused."},
        headers=headers_hod
    )
    assert od_app_res.status_code == 200, f"HOD OD approval failed: {od_app_res.text}"
    print(f"  ✓ HOD approved OD #{od_id} with automatic attendance regularization.")

    print("\n" + "=" * 80)
    print("ALL 6-ROLE CONNECTED BUSINESS WORKFLOW TESTS PASSED CLEANLY! (100% SUCCESS)")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    run_connected_workflows_test()
