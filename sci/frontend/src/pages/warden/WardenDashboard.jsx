import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton } from '../../components/ui';
import {
  Shield,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  QrCode,
  User,
  Activity,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import './WardenDashboard.css';

export function WardenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending_leaves: 0,
    approved_today: 0,
    rejected_today: 0,
    total_requests: 0,
    pending_gate_passes: 0
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, leavesRes] = await Promise.all([
        api.get('/warden/stats'),
        api.get('/warden/leaves?limit=5')
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (leavesRes.data) setRecentLeaves(leavesRes.data);
    } catch (err) {
      console.error('Failed to load warden dashboard metrics:', err);
      toast.error('Failed to load warden dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="warden-dashboard-container">
      {/* Header */}
      <div className="wd-header">
        <div className="wd-header-left">
          <h1 className="wd-title">Hostel Warden Governance Portal</h1>
          <p className="wd-subtitle">
            Residential campus operations, student leave approvals, curfew monitoring, and gate pass management.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </Button>
      </div>

      {/* Hero CTA Banner */}
      <div className="wd-hero-banner">
        <div className="wd-hero-content">
          <h2 className="wd-hero-title">
            {stats.pending_leaves > 0
              ? `${stats.pending_leaves} Student Leave Application${stats.pending_leaves > 1 ? 's' : ''} Require Review`
              : 'All Student Leave Applications are Current'}
          </h2>
          <p className="wd-hero-desc">
            Verify residential leave reasons, evaluate travel dates against academic examinations, and submit binding approval or rejection with audited notes.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/warden/leaves')}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <span>Review Leave Requests</span>
          <ArrowRight size={16} />
        </Button>
      </div>

      {/* Real-time KPI Stats Ribbon */}
      <div className="wd-stats-grid">
        <div
          className="wd-stat-card cursor-pointer"
          onClick={() => navigate('/warden/leaves')}
        >
          <div className="wd-stat-top">
            <span className="wd-stat-label">Pending Leaves</span>
            <AlertCircle size={16} className="text-amber-400" />
          </div>
          <div className="wd-stat-num text-amber-400">{stats.pending_leaves}</div>
          <span className="wd-stat-sub">Awaiting warden action</span>
        </div>

        <div className="wd-stat-card">
          <div className="wd-stat-top">
            <span className="wd-stat-label">Approved Today</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="wd-stat-num text-emerald-400">{stats.approved_today}</div>
          <span className="wd-stat-sub">Leaves authorized today</span>
        </div>

        <div className="wd-stat-card">
          <div className="wd-stat-top">
            <span className="wd-stat-label">Rejected Today</span>
            <XCircle size={16} className="text-rose-400" />
          </div>
          <div className="wd-stat-num text-rose-400">{stats.rejected_today}</div>
          <span className="wd-stat-sub">Requests declined today</span>
        </div>

        <div
          className="wd-stat-card cursor-pointer"
          onClick={() => navigate('/gate-pass-admin')}
        >
          <div className="wd-stat-top">
            <span className="wd-stat-label">Gate Passes</span>
            <QrCode size={16} className="text-cyan-400" />
          </div>
          <div className="wd-stat-num">{stats.pending_gate_passes}</div>
          <span className="wd-stat-sub">Pending gate approval</span>
        </div>
      </div>

      {/* Main Grid: Recent Leaves & Shortcuts */}
      <div className="wd-main-grid">
        {/* Left: Recent Leave Applications */}
        <div className="wd-card">
          <div className="wd-card-header">
            <h3 className="wd-card-title">
              <FileText size={18} className="text-[#F21722]" />
              <span>Recent Leave Applications</span>
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/warden/leaves')}
              className="text-xs"
            >
              View All ({stats.total_requests})
            </Button>
          </div>

          {loading ? (
            <Skeleton variant="card" count={2} />
          ) : recentLeaves.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No leave applications recorded in system yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="wd-recent-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>
                        <div className="font-semibold text-white">{leave.student_name}</div>
                        <div className="text-[11px] text-slate-500">{leave.student_roll}</div>
                      </td>
                      <td>{leave.leave_type}</td>
                      <td>
                        <div className="text-slate-300">{leave.start_date}</div>
                        <div className="text-[10px] text-slate-500">to {leave.end_date}</div>
                      </td>
                      <td>
                        <span className={`wd-badge-sm ${leave.status.toLowerCase()}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/warden/leaves')}
                          className="text-xs py-1 px-2.5 h-auto text-slate-300"
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Quick Action Shortcuts & Identity */}
        <div className="flex flex-col gap-4">
          <div className="wd-card">
            <div className="wd-card-header">
              <h3 className="wd-card-title">
                <Shield size={18} className="text-[#F21722]" />
                <span>Hostel Operations</span>
              </h3>
            </div>

            <div className="wd-shortcuts-list">
              <div
                className="wd-shortcut-item"
                onClick={() => navigate('/warden/leaves')}
              >
                <div className="wd-shortcut-left">
                  <FileText size={17} className="text-[#F21722]" />
                  <div>
                    <div className="wd-shortcut-label">Leave Management</div>
                    <div className="wd-shortcut-desc">Approve or reject leave requests</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-500" />
              </div>

              <div
                className="wd-shortcut-item"
                onClick={() => navigate('/gate-pass-admin')}
              >
                <div className="wd-shortcut-left">
                  <QrCode size={17} className="text-cyan-400" />
                  <div>
                    <div className="wd-shortcut-label">Gate Pass Console</div>
                    <div className="wd-shortcut-desc">Policy configuration & audit trail</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-500" />
              </div>

              <div
                className="wd-shortcut-item"
                onClick={() => navigate('/warden/profile')}
              >
                <div className="wd-shortcut-left">
                  <User size={17} className="text-emerald-400" />
                  <div>
                    <div className="wd-shortcut-label">Warden Profile</div>
                    <div className="wd-shortcut-desc">Jurisdiction & contact credentials</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-500" />
              </div>

              <div
                className="wd-shortcut-item"
                onClick={() => navigate('/campus-pulse')}
              >
                <div className="wd-shortcut-left">
                  <Activity size={17} className="text-amber-400" />
                  <div>
                    <div className="wd-shortcut-label">Campus Pulse 3D</div>
                    <div className="wd-shortcut-desc">Hostel occupancy & checkpoint status</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WardenDashboard;
