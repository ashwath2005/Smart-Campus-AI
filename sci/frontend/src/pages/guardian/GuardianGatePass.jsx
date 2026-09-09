import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Card, Button, Badge } from '../../components/ui';
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Clock,
  Navigation,
  User,
  AlertTriangle,
  MapPin,
  Calendar,
  AlertOctagon,
  Check,
  X,
  RefreshCw,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import './GuardianGatePass.css';

export function GuardianGatePass() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [remarksInput, setRemarksInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWardData = async () => {
    try {
      const res = await api.get('/guardian/ward-overview');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load ward overview telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardData();
  }, []);

  const handleApprove = async (passId) => {
    setSubmitting(true);
    const loadToast = toast.loading('Authorizing ward gate pass...');
    try {
      await api.post(`/guardian/gate-passes/${passId}/approve`, {
        remarks: remarksInput || 'Authorized by Guardian'
      });
      toast.success('Leave authorization granted! Forwarded to HOD/Warden.', { id: loadToast });
      setRemarksInput('');
      fetchWardData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to authorize leave request', { id: loadToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (passId) => {
    setSubmitting(true);
    const loadToast = toast.loading('Rejecting ward gate pass...');
    try {
      await api.post(`/guardian/gate-passes/${passId}/reject`, {
        remarks: remarksInput || 'Rejected by Guardian'
      });
      toast.success('Gate pass rejected.', { id: loadToast });
      setRemarksInput('');
      fetchWardData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject pass', { id: loadToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async (passId) => {
    if (!otpInput || otpInput.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code');
      return;
    }
    setSubmitting(true);
    const loadToast = toast.loading('Verifying SMS OTP...');
    try {
      await api.post(`/guardian/gate-passes/${passId}/verify-otp`, {
        otp_code: otpInput.trim()
      });
      toast.success('OTP verified & Leave authorized!', { id: loadToast });
      setOtpInput('');
      fetchWardData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP code. Please retry.', { id: loadToast });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="gdn-container">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />
            <span className="text-xs text-slate-400">Loading Ward Telemetry...</span>
          </div>
        </div>
      </div>
    );
  }

  const ward = data?.ward;
  const safety = data?.safety;
  const attendance = data?.attendance;
  const activePass = safety?.active_pass;
  const recentPasses = data?.recent_passes || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="gdn-container"
    >
      {/* Header */}
      <div className="gdn-header flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="gdn-title">Guardian Safety & Academic Oversight Portal</h1>
          <p className="gdn-subtitle">Parent Portal • Real-Time Ward Safety Telemetry & Leave Authorization</p>
        </div>
        <button
          onClick={fetchWardData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition"
        >
          <RefreshCw size={13} />
          <span>Refresh Live State</span>
        </button>
      </div>

      {/* Ward Profile & Real-Time Safety Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Ward Info */}
        <div className="gdn-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white m-0">{ward?.name || 'Student Ward'}</h3>
                <span className="text-xs text-slate-400">{ward?.roll_number} • {ward?.department}</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/5">
              <div>Semester: <strong className="text-white">Semester {ward?.semester || 4} (Sec {ward?.section || 'A'})</strong></div>
              <div>Registered Email: <strong className="text-white">{ward?.email}</strong></div>
            </div>
          </div>
        </div>

        {/* Safety Telemetry */}
        <div className="gdn-card flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Current Campus Status
            </span>
            <div className="flex items-center gap-3 mb-2">
              {safety?.status === 'INSIDE_CAMPUS' ? (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>INSIDE CAMPUS</span>
                </div>
              ) : safety?.status === 'OUTSIDE_CAMPUS' ? (
                <div className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400 text-sm font-bold flex items-center gap-2">
                  <Navigation size={16} />
                  <span>OUTSIDE CAMPUS</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-400 text-sm font-bold flex items-center gap-2 animate-pulse">
                  <AlertOctagon size={16} />
                  <span>OVERDUE RETURN</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {safety?.status === 'INSIDE_CAMPUS'
                ? 'Ward is presently inside the campus boundary.'
                : safety?.status === 'OUTSIDE_CAMPUS'
                ? `Off-campus at ${activePass?.destination || 'Destination'}. Curfew window active.`
                : 'Ward has exceeded the authorized curfew return window!'}
            </p>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="gdn-card flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Attendance Health
            </span>
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-3xl font-black ${attendance?.overall_percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {attendance?.overall_percentage ?? 85}%
              </span>
              <span className="text-xs text-slate-400">
                ({attendance?.total_attended ?? 0}/{attendance?.total_conducted ?? 0} sessions)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {attendance?.overall_percentage >= 75
                ? 'Attendance meets minimum institutional 75% threshold.'
                : '⚠️ Attendance is below 75% requirement. Academic review advised.'}
            </p>
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner if any */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {data.alerts.map((alert, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-amber-400" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Active Leave Authorization / Verification Box */}
      <div className="gdn-card mb-6">
        <h3 className="gdn-section-title">
          <KeyRound size={20} className="gdn-key-icon" />
          Active Leave Authorization Queue
        </h3>

        {activePass && (activePass.status === 'PENDING_PARENT_OTP' || !activePass.parent_verified) ? (
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <span className="text-sm font-bold text-white block">
                  {activePass.pass_type.replace(/_/g, ' ')} — Pass #{activePass.id}
                </span>
                <span className="text-xs text-slate-400">
                  Destination: <strong className="text-white">{activePass.destination}</strong> &bull; Reason: <strong className="text-white">{activePass.reason}</strong>
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                AWAITING PARENT CONSENT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/5 p-3 rounded-lg border border-white/5">
              <div>Expected Departure: <strong>{activePass.leave_time ? new Date(activePass.leave_time).toLocaleString() : 'Immediate'}</strong></div>
              <div>Expected Return: <strong>{activePass.expected_return_time ? new Date(activePass.expected_return_time).toLocaleString() : 'End of day'}</strong></div>
            </div>

            {/* 2 Ways to Authorize */}
            <div className="space-y-3 pt-2">
              {/* Method 1: 6-Digit SMS OTP verification */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Method 1: Enter 6-Digit SMS OTP Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder={activePass.parent_otp || "849201"}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="gdn-otp-input max-w-[200px]"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    loading={submitting}
                    onClick={() => handleVerifyOTP(activePass.id)}
                  >
                    <ShieldCheck size={14} className="mr-1" />
                    Verify OTP & Authorize
                  </Button>
                </div>
              </div>

              {/* Method 2: One-Click Parent Approval with Remarks */}
              <div className="border-t border-white/10 pt-3">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Method 2: One-Click Direct Approval / Rejection
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Parent remarks (e.g. Approved for family festival transit)..."
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white grow"
                  />
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      loading={submitting}
                      onClick={() => handleReject(activePass.id)}
                    >
                      <X size={14} className="mr-1" /> Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={submitting}
                      onClick={() => handleApprove(activePass.id)}
                    >
                      <Check size={14} className="mr-1" /> Approve Pass
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 bg-black/20 rounded-xl border border-white/5">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400/60" />
            <p className="text-sm font-semibold text-white">All Clear!</p>
            <p className="text-xs text-slate-400">No pending leave requests require parent authorization at this time.</p>
          </div>
        )}
      </div>

      {/* Recent Gate Pass History */}
      <div className="gdn-card">
        <h3 className="gdn-section-title">
          <Clock size={20} className="gdn-key-icon" />
          Recent Leave & Outpass History
        </h3>

        {recentPasses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Pass ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Parent Consent</th>
                  <th className="py-2.5 px-3">Terminal Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentPasses.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-3 font-mono font-bold text-white">#{p.id}</td>
                    <td className="py-3 px-3">{p.pass_type}</td>
                    <td className="py-3 px-3 text-white font-medium">{p.destination}</td>
                    <td className="py-3 px-3 max-w-[200px] truncate">{p.reason}</td>
                    <td className="py-3 px-3">
                      {p.parent_verified ? (
                        <span className="text-emerald-400 font-semibold">✓ Verified</span>
                      ) : (
                        <span className="text-slate-500">Not required</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        p.status === 'RETURNED' ? 'bg-slate-800 text-slate-300' :
                        p.status === 'OUT' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                        p.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                        p.status === 'REJECTED' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' :
                        'bg-blue-950 text-blue-400 border border-blue-500/30'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No previous gate passes recorded for ward.</p>
        )}
      </div>
    </motion.div>
  );
}
