import sys
import unittest
import uuid
from pathlib import Path

import requests

BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

BASE_URL = "http://127.0.0.1:8000"
API = f"{BASE_URL}/api"
PASSWORD = "password123"


def login(email: str) -> str:
    resp = requests.post(
        f"{API}/auth/login",
        json={"email": email, "password": PASSWORD},
        timeout=10,
    )
    if resp.status_code != 200:
        raise AssertionError(f"Login failed for {email}: {resp.status_code} {resp.text}")
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


class TestGatePassAuditLogsAPI(unittest.TestCase):
    """Live API & workflow regression tests for GET /api/gate-pass/audit-logs."""

    @classmethod
    def setUpClass(cls):
        cls.admin_token = login("admin@campus.com")
        cls.student_token = login("student1@campus.com")
        cls.faculty_token = login("faculty1@campus.com")
        cls.security_token = login("security@campus.com")
        cls.guardian_token = login("guardian@campus.com")
        cls.warden_token = login("warden@campus.com")
        cls.hod_token = login("hod1@campus.com")

    def _cancel_active_student_passes(self):
        res = requests.get(
            f"{API}/gate-pass/my-passes",
            headers=auth_headers(self.student_token),
            timeout=10,
        )
        self.assertEqual(res.status_code, 200)
        for p in res.json():
            if p.get("status") in (
                "APPROVED",
                "OUT",
                "PENDING_PARENT_OTP",
                "PENDING_WARDEN_APPROVAL",
                "SUBMITTED",
            ):
                requests.post(
                    f"{API}/gate-pass/{p['id']}/cancel",
                    headers=auth_headers(self.student_token),
                    timeout=10,
                )

    def test_01_unauthorized_access_rejected(self):
        r_missing = requests.get(f"{API}/gate-pass/audit-logs", timeout=10)
        self.assertEqual(r_missing.status_code, 401)

        r_bad = requests.get(
            f"{API}/gate-pass/audit-logs",
            headers={"Authorization": "Bearer invalid.jwt.token"},
            timeout=10,
        )
        self.assertEqual(r_bad.status_code, 401)

    def test_02_non_admin_roles_forbidden(self):
        for role_name, tok in [
            ("student", self.student_token),
            ("faculty", self.faculty_token),
            ("security", self.security_token),
            ("guardian", self.guardian_token),
            ("warden", self.warden_token),
            ("hod", self.hod_token),
        ]:
            resp = requests.get(
                f"{API}/gate-pass/audit-logs",
                headers=auth_headers(tok),
                timeout=10,
            )
            self.assertEqual(
                resp.status_code,
                403,
                f"Expected HTTP 403 for role={role_name}, got {resp.status_code}: {resp.text}",
            )

    def test_03_admin_retrieves_structured_and_legacy_audit_logs(self):
        resp = requests.get(
            f"{API}/gate-pass/audit-logs?limit=200&offset=0",
            headers=auth_headers(self.admin_token),
            timeout=10,
        )
        self.assertEqual(resp.status_code, 200, resp.text)
        logs = resp.json()
        self.assertIsInstance(logs, list)
        self.assertGreater(len(logs), 0)

        for entry in logs:
            for key in (
                "id",
                "passId",
                "actorId",
                "actorRole",
                "action",
                "previousState",
                "newState",
                "metadata",
                "timestamp",
            ):
                self.assertIn(key, entry)
            self.assertIsInstance(entry["metadata"], (dict, list))

        # Verify historical plain-text legacy rows in MySQL are normalized cleanly
        legacy_rows = [
            row for row in logs
            if isinstance(row.get("metadata"), dict) and row["metadata"].get("legacy") is True
        ]
        self.assertGreater(
            len(legacy_rows),
            0,
            "Expected historical legacy plain-text rows to be preserved and normalized",
        )
        for row in legacy_rows:
            self.assertTrue(row["metadata"].get("remarks") or row["metadata"].get("raw"))

    def test_04_pagination_limit_and_offset(self):
        p1 = requests.get(
            f"{API}/gate-pass/audit-logs?limit=5&offset=0",
            headers=auth_headers(self.admin_token),
            timeout=10,
        )
        p2 = requests.get(
            f"{API}/gate-pass/audit-logs?limit=5&offset=5",
            headers=auth_headers(self.admin_token),
            timeout=10,
        )
        self.assertEqual(p1.status_code, 200)
        self.assertEqual(p2.status_code, 200)
        ids_1 = {item["id"] for item in p1.json()}
        ids_2 = {item["id"] for item in p2.json()}
        self.assertLessEqual(len(ids_1), 5)
        self.assertLessEqual(len(ids_2), 5)
        self.assertTrue(ids_1.isdisjoint(ids_2))

    def test_05_workflow_transitions_persist_valid_json_metadata(self):
        self._cancel_active_student_passes()

        # Baseline count of historical logs (should only grow, never shrink)
        baseline_logs = requests.get(
            f"{API}/gate-pass/audit-logs?limit=200",
            headers=auth_headers(self.admin_token),
            timeout=10,
        ).json()
        baseline_ids = {item["id"] for item in baseline_logs}

        # 1. Create Tier 2 pass -> Guardian approve -> Warden approve -> Cancel
        marker_approve = f"Guardian audit regression {uuid.uuid4().hex[:6]}"
        r_create = requests.post(
            f"{API}/gate-pass/request",
            json={
                "pass_type": "weekend_leave",
                "reason": "Weekend family visit regression test",
                "destination": "Coimbatore",
                "return_hours": 48,
            },
            headers=auth_headers(self.student_token),
            timeout=10,
        )
        self.assertEqual(r_create.status_code, 200, r_create.text)
        pass_id = r_create.json()["id"]

        r_gdn = requests.post(
            f"{API}/guardian/gate-passes/{pass_id}/approve",
            json={"remarks": marker_approve},
            headers=auth_headers(self.guardian_token),
            timeout=10,
        )
        self.assertEqual(r_gdn.status_code, 200, r_gdn.text)
        self.assertEqual(r_gdn.json()["status"], "PENDING_WARDEN_APPROVAL")

        r_warden = requests.post(
            f"{API}/gate-pass/warden-action",
            json={"pass_id": pass_id, "action": "approve"},
            headers=auth_headers(self.warden_token),
            timeout=10,
        )
        self.assertEqual(r_warden.status_code, 200, r_warden.text)

        requests.post(
            f"{API}/gate-pass/{pass_id}/cancel",
            headers=auth_headers(self.student_token),
            timeout=10,
        )

        # 2. Create second Tier 2 pass -> Guardian reject
        marker_reject = f"Guardian reject regression {uuid.uuid4().hex[:6]}"
        r_create_2 = requests.post(
            f"{API}/gate-pass/request",
            json={
                "pass_type": "weekend_leave",
                "reason": "Weekend visit rejection audit test",
                "destination": "Madurai",
                "return_hours": 48,
            },
            headers=auth_headers(self.student_token),
            timeout=10,
        )
        self.assertEqual(r_create_2.status_code, 200, r_create_2.text)
        pass_id_2 = r_create_2.json()["id"]

        r_gdn_rej = requests.post(
            f"{API}/guardian/gate-passes/{pass_id_2}/reject",
            json={"remarks": marker_reject},
            headers=auth_headers(self.guardian_token),
            timeout=10,
        )
        self.assertEqual(r_gdn_rej.status_code, 200, r_gdn_rej.text)
        self.assertEqual(r_gdn_rej.json()["status"], "REJECTED")

        # 3. Verify all transitions appear in /api/gate-pass/audit-logs with normalized JSON
        r_after = requests.get(
            f"{API}/gate-pass/audit-logs?limit=200",
            headers=auth_headers(self.admin_token),
            timeout=10,
        )
        self.assertEqual(r_after.status_code, 200)
        after_logs = r_after.json()
        after_ids = {item["id"] for item in after_logs}
        self.assertTrue(
            baseline_ids.issubset(after_ids),
            "Existing historical audit logs must remain intact",
        )

        p1_logs = [l for l in after_logs if l["passId"] == pass_id]
        p1_actions = {l["action"]: l["metadata"] for l in p1_logs}
        self.assertIn("CREATED", p1_actions)
        self.assertIn("GUARDIAN_APPROVED", p1_actions)
        self.assertEqual(p1_actions["GUARDIAN_APPROVED"], {"remarks": marker_approve})
        self.assertNotIn("legacy", p1_actions["GUARDIAN_APPROVED"])
        self.assertIn("WARDEN_APPROVE", p1_actions)
        self.assertIn("CANCELLED", p1_actions)

        p2_logs = [l for l in after_logs if l["passId"] == pass_id_2]
        p2_actions = {l["action"]: l["metadata"] for l in p2_logs}
        self.assertIn("GUARDIAN_REJECTED", p2_actions)
        self.assertEqual(p2_actions["GUARDIAN_REJECTED"], {"remarks": marker_reject})
        self.assertNotIn("legacy", p2_actions["GUARDIAN_REJECTED"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
