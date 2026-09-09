from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class GatePass(Base):
    __tablename__ = "gate_passes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pass_type = Column(String(50), nullable=False, default="outpass")  # outpass, weekend_leave, emergency, medical
    tier_level = Column(String(20), nullable=False, default="TIER_1")  # TIER_1 (Day), TIER_2 (Weekend), TIER_3 (Emergency)
    reason = Column(String(300), nullable=False)
    destination = Column(String(200), nullable=False)
    leave_time = Column(DateTime, nullable=False, default=func.now())
    expected_return_time = Column(DateTime, nullable=False)
    
    # Separate Exit and Return timestamps
    actual_exit_time = Column(DateTime, nullable=True)
    actual_return_time = Column(DateTime, nullable=True)
    
    # State Machine: SUBMITTED, ELIGIBILITY_CHECK, PENDING_PARENT_OTP, PENDING_WARDEN_APPROVAL, APPROVED, OUT, RETURNED, REJECTED, EXPIRED, CANCELLED, OVERDUE
    status = Column(String(50), nullable=False, default="APPROVED")
    
    # Parent & Multi-Tier Verification
    parent_mobile = Column(String(20), nullable=True, default="+91 98765 43210")
    parent_otp = Column(String(10), nullable=True, default="849201")
    parent_verified = Column(Boolean, default=False)
    tutor_approved = Column(Boolean, default=False)
    warden_approved = Column(Boolean, default=False)
    exam_collision_warning = Column(Boolean, default=False)
    
    # Cryptographic Security & Minimal PII Signed Token
    signed_qr_token = Column(String(500), nullable=True)
    qr_nonce = Column(String(64), nullable=True)
    qr_code_hash = Column(String(250), nullable=False)
    
    # Explainable AI Decision Engine & Risk Metrics
    auto_approved_by_ai = Column(Boolean, default=True)
    eligibility_score = Column(Float, default=92.0)  # 0 to 100
    risk_score = Column(Float, default=15.0)         # 0 to 100
    risk_level = Column(String(20), default="LOW")   # LOW, MODERATE, HIGH
    explanation_json = Column(Text, nullable=True)   # JSON string of explainable checks
    
    created_at = Column(DateTime, default=func.now())

    # Relationship
    student = relationship("User", foreign_keys=[student_id])


class GatePassPolicy(Base):
    __tablename__ = "gate_pass_policies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    policy_name = Column(String(100), nullable=False, default="Default Institutional Policy")
    min_attendance_pct = Column(Float, nullable=False, default=70.0)
    auto_approve_max_hours = Column(Float, nullable=False, default=4.0)
    overdue_threshold_minutes = Column(Integer, nullable=False, default=15)
    max_active_passes = Column(Integer, nullable=False, default=1)
    escalation_parent_mins = Column(Integer, nullable=False, default=15)
    escalation_warden_mins = Column(Integer, nullable=False, default=30)
    escalation_admin_mins = Column(Integer, nullable=False, default=60)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())


class GatePassAuditLog(Base):
    __tablename__ = "gate_pass_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pass_id = Column(Integer, ForeignKey("gate_passes.id", ondelete="CASCADE"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_role = Column(String(50), nullable=False, default="SYSTEM") # STUDENT, GUARDIAN, SECURITY, WARDEN, SYSTEM
    action = Column(String(100), nullable=False)                      # CREATED, EXITED, RETURNED, VERIFIED_OTP, OVERDUE, REJECTED
    previous_state = Column(String(50), nullable=True)
    new_state = Column(String(50), nullable=False)
    metadata_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=func.now())
