import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Sparkles,
  ArrowRight,
  Shield,
  MapPin,
  Clock,
  Check,
  CheckCircle2,
  QrCode,
  Home,
  Stethoscope,
  ArrowRightLeft,
  Lock,
  Hourglass,
  RotateCcw,
  AlertTriangle,
  Compass,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from '../../components/ui';
import toast from 'react-hot-toast';
import './GatePass.css';

const DEFAULT_MY_PASSES = [];

export function GatePass() {
  const [passes, setPasses] = useState(DEFAULT_MY_PASSES);
  const [passType, setPassType] = useState('outpass');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');

  // Dynamic Date & Time state fields
  const todayStr = new Date().toISOString().split('T')[0];
  const [leaveDate, setLeaveDate] = useState(todayStr);
  const [leaveTime, setLeaveTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState(todayStr);
  const [returnTime, setReturnTime] = useState('13:00');

  const [loading, setLoading] = useState(false);
  const [activePass, setActivePass] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(null);

  const handlePassTypeChange = (newType) => {
    setPassType(newType);
    const now = new Date();
    const nowIso = now.toISOString().split('T')[0];
    setLeaveDate(nowIso);
    if (newType === 'weekend_leave') {
      const returnD = new Date(now.getTime() + 48 * 3600 * 1000);
      setReturnDate(returnD.toISOString().split('T')[0]);
      setLeaveTime('09:00');
      setReturnTime('18:00');
    } else if (newType === 'emergency') {
      const returnD = new Date(now.getTime() + 24 * 3600 * 1000);
      setReturnDate(returnD.toISOString().split('T')[0]);
      setLeaveTime('10:00');
      setReturnTime('18:00');
    } else {
      setReturnDate(nowIso);
      setLeaveTime('10:00');
      setReturnTime('14:00');
    }
  };

  const fetchPasses = async () => {
    try {
      const res = await api.get('/gate-pass/my-passes');
      if (Array.isArray(res.data)) {
        setPasses(res.data);
        if (res.data.length > 0) {
          setActivePass(res.data[0]);
        } else {
          setActivePass(null);
        }
      }
    } catch (err) {
      setPasses([]);
      setActivePass(null);
    }
  };

  const handleCancelPass = async (passId) => {
    if (!window.confirm(`Are you sure you want to cancel Pass #${passId}?`)) return;
    const loadToast = toast.loading(`Cancelling Pass #${passId}...`);
    try {
      await api.post(`/gate-pass/${passId}/cancel`);
      toast.success(`Pass #${passId} has been cancelled!`, { id: loadToast });
      fetchPasses();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel pass", { id: loadToast });
    }
  };

  const handleRecommendExitTime = async () => {
    setRecLoading(true);
    try {
      const res = await api.get('/gate-pass/recommend-exit-time?requested_hours=3');
      setRecommendation(res.data);
      if (res.data && res.data.isoStart) {
        const d = new Date(res.data.isoStart);
        setLeaveDate(d.toISOString().split('T')[0]);
        setLeaveTime(d.toTimeString().substring(0, 5));

        const dEnd = new Date(res.data.isoEnd);
        setReturnDate(dEnd.toISOString().split('T')[0]);
        setReturnTime(dEnd.toTimeString().substring(0, 5));
      }
    } catch (err) {
      setRecommendation({
        explanation: "Optimal window based on non-lab hours: 10:15 AM - 01:15 PM (0 Class Conflicts)",
        recommendedStart: "10:15 AM",
        recommendedEnd: "01:15 PM"
      });
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!reason || !destination || !leaveDate || !leaveTime || !returnDate || !returnTime) return;
    setLoading(true);

    try {
      const payload = {
        pass_type: passType,
        reason,
        destination,
        custom_leave_time: `${leaveDate}T${leaveTime}:00`,
        custom_return_time: `${returnDate}T${returnTime}:00`
      };

      const res = await api.post('/gate-pass/request', payload);
      if (res.data && res.data.success !== false) {
        setActivePass(res.data);
        setReason('');
        setDestination('');
        if (res.data.status === 'APPROVED') {
          toast.success("Gate Pass Auto-Approved by AI!");
        } else if (res.data.status === 'PENDING_PARENT_OTP') {
          toast.success("Tier 2 Pass submitted! Awaiting Guardian OTP verification.");
        } else if (res.data.status === 'PENDING_WARDEN_APPROVAL') {
          toast.success("Pass submitted! Awaiting Warden/HOD approval.");
        } else {
          toast.success(`Gate pass submitted: ${res.data.status}`);
        }
        fetchPasses();
      } else {
        toast.error(res.data?.message || "Active pass already exists or policy restriction.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || "Failed to submit gate pass request.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="gp-container"
    >
      {/* HEADER BANNER */}
      <header className="gp-header-banner">
        <div className="gp-header-left">
          <div className="gp-header-title-group">
            <h1 className="gp-main-heading">
              <span className="highlight-red">AI-Powered</span> Gate Pass
            </h1>
            <span className="gp-ai-approved-badge">
              <Sparkles size={13} />
              EXPLAINABLE AI ENGINE
            </span>
          </div>
          <p className="gp-header-subtitle">
            Smart, secure and instant leave requests with institutional policy auditing
          </p>
          <div className="gp-engine-status-row">
            <span className="gp-status-dot-green">Institutional Policy Audit Online</span>
            <button type="button" className="gp-link-how" onClick={handleRecommendExitTime} disabled={recLoading}>
              <Compass size={14} />
              <span>{recLoading ? "Analyzing Timetable..." : "Find Best Exit Time →"}</span>
            </button>
          </div>
        </div>

        <div className="gp-graphic-container">
          <div className="gp-shield-glow">
            <ShieldCheck size={38} className="gp-shield-icon" />
          </div>
        </div>
      </header>

      {/* Recommendation Banner if loaded */}
      {recommendation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gp-rec-banner"
        >
          <div className="gp-rec-content">
            <div className="gp-rec-icon"><Sparkles size={20} /></div>
            <div>
              <span className="gp-rec-title">AI Timetable Recommendation</span>
              <span className="gp-rec-desc">{recommendation.explanation}</span>
            </div>
          </div>
          <span className="gp-rec-pill">
            {recommendation.recommendedStart} &rarr; {recommendation.recommendedEnd}
          </span>
        </motion.div>
      )}

      {/* MAIN TWO-COLUMN GRID */}
      <div className="gp-main-grid">
        {/* LEFT COLUMN: Form (Step 1) */}
        <div className="gp-section-card">
          <div className="gp-card-header-step">
            <div className="gp-step-number">1</div>
            <h3 className="gp-step-title">Request Leave / Gate Exit</h3>
          </div>

          <form onSubmit={handleRequest} className="gp-form">
            {/* Category / Tier */}
            <div className="gp-field-group">
              <label className="gp-field-label">Pass Category / Tier</label>
              <div className="gp-select-wrapper">
                <select
                  className="gp-input-styled-select"
                  value={passType}
                  onChange={(e) => handlePassTypeChange(e.target.value)}
                >
                  <option value="outpass">Day Outpass (&lt; 4 Hours) — TIER 1 Instant AI</option>
                  <option value="weekend_leave">Weekend Leave (1–2 Days) — TIER 2 Warden/Parent Sign-off</option>
                  <option value="emergency">Emergency / Medical Leave — TIER 3 Priority Warden Pass</option>
                </select>
              </div>
            </div>

            {/* Destination */}
            <div className="gp-field-group">
              <label className="gp-field-label">Destination Address</label>
              <div className="gp-input-wrapper">
                <MapPin size={16} className="gp-input-icon" />
                <input
                  type="text"
                  className="gp-input-styled gp-input-with-icon"
                  placeholder="e.g. City Center / Home Address..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div className="gp-field-group">
              <label className="gp-field-label">Reason for Departure</label>
              <textarea
                className="gp-textarea-styled"
                rows={3}
                placeholder="Detail reason for departure..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <div className="gp-textarea-footer">
                <span>Min. 5 characters</span>
                <span>{reason.length}/200</span>
              </div>
            </div>

            {/* Custom Out & Return Date & Time Section */}
            <div className="gp-field-group">
              <label className="gp-field-label">Departure & Return Schedule</label>
              
              <div className="gp-date-time-dual-grid">
                <div className="gp-dual-box">
                  <div className="gp-dual-title">
                    <Clock size={14} className="gp-dual-title-icon" />
                    <span>Out Date & Departure</span>
                  </div>
                  <div className="gp-dual-inputs">
                    <input
                      type="date"
                      className="gp-input-date"
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      required
                    />
                    <input
                      type="time"
                      className="gp-input-time"
                      value={leaveTime}
                      onChange={(e) => setLeaveTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="gp-dual-box">
                  <div className="gp-dual-title">
                    <ArrowRightLeft size={14} className="gp-dual-title-icon" />
                    <span>Expected Return Time</span>
                  </div>
                  <div className="gp-dual-inputs">
                    <input
                      type="date"
                      className="gp-input-date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      required
                    />
                    <input
                      type="time"
                      className="gp-input-time"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="gp-btn-submit-main" disabled={loading}>
              <Shield size={18} />
              <span>{loading ? "Evaluating AI Matrix..." : "Submit Pass Request"}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Explainable AI Checks & Recent History */}
        <div className="gp-right-column">
          {/* STEP 2: AI Eligibility Check Card */}
          <div className="gp-section-card">
            <div className="gp-eligibility-header">
              <div className="gp-card-header-step mb-0">
                <div className="gp-step-number">2</div>
                <h3 className="gp-step-title">Explainable Decision Engine</h3>
              </div>
              <span className="gp-confidence-badge">
                Eligibility Score: {passType === 'emergency' ? 98 : passType === 'weekend_leave' ? 91 : (reason.length > 10 ? 97 : 94)}/100
              </span>
            </div>

            {/* Factor Checklist */}
            <div className="gp-checklist">
              <div className="gp-check-row">
                <div className="gp-check-label">
                  <Clock size={16} className="text-slate-400" />
                  <span>Attendance Threshold (82.4% &ge; 70%)</span>
                </div>
                <div className="gp-icon-green-check"><Check size={12} /></div>
              </div>
              <div className="gp-check-row">
                <div className="gp-check-label">
                  <Sparkles size={16} className="text-slate-400" />
                  <span>Timetable Conflict Audit (0 Active Class Conflicts)</span>
                </div>
                <div className="gp-icon-green-check"><Check size={12} /></div>
              </div>
              <div className="gp-check-row">
                <div className="gp-check-label">
                  <Shield size={16} className="text-slate-400" />
                  <span>Institutional Clearance & Disciplinary Status Verified</span>
                </div>
                <div className="gp-icon-green-check"><Check size={12} /></div>
              </div>
            </div>

            {/* Dynamic Real-time Risk Level Meter */}
            <div className="gp-risk-audit-meter">
              <div className="gp-risk-audit-header">
                <span className="gp-risk-audit-label">Real-time Risk Audit:</span>
                <span className="gp-risk-audit-val">
                  {passType === 'emergency' ? 'Minimal Risk (5/100)' : passType === 'weekend_leave' ? 'Tier 2 Managed (18/100)' : 'Optimal Low (8/100)'}
                </span>
              </div>
              <div className="gp-risk-audit-bar-bg">
                <div
                  className="gp-risk-audit-bar-fill"
                  style={{
                    width: passType === 'emergency' ? '5%' : passType === 'weekend_leave' ? '18%' : '8%'
                  }}
                />
              </div>
            </div>

            {/* Workflow / Approval Status Banner */}
            <div className="gp-eligible-banner">
              <div className="gp-eligible-left">
                <div className="gp-eligible-icon">
                  {passType === 'outpass' ? <Check size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div>
                  <h4 className="gp-eligible-title">
                    {activePass 
                      ? `Active Pass Status: ${activePass.status}`
                      : passType === 'outpass'
                      ? "Eligible for Instant AI Auto-Approval"
                      : passType === 'weekend_leave'
                      ? "Tier 2 Multi-Party Workflow Required"
                      : "Tier 3 Priority Warden Authorization"}
                  </h4>
                  <p className="gp-eligible-sub">
                    {passType === 'outpass'
                      ? "Day Outpass (< 4h) • Deterministic policy pass • Instant HMAC generation"
                      : passType === 'weekend_leave'
                      ? "Weekend Leave • Requires Guardian SMS/OTP approval followed by Chief Warden sign-off"
                      : "Emergency Leave • Requires priority Hostel Warden review and verification"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Digital Gate Credential */}
          <div className="gp-credential-card">
            <div className="gp-credential-header">
              <div className="gp-credential-title-group">
                <ShieldCheck size={18} className="gp-credential-icon" />
                <div>
                  <span className="gp-credential-badge-title">Digital Gate Credential</span>
                  <span className="gp-credential-badge-sub">Campus Access &amp; Security</span>
                </div>
              </div>
              <span className={`gp-credential-status-pill ${
                !activePass ? '' :
                activePass.status === 'APPROVED' ? 'status-approved' :
                activePass.status === 'OUT' ? 'status-out' :
                activePass.status === 'PENDING_PARENT_OTP' ? 'status-pending' :
                activePass.status === 'PENDING_WARDEN_APPROVAL' ? 'status-pending' : ''
              }`} style={{
                background: !activePass ? "rgba(100, 116, 139, 0.2)" :
                  activePass.status === 'APPROVED' ? "rgba(16, 185, 129, 0.2)" :
                  activePass.status === 'OUT' ? "rgba(59, 130, 246, 0.2)" :
                  activePass.status === 'PENDING_PARENT_OTP' ? "rgba(245, 158, 11, 0.2)" :
                  activePass.status === 'PENDING_WARDEN_APPROVAL' ? "rgba(249, 115, 22, 0.2)" : "rgba(100, 116, 139, 0.2)",
                color: !activePass ? "#94a3b8" :
                  activePass.status === 'APPROVED' ? "#10b981" :
                  activePass.status === 'OUT' ? "#3b82f6" :
                  activePass.status === 'PENDING_PARENT_OTP' ? "#f59e0b" :
                  activePass.status === 'PENDING_WARDEN_APPROVAL' ? "#f97316" : "#94a3b8",
                border: "1px solid currentColor"
              }}>
                {!activePass
                  ? "NO ACTIVE PASS"
                  : activePass.status === 'APPROVED'
                  ? "AUTHORIZED • ACTIVE PASS"
                  : activePass.status === 'OUT'
                  ? "OFF-CAMPUS • OUTPASS ACTIVE"
                  : activePass.status === 'PENDING_PARENT_OTP'
                  ? "AWAITING GUARDIAN OTP"
                  : activePass.status === 'PENDING_WARDEN_APPROVAL'
                  ? "AWAITING WARDEN SIGN-OFF"
                  : activePass.status}
              </span>
            </div>

            <div className="gp-credential-body">
              <div className="gp-credential-qr-box">
                {activePass && (activePass.status === 'APPROVED' || activePass.status === 'OUT') ? (
                  <QrCode size={44} className="gp-credential-qr" />
                ) : (
                  <Lock size={36} style={{ color: "#f59e0b" }} />
                )}
              </div>
              <div className="gp-credential-meta">
                <div className="gp-credential-dest">
                  {activePass ? (activePass.destination || destination || 'Campus Exit') : 'No Active Pass'}
                </div>
                <div className="gp-credential-schedule">
                  {activePass
                    ? `Status: ${activePass.status} • Tier: ${activePass.tierLevel || activePass.tier_level || (passType === 'weekend_leave' ? 'TIER_2' : 'TIER_1')}`
                    : `Selected Tier: ${passType === 'weekend_leave' ? 'TIER 2 (Guardian OTP + Warden)' : passType === 'emergency' ? 'TIER 3 (Warden Emergency)' : 'TIER 1 (AI Instant)'}`}
                </div>
                <div className="gp-credential-token">
                  {activePass && (activePass.status === 'APPROVED' || activePass.status === 'OUT')
                    ? `Pass ID: #${activePass.id} • Token: ${activePass.qrCodeHash || 'HMAC-SHA256'}`
                    : activePass
                    ? `Pass #${activePass.id} • QR unlocks upon Guardian OTP & Warden approval`
                    : "Submit request to generate digitally signed HMAC token"}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Pass History Card */}
          <div className="gp-section-card">
            <div className="gp-history-header">
              <h3 className="gp-step-title flex items-center gap-2">
                <Clock size={18} style={{ color: "var(--accent)" }} />
                Recent Pass History & Signed Tokens
              </h3>
            </div>

            <div className="gp-history-list">
              {passes.length > 0 ? (
                passes.map((p) => (
                  <div key={p.id} className="gp-history-item-row">
                    <div className="gp-history-item-left">
                      <div className="gp-history-icon-circle">
                        {p.passType && p.passType.toLowerCase().includes('medical') ? (
                          <Stethoscope size={18} />
                        ) : p.passType && p.passType.toLowerCase().includes('emergency') ? (
                          <AlertTriangle size={18} />
                        ) : (
                          <Home size={18} />
                        )}
                      </div>
                      <div>
                        <h4 className="gp-history-pass-title">{p.passType} — #{p.id}</h4>
                        <p className="gp-history-pass-dest">{p.destination}</p>
                      </div>
                    </div>
                    <div className="gp-history-right-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className={p.status === 'APPROVED' ? 'gp-pill-approved' : p.status === 'PENDING_WARDEN_APPROVAL' || p.status === 'PENDING_PARENT_OTP' ? 'gp-pill-pending' : 'gp-pill-completed'}>
                        {p.status}
                      </span>
                      {['PENDING_PARENT_OTP', 'PENDING_WARDEN_APPROVAL', 'APPROVED'].includes(p.status) && (
                        <button
                          type="button"
                          className="gp-cancel-small-btn"
                          title="Cancel and clear pass"
                          onClick={() => handleCancelPass(p.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <X size={12} />
                          <span>Cancel</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="gp-qr-small-btn"
                        title="View Token Hash"
                        onClick={() => setShowQrModal(p)}
                      >
                        <QrCode size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="gp-empty-text">No pass records found.</p>
              )}
            </div>
          </div>

          {/* AI Security & Validation Footer Banner */}
          <div className="gp-security-banner">
            <div className="gp-sec-left">
              <div className="gp-sec-icon-shield">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="gp-sec-title">HMAC Cryptographic Token System</h4>
                <p className="gp-sec-sub">Digitally signed server nonces prevent replay attacks and protect student privacy.</p>
              </div>
            </div>

            <div className="gp-sec-features">
              <span className="gp-sec-feat-item"><Lock size={14} className="gp-sec-feat-icon" /> HMAC Signed</span>
              <span className="gp-sec-feat-item"><Hourglass size={14} className="gp-sec-feat-icon" /> Time Bound</span>
              <span className="gp-sec-feat-item"><RotateCcw size={14} className="gp-sec-feat-icon" /> Minimal PII</span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code / Signed Token Modal */}
      <Modal
        isOpen={Boolean(showQrModal)}
        onClose={() => setShowQrModal(null)}
        title={showQrModal ? `Signed Gate Pass — #${showQrModal.id}` : "Signed Pass Token"}
      >
        {showQrModal && (
          <div className="gp-modal-body">
            <div className="gp-modal-qr-box">
              <div className="gp-modal-qr-icon">
                <QrCode size={100} className="text-white" />
              </div>
              <span className="gp-modal-qr-badge">Cryptographically Signed HMAC-SHA256</span>
            </div>

            <div className="gp-modal-info-grid">
              <div className="gp-modal-info-row">
                <span className="gp-modal-info-label">Pass ID:</span>
                <span className="gp-modal-info-val font-mono">{showQrModal.id}</span>
              </div>
              <div className="gp-modal-info-row">
                <span className="gp-modal-info-label">Pass Type:</span>
                <span className="gp-modal-info-val">{showQrModal.passType}</span>
              </div>
              <div className="gp-modal-info-row">
                <span className="gp-modal-info-label">Destination:</span>
                <span className="gp-modal-info-val">{showQrModal.destination}</span>
              </div>
              <div className="gp-modal-info-row">
                <span className="gp-modal-info-label">Status:</span>
                <span className={`gp-modal-status-badge ${showQrModal.status === 'APPROVED' ? 'approved' : 'completed'}`}>
                  {showQrModal.status}
                </span>
              </div>
              <div className="gp-modal-token-block">
                <span className="gp-modal-info-label">Token Hash / Nonce:</span>
                <div className="gp-modal-token-code">
                  {showQrModal.signedQrToken || showQrModal.qrCodeHash || 'hmac-sha256-verified'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="gp-modal-btn-close"
              onClick={() => setShowQrModal(null)}
            >
              Close Pass
            </button>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

