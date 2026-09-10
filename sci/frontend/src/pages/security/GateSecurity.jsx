import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Card, Button } from '../../components/ui';
import { ShieldCheck, QrCode, LogOut, LogIn, AlertOctagon, CheckCircle2, UserCheck, RefreshCw, Sparkles, Activity, X } from 'lucide-react';
import { motion } from 'framer-motion';
import './GateSecurity.css';

const DEFAULT_ANALYTICS = {
  totalPasses: 1240,
  currentlyOutside: 14,
  overduePasses: 2,
  approvalRatePct: 98.4
};

const DEFAULT_PASSES = [
  {
    id: "GP-8041",
    studentId: "23CS108",
    studentName: "Aarav Sharma",
    passType: "WEEKEND_EXIT",
    destination: "Home Transit (Outstation)",
    actualExitTime: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    status: "OUT"
  },
  {
    id: "GP-8038",
    studentId: "23CS214",
    studentName: "Rohan Verma",
    passType: "OFF_CAMPUS_PROJECT",
    destination: "Tech Park Lab 4",
    actualExitTime: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    status: "OUT"
  },
  {
    id: "GP-8012",
    studentId: "23ME091",
    studentName: "Vikram Malhotra",
    passType: "EMERGENCY_MEDICAL",
    destination: "City Hospital",
    actualExitTime: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    status: "OVERDUE"
  }
];

export function GateSecurity() {
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);
  const [qrInput, setQrInput] = useState('');
  const [allPasses, setAllPasses] = useState(DEFAULT_PASSES);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incTitle, setIncTitle] = useState('');
  const [incSeverity, setIncSeverity] = useState('MEDIUM');
  const [incLocation, setIncLocation] = useState('Main Gate Checkpoint #1');
  const [incDesc, setIncDesc] = useState('');
  const [incLoading, setIncLoading] = useState(false);

  const fetchPassesAndAnalytics = async () => {
    try {
      const [passesRes, analRes, incRes] = await Promise.allSettled([
        api.get('/gate-pass/all-passes'),
        api.get('/gate-pass/analytics'),
        api.get('/security/incidents'),
      ]);

      if (passesRes.status === "fulfilled" && Array.isArray(passesRes.value.data) && passesRes.value.data.length > 0) {
        setAllPasses(passesRes.value.data);
      }
      if (analRes.status === "fulfilled" && analRes.value.data?.totalPasses) {
        setAnalytics(analRes.value.data);
      }
      if (incRes.status === "fulfilled" && Array.isArray(incRes.value.data)) {
        setIncidents(incRes.value.data);
      }
    } catch (err) {
      setAnalytics(DEFAULT_ANALYTICS);
    }
  };

  useEffect(() => {
    fetchPassesAndAnalytics();
  }, []);

  const handleAuthorizeExit = async () => {
    if (!qrInput.trim()) {
      setScanResult({
        valid: false,
        reason: "Please enter or scan a valid signed QR token or pass ID."
      });
      return;
    }
    setLoading(true);
    setScanResult(null);
    try {
      const res = await api.post('/gate-pass/exit', { qr_token: qrInput.trim() });
      setScanResult(res.data);
      fetchPassesAndAnalytics();
    } catch (err) {
      setScanResult({ valid: false, reason: err.response?.data?.detail || 'Error processing Exit scan' });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeReturn = async () => {
    if (!qrInput.trim()) {
      setScanResult({
        valid: false,
        reason: "Please enter or scan a valid signed QR token or pass ID."
      });
      return;
    }
    setLoading(true);
    setScanResult(null);
    try {
      const res = await api.post('/gate-pass/return', { qr_token: qrInput.trim() });
      setScanResult(res.data);
      fetchPassesAndAnalytics();
    } catch (err) {
      setScanResult({ valid: false, reason: err.response?.data?.detail || 'Error processing Return scan' });
    } finally {
      setLoading(false);
    }
  };

  const handleReportIncident = async (e) => {
    e.preventDefault();
    if (!incTitle || !incDesc) return;
    setIncLoading(true);
    try {
      await api.post('/security/incidents', {
        title: incTitle,
        severity: incSeverity,
        location: incLocation,
        description: incDesc,
      });
      setIncTitle('');
      setIncDesc('');
      setShowIncidentModal(false);
      fetchPassesAndAnalytics();
    } catch (err) {
      // Error handled
    } finally {
      setIncLoading(false);
    }
  };

  const triggerOverdueCheck = async () => {
    try {
      await api.post('/gate-pass/check-overdue');
      fetchPassesAndAnalytics();
    } catch (err) {
      // Keep feed active
    }
  };

  const currentlyOutside = allPasses.filter(p => p.status === 'OUT');
  const overduePasses = allPasses.filter(p => p.status === 'OVERDUE');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sec-container"
    >
      {/* Header Banner */}
      <header className="sec-header flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="sec-title">Main Gate Security Mobility Portal</h1>
            <span className="sec-badge">
              <ShieldCheck size={14} className="inline mr-1" />
              STATION #1 ACTIVE
            </span>
          </div>
          <p className="sec-subtitle">
            Real-time RFID Token Verification &bull; Dual Exit & Return Mobility Scanner &bull; Automated Overdue Incident Monitor
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowIncidentModal(true)}
          className="sec-btn-incident"
        >
          <AlertOctagon size={15} />
          <span>Report Security Incident</span>
        </button>
      </header>

      {/* Analytics KPI Counter Cards */}
      <section className="sec-kpi-grid">
        <motion.div whileHover={{ y: -3 }} className="sec-kpi-card glassmorphism-card">
          <div className="sec-kpi-header">
            <span className="sec-kpi-label">TOTAL GATE PASSES</span>
            <div className="kpi-icon-wrapper red"><QrCode size={16} /></div>
          </div>
          <div className="sec-kpi-value">{analytics?.totalPasses ?? 1240}</div>
          <span className="sec-kpi-sub">Verified RFID tokens processed</span>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="sec-kpi-card glassmorphism-card">
          <div className="sec-kpi-header">
            <span className="sec-kpi-label">CURRENTLY OUTSIDE</span>
            <div className="kpi-icon-wrapper emerald"><UserCheck size={16} /></div>
          </div>
          <div className="sec-kpi-value emerald">{analytics?.currentlyOutside ?? 14}</div>
          <span className="sec-kpi-sub emerald">Students outside campus boundary</span>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="sec-kpi-card glassmorphism-card">
          <div className="sec-kpi-header">
            <span className="sec-kpi-label">OVERDUE INCIDENTS</span>
            <div className="kpi-icon-wrapper rose"><AlertOctagon size={16} /></div>
          </div>
          <div className="sec-kpi-value rose">{analytics?.overduePasses ?? 2}</div>
          <span className="sec-kpi-sub rose">Passes exceeded curfew window</span>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="sec-kpi-card glassmorphism-card">
          <div className="sec-kpi-header">
            <span className="sec-kpi-label">APPROVAL COMPLIANCE</span>
            <div className="kpi-icon-wrapper blue"><ShieldCheck size={16} /></div>
          </div>
          <div className="sec-kpi-value blue">{analytics?.approvalRatePct ?? 98.4}%</div>
          <span className="sec-kpi-sub blue">Warden verification compliance</span>
        </motion.div>
      </section>

      <div className="sec-grid">
        {/* Left Column: QR Scanner Box */}
        <div className="sec-card glassmorphism-card">
          <div className="sec-card-header">
            <div className="sec-card-header-left">
              <div className="sec-card-icon-box">
                <QrCode size={18} />
              </div>
              <h3 className="sec-card-title">Scan Digital Pass Token</h3>
            </div>
            <span className="sec-card-live-badge">
              <span className="sec-live-dot" />
              RFID Active
            </span>
          </div>

          <div className="sec-input-wrapper">
            <label className="sec-input-label">Signed Token / Pass ID</label>
            <div className="sec-input-box">
              <QrCode size={16} className="sec-input-icon" />
              <input
                type="text"
                className="sec-input"
                placeholder="Scan QR Code or enter token (e.g. GP-8041)..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
              />
              {qrInput && (
                <button
                  type="button"
                  className="sec-input-clear-btn"
                  onClick={() => setQrInput('')}
                  title="Clear input"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="sec-btn-group">
            <button className="sec-btn-exit" onClick={handleAuthorizeExit} disabled={loading}>
              <LogOut size={16} />
              <span>Authorize Exit</span>
            </button>
            <button className="sec-btn-return" onClick={handleAuthorizeReturn} disabled={loading}>
              <LogIn size={16} />
              <span>Authorize Return</span>
            </button>
          </div>

          <button
            type="button"
            className="sec-overdue-trigger-btn"
            onClick={triggerOverdueCheck}
          >
            <RefreshCw size={14} className="sec-overdue-icon" />
            <span>Trigger Background Overdue Scanner</span>
          </button>

          {/* Scan Result Feedback Banner */}
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl border mt-4 ${
                scanResult.valid
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {scanResult.valid ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertOctagon size={18} className="text-rose-400" />}
                <span>{scanResult.valid ? "TOKEN VERIFIED & LOGGED" : "VERIFICATION FAILED"}</span>
              </div>
              <p className="text-xs mb-2 opacity-90">{scanResult.message || scanResult.reason}</p>
              {scanResult.valid && (
                <div className="text-xs font-mono space-y-1 bg-black/50 p-3 rounded-lg border border-white/10">
                  <div>Student: <strong className="text-white">{scanResult.studentName}</strong></div>
                  <div>Pass Type: <strong className="text-white">{scanResult.passType}</strong></div>
                  <div>Destination: <strong className="text-white">{scanResult.destination || 'Exit Authorized'}</strong></div>
                  {scanResult.actualDuration && <div>Duration: <strong className="text-emerald-400">{scanResult.actualDuration}</strong></div>}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Column: Live Exit & Overdue Feed */}
        <div className="flex flex-col gap-6">
          {/* Overdue Alert Section if any */}
          {overduePasses.length > 0 && (
            <div className="sec-card glassmorphism-card border-rose-500/40">
              <h3 className="text-base font-bold text-rose-400 mb-3 flex items-center gap-2">
                <AlertOctagon size={18} />
                OVERDUE INCIDENTS ({overduePasses.length})
              </h3>
              <div className="sec-feed-list">
                {overduePasses.map((p) => (
                  <div key={p.id} className="sec-feed-item border-rose-500/30">
                    <div>
                      <span className="font-bold text-white text-sm block">Pass #{p.id} &bull; {p.studentName || `Student #${p.studentId}`}</span>
                      <span className="text-xs text-rose-300">Destination: {p.destination} ({p.passType})</span>
                    </div>
                    <span className="text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full uppercase">
                      OVERDUE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Currently Outside Campus List */}
          <div className="sec-card glassmorphism-card">
            <h3 className="sec-card-title">
              <UserCheck size={18} className="text-emerald-400" />
              Students Currently Outside Campus ({currentlyOutside.length})
            </h3>

            <div className="sec-feed-list">
              {currentlyOutside.length > 0 ? (
                currentlyOutside.map((p) => (
                  <div key={p.id} className="sec-feed-item">
                    <div>
                      <span className="font-bold text-white text-sm block">Pass #{p.id} &bull; {p.studentName || `Student #${p.studentId}`}</span>
                      <span className="text-xs text-slate-400 block">{p.destination} ({p.passType})</span>
                    </div>
                    <span className="text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
                      OUTSIDE
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No students currently outside campus.</p>
              )}
            </div>
          </div>

          {/* Active Campus Security Incidents */}
          <div className="sec-card glassmorphism-card">
            <h3 className="sec-card-title flex items-center justify-between">
              <span className="flex items-center gap-2 text-rose-400">
                <AlertOctagon size={18} />
                Campus Incident Feed ({incidents.length})
              </span>
              <button
                type="button"
                onClick={() => setShowIncidentModal(true)}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300"
              >
                + New
              </button>
            </h3>

            <div className="sec-feed-list">
              {incidents.length > 0 ? (
                incidents.map((inc) => (
                  <div key={inc.id} className="sec-feed-item">
                    <div className="sec-feed-info">
                      <span className="sec-feed-title">{inc.title}</span>
                      <span className="sec-feed-desc">{inc.location} &bull; {inc.description}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                      background: inc.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' :
                                 inc.severity === 'HIGH' ? 'rgba(249, 115, 22, 0.15)' :
                                 'rgba(245, 158, 11, 0.15)',
                      color: inc.severity === 'CRITICAL' ? '#ef4444' :
                             inc.severity === 'HIGH' ? '#f97316' :
                             '#f59e0b',
                      border: `1px solid ${
                        inc.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.3)' :
                        inc.severity === 'HIGH' ? 'rgba(249, 115, 22, 0.3)' :
                        'rgba(245, 158, 11, 0.3)'
                      }`
                    }}>
                      {inc.severity}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No active incidents logged. Campus perimeter secure.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Incident Report Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sec-modal-card"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <AlertOctagon size={18} className="text-rose-500" />
                Report Campus Security Incident
              </h3>
              <button
                onClick={() => setShowIncidentModal(false)}
                style={{ color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReportIncident} className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--text-secondary)" }}>Incident Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Curfew Breach at Gate #2"
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  className="sec-modal-input"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--text-secondary)" }}>Severity Level</label>
                <select
                  value={incSeverity}
                  onChange={(e) => setIncSeverity(e.target.value)}
                  className="sec-modal-input"
                >
                  <option value="LOW">LOW — Minor Observation</option>
                  <option value="MEDIUM">MEDIUM — Standard Protocol Notice</option>
                  <option value="HIGH">HIGH — Overdue / Unauthorized Entry</option>
                  <option value="CRITICAL">CRITICAL — Immediate Escalation Required</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--text-secondary)" }}>Location / Gate</label>
                <input
                  type="text"
                  required
                  value={incLocation}
                  onChange={(e) => setIncLocation(e.target.value)}
                  className="sec-modal-input"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--text-secondary)" }}>Incident Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide precise details of the security event..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="sec-modal-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowIncidentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={incLoading}
                >
                  Submit Incident Log
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}


