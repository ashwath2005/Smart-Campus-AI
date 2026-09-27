import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton } from '../../components/ui';
import {
  FileText,
  Search,
  Check,
  X,
  Calendar,
  User,
  MapPin,
  Clock,
  Filter,
  RefreshCw,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import './WardenLeaves.css';

export function WardenLeaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({
    pending_leaves: 0,
    approved_today: 0,
    rejected_today: 0,
    total_requests: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | PENDING | APPROVED | REJECTED
  const [searchTerm, setSearchTerm] = useState('');

  // Approval Modal State
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveComment, setApproveComment] = useState('Approved by Hostel Warden');
  const [approveLoading, setApproveLoading] = useState(false);

  // Rejection Modal State
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Detail Modal State
  const [detailTarget, setDetailTarget] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, statsRes] = await Promise.all([
        api.get('/warden/leaves'),
        api.get('/warden/stats')
      ]);
      setLeaves(leavesRes.data || []);
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load leave requests:', err);
      toast.error('Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    try {
      setApproveLoading(true);
      const res = await api.post(`/warden/leaves/${approveTarget.id}/approve`, {
        comment: approveComment || 'Approved by Hostel Warden'
      });
      toast.success(res.data?.message || 'Leave request approved successfully!');
      setApproveTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve leave request.');
    } finally {
      setApproveLoading(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason.');
      return;
    }
    try {
      setRejectLoading(true);
      const res = await api.post(`/warden/leaves/${rejectTarget.id}/reject`, {
        reason: rejectionReason.trim()
      });
      toast.success(res.data?.message || 'Leave request rejected successfully.');
      setRejectTarget(null);
      setRejectionReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject leave request.');
    } finally {
      setRejectLoading(false);
    }
  };

  // Filtering
  const filteredLeaves = leaves.filter((leave) => {
    // Tab filter
    if (activeTab === 'PENDING' && leave.status !== 'PENDING') return false;
    if (activeTab === 'APPROVED' && leave.status !== 'APPROVED') return false;
    if (activeTab === 'REJECTED' && leave.status !== 'REJECTED') return false;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = leave.student_name?.toLowerCase().includes(q);
      const matchRoll = leave.student_roll?.toLowerCase().includes(q);
      const matchType = leave.leave_type?.toLowerCase().includes(q);
      const matchReason = leave.reason?.toLowerCase().includes(q);
      return matchName || matchRoll || matchType || matchReason;
    }
    return true;
  });

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length;

  return (
    <div className="warden-leaves-container">
      {/* Header */}
      <div className="wl-header">
        <div className="wl-header-left">
          <h1 className="wl-title">Hostel Leave Governance</h1>
          <p className="wl-subtitle">
            Authorize or reject student residential outpass and leave applications with binding audit log.
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
          <span>Refresh</span>
        </Button>
      </div>

      {/* KPI Ribbon */}
      <div className="wl-kpi-grid">
        <div
          className={`wl-kpi-card ${activeTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => setActiveTab('PENDING')}
        >
          <div className="wl-kpi-top">
            <span className="wl-kpi-title">Pending Review</span>
            <AlertCircle size={15} className="text-amber-400" />
          </div>
          <div className="wl-kpi-val text-amber-400">{pendingCount}</div>
          <span className="wl-kpi-sub">Awaiting warden action</span>
        </div>

        <div
          className={`wl-kpi-card ${activeTab === 'APPROVED' ? 'active' : ''}`}
          onClick={() => setActiveTab('APPROVED')}
        >
          <div className="wl-kpi-top">
            <span className="wl-kpi-title">Approved Leaves</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <div className="wl-kpi-val text-emerald-400">{approvedCount}</div>
          <span className="wl-kpi-sub">{stats.approved_today} approved today</span>
        </div>

        <div
          className={`wl-kpi-card ${activeTab === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setActiveTab('REJECTED')}
        >
          <div className="wl-kpi-top">
            <span className="wl-kpi-title">Rejected Requests</span>
            <XCircle size={15} className="text-rose-400" />
          </div>
          <div className="wl-kpi-val text-rose-400">{rejectedCount}</div>
          <span className="wl-kpi-sub">{stats.rejected_today} rejected today</span>
        </div>

        <div
          className={`wl-kpi-card ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          <div className="wl-kpi-top">
            <span className="wl-kpi-title">Total Processed</span>
            <FileText size={15} className="text-slate-400" />
          </div>
          <div className="wl-kpi-val">{leaves.length}</div>
          <span className="wl-kpi-sub">All historical applications</span>
        </div>
      </div>

      {/* Controls & Search Toolbar */}
      <div className="wl-controls-bar">
        <div className="wl-tabs">
          <button
            type="button"
            className={`wl-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            <span>All Requests</span>
            <span className="wl-tab-count">{leaves.length}</span>
          </button>
          <button
            type="button"
            className={`wl-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            <span>Pending</span>
            <span className="wl-tab-count">{pendingCount}</span>
          </button>
          <button
            type="button"
            className={`wl-tab-btn ${activeTab === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setActiveTab('APPROVED')}
          >
            <span>Approved</span>
            <span className="wl-tab-count">{approvedCount}</span>
          </button>
          <button
            type="button"
            className={`wl-tab-btn ${activeTab === 'REJECTED' ? 'active' : ''}`}
            onClick={() => setActiveTab('REJECTED')}
          >
            <span>Rejected</span>
            <span className="wl-tab-count">{rejectedCount}</span>
          </button>
        </div>

        <div className="wl-search-wrapper">
          <Search size={14} className="wl-search-icon" />
          <input
            type="text"
            className="wl-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student, roll no, reason..."
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : filteredLeaves.length === 0 ? (
        <div className="wl-table-card">
          <div className="wl-empty">
            <FileText size={40} className="wl-empty-icon" />
            <p className="wl-empty-title">No leave requests found</p>
            <p className="wl-empty-sub">
              {searchTerm
                ? 'No applications match your active search filter.'
                : activeTab === 'PENDING'
                ? 'All pending leave requests have been reviewed!'
                : 'No leave applications catalogued under this section.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Data Table */}
          <div className="wl-table-card">
            <div className="wl-table-container">
              <table className="wl-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Room & Dept</th>
                    <th>Leave Schedule</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => {
                    const isPending = leave.status === 'PENDING';
                    return (
                      <tr key={leave.id}>
                        <td>
                          <div className="wl-student-cell">
                            <span className="wl-student-name">{leave.student_name}</span>
                            <span className="wl-student-sub">
                              {leave.student_roll} • {leave.student_email}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="wl-student-cell">
                            <span className="text-white font-medium text-xs">
                              {leave.student_room || 'Hostel Block A'}
                            </span>
                            <span className="wl-student-sub">{leave.student_dept}</span>
                          </div>
                        </td>

                        <td>
                          <div className="wl-leave-cell">
                            <span className="wl-leave-type">{leave.leave_type}</span>
                            <span className="wl-leave-dates">
                              <Calendar size={11} />
                              {leave.start_date} to {leave.end_date}
                            </span>
                            <span className="wl-days-pill">{leave.number_of_days} Days</span>
                          </div>
                        </td>

                        <td>
                          <div className="wl-reason-cell">
                            <p className="m-0 line-clamp-2">{leave.reason}</p>
                            {leave.supporting_document && (
                              <a
                                href={leave.supporting_document}
                                target="_blank"
                                rel="noreferrer"
                                className="wl-attachment-link"
                              >
                                <Paperclip size={11} />
                                <span>Attachment</span>
                              </a>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className={`wl-status-badge ${leave.status.toLowerCase()}`}>
                            {leave.status}
                          </span>
                          {leave.rejection_reason && (
                            <p className="text-[11px] text-rose-400 mt-1 max-w-[200px] line-clamp-1 italic">
                              "{leave.rejection_reason}"
                            </p>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div className="wl-actions-cell justify-end">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  className="wl-btn-approve"
                                  onClick={() => setApproveTarget(leave)}
                                  title="Approve Leave"
                                >
                                  <Check size={13} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  className="wl-btn-reject"
                                  onClick={() => setRejectTarget(leave)}
                                  title="Reject Leave"
                                >
                                  <X size={13} />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDetailTarget(leave)}
                                className="text-xs py-1 px-2.5 h-auto text-slate-400 hover:text-white"
                              >
                                Details
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="wl-mobile-cards">
            {filteredLeaves.map((leave) => {
              const isPending = leave.status === 'PENDING';
              return (
                <div key={leave.id} className="wl-card-item">
                  <div className="wl-card-header">
                    <div>
                      <h4 className="text-white font-semibold text-sm m-0">
                        {leave.student_name}
                      </h4>
                      <p className="text-xs text-slate-400 m-0">
                        {leave.student_roll} • {leave.student_room || 'Hostel Block A'}
                      </p>
                    </div>
                    <span className={`wl-status-badge ${leave.status.toLowerCase()}`}>
                      {leave.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <span className="font-semibold text-white">{leave.leave_type}</span>
                    <span>•</span>
                    <span>{leave.start_date} to {leave.end_date}</span>
                    <span className="wl-days-pill">{leave.number_of_days} Days</span>
                  </div>

                  <div className="wl-card-body">
                    <strong>Reason:</strong> {leave.reason}
                    {leave.rejection_reason && (
                      <div className="text-rose-400 text-xs mt-1">
                        <strong>Rejection Reason:</strong> {leave.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div className="wl-card-footer">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          className="wl-btn-reject"
                          onClick={() => setRejectTarget(leave)}
                        >
                          <X size={13} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          className="wl-btn-approve"
                          onClick={() => setApproveTarget(leave)}
                        >
                          <Check size={13} />
                          <span>Approve</span>
                        </button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailTarget(leave)}
                      >
                        View Full Details
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Approval Confirmation Modal */}
      {approveTarget && (
        <div className="wl-modal-backdrop" onClick={() => !approveLoading && setApproveTarget(null)}>
          <div className="wl-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="wl-modal-header">
              <h3 className="wl-modal-title">Approve Leave Request?</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-white"
                onClick={() => !approveLoading && setApproveTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="wl-modal-summary">
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Student:</span>
                <span className="wl-modal-row-val">{approveTarget.student_name} ({approveTarget.student_roll})</span>
              </div>
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Leave Type:</span>
                <span className="wl-modal-row-val">{approveTarget.leave_type}</span>
              </div>
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Dates:</span>
                <span className="wl-modal-row-val">
                  {approveTarget.start_date} to {approveTarget.end_date} ({approveTarget.number_of_days} days)
                </span>
              </div>
              <div>
                <span className="wl-modal-row-label">Reason:</span>
                <div className="wl-modal-reason-box">{approveTarget.reason}</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Approval Note / Warden Remarks (Optional)
              </label>
              <textarea
                className="wl-textarea"
                rows={2}
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="e.g. Approved. Expected to report back by curfew time."
              />
            </div>

            <div className="wl-modal-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApproveTarget(null)}
                disabled={approveLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmApprove}
                disabled={approveLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {approveLoading ? 'Approving...' : 'Approve Leave'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal with Mandatory Reason */}
      {rejectTarget && (
        <div className="wl-modal-backdrop" onClick={() => !rejectLoading && setRejectTarget(null)}>
          <div className="wl-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="wl-modal-header">
              <h3 className="wl-modal-title">Reject Leave Request?</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-white"
                onClick={() => !rejectLoading && setRejectTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="wl-modal-summary">
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Student:</span>
                <span className="wl-modal-row-val">{rejectTarget.student_name} ({rejectTarget.student_roll})</span>
              </div>
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Leave Type:</span>
                <span className="wl-modal-row-val">{rejectTarget.leave_type}</span>
              </div>
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Duration:</span>
                <span className="wl-modal-row-val">
                  {rejectTarget.start_date} to {rejectTarget.end_date}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-400 mb-1.5">
                Rejection Reason (Mandatory)*
              </label>
              <textarea
                className="wl-textarea"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is rejected (e.g. Academic test scheduled, insufficient notice, hostel disciplinary curfew)..."
                required
              />
            </div>

            <div className="wl-modal-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectTarget(null)}
                disabled={rejectLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReject}
                disabled={rejectLoading || !rejectionReason.trim()}
                className="bg-[#F21722] hover:bg-[#D8141E] text-white"
              >
                {rejectLoading ? 'Rejecting...' : 'Reject Leave'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailTarget && (
        <div className="wl-modal-backdrop" onClick={() => setDetailTarget(null)}>
          <div className="wl-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="wl-modal-header">
              <h3 className="wl-modal-title">Application Record #{detailTarget.id}</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-white"
                onClick={() => setDetailTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="wl-modal-summary">
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Student:</span>
                <span className="wl-modal-row-val">{detailTarget.student_name}</span>
              </div>
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Roll Number:</span>
                <span className="wl-modal-row-val">{detailTarget.student_roll}</span>
              </div>
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Hostel Room:</span>
                <span className="wl-modal-row-val">{detailTarget.student_room || 'Hostel Block A'}</span>
              </div>
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Dates:</span>
                <span className="wl-modal-row-val">{detailTarget.start_date} to {detailTarget.end_date}</span>
              </div>
              <div className="wl-modal-row">
                <span className="wl-modal-row-label">Current Status:</span>
                <span className={`wl-status-badge ${detailTarget.status.toLowerCase()}`}>
                  {detailTarget.status}
                </span>
              </div>
              {detailTarget.warden_comment && (
                <div className="wl-modal-row">
                  <span className="wl-modal-row-label">Warden Note:</span>
                  <span className="wl-modal-row-val text-slate-300">{detailTarget.warden_comment}</span>
                </div>
              )}
              {detailTarget.rejection_reason && (
                <div>
                  <span className="wl-modal-row-label text-rose-400">Rejection Reason:</span>
                  <div className="wl-modal-reason-box text-rose-300">{detailTarget.rejection_reason}</div>
                </div>
              )}
              {detailTarget.warden_reviewed_at && (
                <div className="wl-modal-row">
                  <span className="wl-modal-row-label">Processed On:</span>
                  <span className="wl-modal-row-val text-slate-400">{detailTarget.warden_reviewed_at}</span>
                </div>
              )}
            </div>

            <div className="wl-modal-actions">
              <Button variant="outline" size="sm" onClick={() => setDetailTarget(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WardenLeaves;
