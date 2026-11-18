import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui';
import {
  Settings,
  History,
  Save,
  FileText,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox
} from 'lucide-react';
import './GatePassAdmin.css';

const DEFAULT_ANALYTICS = {
  totalPasses: 0,
  approvalRatePct: 0,
  currentlyOutside: 0,
  overduePasses: 0,
  overdueRatePct: 0
};

function formatAuditMetadata(metadata) {
  if (!metadata) {
    return { text: '—', isLegacy: false, isMalformed: false };
  }

  if (Array.isArray(metadata)) {
    if (metadata.length === 0) {
      return { text: '—', isLegacy: false, isMalformed: false };
    }
    return {
      text: metadata
        .map((item) => (typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)))
        .join(', '),
      isLegacy: false,
      isMalformed: false
    };
  }

  if (typeof metadata !== 'object') {
    return { text: String(metadata), isLegacy: false, isMalformed: false };
  }

  const keys = Object.keys(metadata);
  if (keys.length === 0) {
    return { text: '—', isLegacy: false, isMalformed: false };
  }

  const isLegacy = Boolean(metadata.legacy);
  const isMalformed = Boolean(metadata.malformed);

  if (isMalformed && metadata.raw !== undefined) {
    return { text: String(metadata.raw), isLegacy: true, isMalformed: true };
  }

  if (typeof metadata.remarks === 'string' && metadata.remarks.trim()) {
    const extraEntries = Object.entries(metadata).filter(
      ([key]) => key !== 'remarks' && key !== 'legacy' && key !== 'malformed'
    );
    const extraText = extraEntries.length
      ? ` (${extraEntries.map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')})`
      : '';
    return { text: `${metadata.remarks}${extraText}`, isLegacy, isMalformed };
  }

  const formattedPairs = Object.entries(metadata)
    .filter(([key]) => key !== 'legacy' && key !== 'malformed')
    .map(([key, value]) => `${key}: ${typeof value === 'object' && value !== null ? JSON.stringify(value) : value}`);

  return {
    text: formattedPairs.length > 0 ? formattedPairs.join(' · ') : '—',
    isLegacy,
    isMalformed
  };
}

function getAuditErrorMessage(err) {
  const statusCode = err?.response?.status;
  const serverDetail = err?.response?.data?.detail;

  if (statusCode === 401) {
    return 'Your session has expired. Please sign in again to view gate pass audit logs.';
  }
  if (statusCode === 403) {
    return 'Administrator privileges are required to access immutable gate pass audit logs.';
  }
  if (typeof serverDetail === 'string' && serverDetail.trim()) {
    return serverDetail;
  }
  return 'Unable to load gate pass audit logs from the server. Please try again.';
}

export function GatePassAdmin() {
  const [policy, setPolicy] = useState({
    minAttendancePct: 70.0,
    autoApproveMaxHours: 4.0,
    overdueThresholdMinutes: 15,
    maxActivePasses: 1
  });
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchPolicyAndAnalytics = useCallback(async () => {
    const [polResult, analResult] = await Promise.allSettled([
      api.get('/gate-pass/policy'),
      api.get('/gate-pass/analytics')
    ]);

    if (polResult.status === 'fulfilled' && polResult.value?.data) {
      setPolicy(polResult.value.data);
    }
    if (analResult.status === 'fulfilled' && analResult.value?.data) {
      setAnalytics(analResult.value.data);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const logsRes = await api.get('/gate-pass/audit-logs');
      setAuditLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
    } catch (err) {
      setAuditLogs([]);
      setAuditError(getAuditErrorMessage(err));
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicyAndAnalytics();
    fetchAuditLogs();
  }, [fetchPolicyAndAnalytics, fetchAuditLogs]);

  const handleUpdatePolicy = async (e) => {
    e.preventDefault();
    setSaveMessage('');
    setSaveError('');
    try {
      await api.put('/gate-pass/policy', {
        min_attendance_pct: Number(policy.minAttendancePct),
        auto_approve_max_hours: Number(policy.autoApproveMaxHours),
        overdue_threshold_minutes: Number(policy.overdueThresholdMinutes),
        max_active_passes: Number(policy.maxActivePasses)
      });
      setSaveMessage('Gate Pass Policy configuration updated successfully!');
      fetchPolicyAndAnalytics();
    } catch (err) {
      setSaveError(err?.response?.data?.detail || 'Failed to update Gate Pass Policy configuration.');
    }
  };

  const data = analytics || DEFAULT_ANALYTICS;

  return (
    <div className="gpa-container">
      {/* Header */}
      <div className="gpa-header">
        <div className="gpa-header-left">
          <div className="gpa-title-row">
            <h1 className="gpa-title">Institutional Gate Pass Policy &amp; Audit Hub</h1>
            <span className="gpa-badge">
              ADMINISTRATOR CONTROL PANEL
            </span>
          </div>
          <p className="gpa-subtitle">Configurable Rule Engine • Mobility Analytics • Immutable Event Audit Trail</p>
        </div>
      </div>

      {/* 4 KPI Cards Grid matching SCME-AWN Spec Sheet */}
      <div className="gpa-kpi-grid">
        {/* Total Pass Requests */}
        <div className="gpa-kpi-card">
          <div className="gpa-kpi-top">
            <span className="gpa-kpi-title">Total Pass Requests</span>
            <div className="gpa-kpi-icon-circle">
              <FileText size={18} />
            </div>
          </div>
          <div className="gpa-kpi-val">{Number(data.totalPasses || 0).toLocaleString()}</div>
          <div className="gpa-kpi-trend positive">
            <TrendingUp size={13} />
            <span>Live institutional ledger</span>
          </div>
        </div>

        {/* Approval Compliance */}
        <div className="gpa-kpi-card">
          <div className="gpa-kpi-top">
            <span className="gpa-kpi-title">Approval Compliance</span>
            <div className="gpa-kpi-icon-circle">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="gpa-kpi-val">{data.approvalRatePct ?? 0}%</div>
          <div className="gpa-kpi-trend positive">
            <TrendingUp size={13} />
            <span>Authorized pass ratio</span>
          </div>
        </div>

        {/* Currently Outside */}
        <div className="gpa-kpi-card">
          <div className="gpa-kpi-top">
            <span className="gpa-kpi-title">Currently Outside</span>
            <div className="gpa-kpi-icon-circle">
              <Users size={18} />
            </div>
          </div>
          <div className="gpa-kpi-val">{data.currentlyOutside ?? 0}</div>
          <div className="gpa-kpi-subtext">Live on campus</div>
        </div>

        {/* Overdue Incidents */}
        <div className="gpa-kpi-card">
          <div className="gpa-kpi-top">
            <span className="gpa-kpi-title">Overdue Incidents</span>
            <div className="gpa-kpi-icon-circle danger">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="gpa-kpi-val text-brand-red">{data.overduePasses ?? 0}</div>
          <div className="gpa-kpi-trend negative">
            <TrendingDown size={13} />
            <span>{data.overdueRatePct ?? 0}% overdue rate</span>
          </div>
        </div>
      </div>

      {/* Policy Configurator Form */}
      <div className="gpa-section-card">
        <h3 className="gpa-card-heading">
          <Settings size={18} className="text-brand-red" />
          Institutional Policy Engine Configuration
        </h3>

        <form onSubmit={handleUpdatePolicy} className="gpa-form-grid">
          <div className="gpa-form-group">
            <label className="gpa-input-label">Minimum Attendance Threshold (%)</label>
            <input
              type="number"
              step="0.1"
              className="gpa-input-field"
              value={policy.minAttendancePct}
              onChange={(e) => setPolicy({ ...policy, minAttendancePct: e.target.value })}
              required
            />
          </div>

          <div className="gpa-form-group">
            <label className="gpa-input-label">Instant Auto-Approve Max Hours</label>
            <input
              type="number"
              step="0.5"
              className="gpa-input-field"
              value={policy.autoApproveMaxHours}
              onChange={(e) => setPolicy({ ...policy, autoApproveMaxHours: e.target.value })}
              required
            />
          </div>

          <div className="gpa-form-group">
            <label className="gpa-input-label">Overdue Detection Threshold (Minutes)</label>
            <input
              type="number"
              className="gpa-input-field"
              value={policy.overdueThresholdMinutes}
              onChange={(e) => setPolicy({ ...policy, overdueThresholdMinutes: e.target.value })}
              required
            />
          </div>

          <div className="gpa-form-group">
            <label className="gpa-input-label">Max Active Passes Per Student</label>
            <input
              type="number"
              className="gpa-input-field"
              value={policy.maxActivePasses}
              onChange={(e) => setPolicy({ ...policy, maxActivePasses: e.target.value })}
              required
            />
          </div>

          <div className="gpa-form-actions">
            <Button variant="primary" type="submit" className="gpa-btn-submit">
              <Save size={16} /> Save Policy Changes
            </Button>
            {saveMessage && <span className="gpa-success-msg">{saveMessage}</span>}
            {saveError && <span className="gpa-error-msg">{saveError}</span>}
          </div>
        </form>
      </div>

      {/* Immutable Audit Logs Table */}
      <div className="gpa-section-card">
        <div className="gpa-section-header">
          <h3 className="gpa-card-heading gpa-card-heading--flush">
            <History size={18} className="text-brand-red" />
            Immutable Gate Pass Event Audit Trail ({auditLoading || auditError ? '—' : auditLogs.length})
          </h3>

          <button
            type="button"
            onClick={fetchAuditLogs}
            disabled={auditLoading}
            className="gpa-refresh-btn"
            aria-label="Refresh audit logs"
          >
            <RefreshCw size={14} className={auditLoading ? 'gpa-spin' : ''} />
            <span>{auditLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {auditLoading ? (
          <div className="gpa-audit-state" data-testid="audit-logs-loading" role="status">
            <Loader2 size={22} className="gpa-spin text-brand-red" />
            <p className="gpa-audit-state-title">Loading immutable gate pass audit logs...</p>
            <span className="gpa-audit-state-sub">Querying verified institutional ledger</span>
          </div>
        ) : auditError ? (
          <div className="gpa-audit-error" data-testid="audit-logs-error" role="alert">
            <div className="gpa-audit-error-content">
              <AlertCircle size={20} className="text-brand-red gpa-shrink-0" />
              <div>
                <p className="gpa-audit-error-title">Could not load audit trail</p>
                <p className="gpa-audit-error-msg">{auditError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="gpa-retry-btn"
              data-testid="audit-logs-retry"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="gpa-audit-state" data-testid="audit-logs-empty">
            <Inbox size={24} className="gpa-muted-icon" />
            <p className="gpa-audit-state-title">No gate pass audit logs found</p>
            <span className="gpa-audit-state-sub">
              Lifecycle events will appear here once gate passes are requested, verified, or scanned.
            </span>
          </div>
        ) : (
          <div className="gpa-table-wrapper">
            <table className="gpa-table" data-testid="audit-logs-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Pass ID</th>
                  <th>Actor / Role</th>
                  <th>Action</th>
                  <th>State Transition</th>
                  <th>Metadata / Remarks</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => {
                  const meta = formatAuditMetadata(log.metadata);
                  return (
                    <tr key={log.id}>
                      <td className="gpa-mono-muted">#{log.id}</td>
                      <td className="gpa-mono-primary">#{log.passId}</td>
                      <td>
                        <span className="gpa-role-badge">{log.actorRole}</span>
                      </td>
                      <td className="gpa-action-cell">{log.action}</td>
                      <td className="gpa-mono-muted">
                        {log.previousState || 'NONE'} → <strong className="text-primary">{log.newState}</strong>
                      </td>
                      <td className="gpa-metadata-cell">
                        <span>{meta.text}</span>
                        {meta.isMalformed ? (
                          <span className="gpa-malformed-tag">Legacy (Malformed)</span>
                        ) : meta.isLegacy ? (
                          <span className="gpa-legacy-tag">Legacy</span>
                        ) : null}
                      </td>
                      <td className="gpa-mono-muted">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
