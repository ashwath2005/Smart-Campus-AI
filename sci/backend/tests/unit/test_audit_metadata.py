import json
import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.database import Base
import app.models  # noqa: F401 - register all ORM models on Base.metadata
from app.models.gate_pass import GatePass, GatePassAuditLog
from app.models.user import User
from app.services.gate_pass_service import GatePassService
from app.services.workflow_engine import WorkflowEngine
from app.utils.audit_metadata import parse_audit_metadata, serialize_audit_metadata


class TestAuditMetadataUnit(unittest.TestCase):
    """Unit tests for centralized audit metadata serialization and parsing."""

    def test_parse_valid_json_object(self):
        raw = '{"tier": "TIER_1", "destination": "Library", "hours": 3}'
        self.assertEqual(
            parse_audit_metadata(raw),
            {"tier": "TIER_1", "destination": "Library", "hours": 3},
        )

    def test_parse_valid_json_array(self):
        raw = '["step_1", "step_2", {"ok": true}]'
        self.assertEqual(
            parse_audit_metadata(raw),
            ["step_1", "step_2", {"ok": True}],
        )

    def test_parse_plain_text_legacy_remarks(self):
        raw = "Authorized via 6-digit SMS OTP verification"
        self.assertEqual(
            parse_audit_metadata(raw),
            {"remarks": "Authorized via 6-digit SMS OTP verification", "legacy": True},
        )

    def test_parse_null_and_empty_strings(self):
        self.assertEqual(parse_audit_metadata(None), {})
        self.assertEqual(parse_audit_metadata(""), {})
        self.assertEqual(parse_audit_metadata("   \n\t  "), {})

    def test_parse_malformed_json_preserves_raw_and_marks_malformed(self):
        for malformed in ('{"tier": "TIER_1"', "[1, 2,", "{broken: json}"):
            with self.assertLogs("app.utils.audit_metadata", level="WARNING"):
                parsed = parse_audit_metadata(malformed)
            self.assertEqual(
                parsed,
                {"raw": malformed, "legacy": True, "malformed": True},
            )

    def test_parse_unicode_and_special_characters(self):
        unicode_text = "Approved by parent — தமிழ் / 日本語 🚀"
        self.assertEqual(
            parse_audit_metadata(unicode_text),
            {"remarks": unicode_text, "legacy": True},
        )

        special_json = json.dumps(
            {"remarks": 'O\'Reilly & Co. <script>alert("x")</script> \\ slash'}
        )
        self.assertEqual(
            parse_audit_metadata(special_json),
            {"remarks": 'O\'Reilly & Co. <script>alert("x")</script> \\ slash'},
        )

    def test_parse_double_serialized_json_string(self):
        inner = json.dumps({"remarks": "Already wrapped"})
        double_encoded = json.dumps(inner)
        self.assertEqual(
            parse_audit_metadata(double_encoded),
            {"remarks": "Already wrapped"},
        )

    def test_serialize_prevents_double_wrapping_and_normalizes_remarks(self):
        self.assertIsNone(serialize_audit_metadata(None))
        self.assertIsNone(serialize_audit_metadata({}))
        self.assertIsNone(serialize_audit_metadata(remarks="   "))

        already_json = '{"tier": "TIER_2", "hours": 48}'
        serialized = serialize_audit_metadata(already_json)
        self.assertEqual(json.loads(serialized), {"tier": "TIER_2", "hours": 48})

        from_remarks = serialize_audit_metadata(remarks="Authorized by Guardian")
        self.assertEqual(json.loads(from_remarks), {"remarks": "Authorized by Guardian"})

        json_remarks = serialize_audit_metadata(remarks='{"remarks": "Nested"}')
        self.assertEqual(json.loads(json_remarks), {"remarks": "Nested"})

        unicode_remarks = serialize_audit_metadata(remarks="தமிழ் குறிப்பு 🚀")
        self.assertEqual(json.loads(unicode_remarks), {"remarks": "தமிழ் குறிப்பு 🚀"})


class TestGatePassAuditServiceInMemory(unittest.IsolatedAsyncioTestCase):
    """In-memory SQLite async tests for GatePassService.get_audit_logs and WorkflowEngine."""

    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        self.session_factory = async_sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    async def asyncTearDown(self):
        await self.engine.dispose()

    async def test_empty_audit_logs_returns_empty_list(self):
        async with self.session_factory() as db:
            logs = await GatePassService.get_audit_logs(db)
            self.assertEqual(logs, [])

    async def test_mixed_historical_metadata_formats_read_safely(self):
        async with self.session_factory() as db:
            student = User(
                name="Test Student",
                email="test.student@campus.com",
                password="hash",
                role="student",
            )
            db.add(student)
            await db.flush()

            gp = GatePass(
                student_id=student.id,
                pass_type="weekend_leave",
                tier_level="TIER_2",
                reason="Family trip",
                destination="Salem",
                leave_time=datetime.utcnow(),
                expected_return_time=datetime.utcnow() + timedelta(hours=24),
                status="PENDING_PARENT_OTP",
                qr_code_hash="hash123",
            )
            db.add(gp)
            await db.flush()

            entries = [
                GatePassAuditLog(
                    pass_id=gp.id,
                    actor_id=student.id,
                    actor_role="STUDENT",
                    action="CREATED",
                    previous_state="NONE",
                    new_state="PENDING_PARENT_OTP",
                    metadata_json='{"tier": "TIER_2", "destination": "Salem"}',
                ),
                GatePassAuditLog(
                    pass_id=gp.id,
                    actor_id=None,
                    actor_role="GUARDIAN",
                    action="GUARDIAN_APPROVED",
                    previous_state="PENDING_PARENT_OTP",
                    new_state="PENDING_WARDEN_APPROVAL",
                    metadata_json="Authorized via 6-digit SMS OTP verification",
                ),
                GatePassAuditLog(
                    pass_id=gp.id,
                    actor_id=None,
                    actor_role="WARDEN",
                    action="WARDEN_APPROVE",
                    previous_state="PENDING_WARDEN_APPROVAL",
                    new_state="APPROVED",
                    metadata_json=None,
                ),
                GatePassAuditLog(
                    pass_id=gp.id,
                    actor_id=None,
                    actor_role="SYSTEM",
                    action="LEGACY_SYNC",
                    previous_state="APPROVED",
                    new_state="APPROVED",
                    metadata_json='{"broken": ',
                ),
                GatePassAuditLog(
                    pass_id=gp.id,
                    actor_id=None,
                    actor_role="SYSTEM",
                    action="BATCH_TAGS",
                    previous_state="APPROVED",
                    new_state="APPROVED",
                    metadata_json='["sms_sent", "qr_ready"]',
                ),
            ]
            db.add_all(entries)
            await db.commit()

            logs = await GatePassService.get_audit_logs(db)
            self.assertEqual(len(logs), 5)
            by_action = {row["action"]: row["metadata"] for row in logs}
            self.assertEqual(by_action["CREATED"], {"tier": "TIER_2", "destination": "Salem"})
            self.assertEqual(
                by_action["GUARDIAN_APPROVED"],
                {"remarks": "Authorized via 6-digit SMS OTP verification", "legacy": True},
            )
            self.assertEqual(by_action["WARDEN_APPROVE"], {})
            self.assertEqual(
                by_action["LEGACY_SYNC"],
                {"raw": '{"broken": ', "legacy": True, "malformed": True},
            )
            self.assertEqual(by_action["BATCH_TAGS"], ["sms_sent", "qr_ready"])

    async def test_workflow_transition_writes_valid_json_metadata(self):
        async with self.session_factory() as db:
            student = User(
                name="Ward Student",
                email="ward.student@campus.com",
                password="hash",
                role="student",
            )
            guardian = User(
                name="Parent Guardian",
                email="parent.guardian@campus.com",
                password="hash",
                role="guardian",
            )
            db.add_all([student, guardian])
            await db.flush()

            gp = GatePass(
                student_id=student.id,
                pass_type="weekend_leave",
                tier_level="TIER_2",
                reason="Home visit",
                destination="Home",
                leave_time=datetime.utcnow(),
                expected_return_time=datetime.utcnow() + timedelta(hours=48),
                status="PENDING_PARENT_OTP",
                qr_code_hash="hash456",
            )
            db.add(gp)
            await db.commit()

            await WorkflowEngine.transition_gate_pass(
                db=db,
                pass_id=gp.id,
                actor_user={"id": guardian.id, "email": guardian.email, "role": "guardian"},
                new_state="PENDING_WARDEN_APPROVAL",
                remarks="Approved by parent via Guardian Portal",
                action_name="GUARDIAN_APPROVED",
            )

            logs = await GatePassService.get_audit_logs(db)
            self.assertEqual(len(logs), 1)
            self.assertEqual(logs[0]["action"], "GUARDIAN_APPROVED")
            self.assertEqual(
                logs[0]["metadata"],
                {"remarks": "Approved by parent via Guardian Portal"},
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
