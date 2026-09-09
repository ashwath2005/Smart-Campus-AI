import React from 'react';
import { Card } from '../../../components/ui';
import { Users, GraduationCap, DoorOpen, Calendar, FlaskConical, Activity } from 'lucide-react';

export function PulseOverview({ pulseData }) {
  if (!pulseData) return null;

  const {
    activityScore = 0,
    status = 'NORMAL',
    baseline = 72,
    changeFromBaseline = 0,
    students = {},
    faculty = {},
    rooms = {},
    events = {},
    labs = {}
  } = pulseData;

  const scorePct = Math.min(100, Math.max(0, activityScore));

  return (
    <div className="cp-overview-grid">
      {/* Primary Dial Card */}
      <Card hoverGlow={false} className="cp-dial-card">
        <div className="cp-dial-wrapper" style={{ '--score-pct': scorePct }}>
          <svg className="cp-dial-svg" viewBox="0 0 160 160">
            <circle className="cp-dial-bg" cx="80" cy="80" r="70" />
            <circle className="cp-dial-progress" cx="80" cy="80" r="70" />
          </svg>
          <span className="cp-dial-score">{Math.round(activityScore)}%</span>
          <span className="cp-dial-label">CAMPUS PULSE</span>
        </div>
        <div className="cp-status-chip">
          <Activity size={13} />
          {status} ACTIVITY
        </div>
        <span className="cp-variance-text">
          {changeFromBaseline >= 0 ? `↑ ${changeFromBaseline}%` : `↓ ${Math.abs(changeFromBaseline)}%`} vs baseline ({baseline}%)
        </span>
      </Card>

      {/* 5 Sub-metric Cards */}
      <div className="cp-metrics-grid">
        {/* Active Students */}
        <Card hoverGlow={false} className="cp-metric-card">
          <div className="cp-metric-top">
            <div className="cp-metric-icon">
              <Users size={18} />
            </div>
            <span className="cp-metric-score">{students.score || 0}%</span>
          </div>
          <span className="cp-metric-val">{students.active || 0}</span>
          <span className="cp-metric-lbl">Active Students</span>
        </Card>

        {/* Active Faculty */}
        <Card hoverGlow={false} className="cp-metric-card">
          <div className="cp-metric-top">
            <div className="cp-metric-icon">
              <GraduationCap size={18} />
            </div>
            <span className="cp-metric-score">{faculty.score || 0}%</span>
          </div>
          <span className="cp-metric-val">{faculty.active || 0}</span>
          <span className="cp-metric-lbl">Active Faculty</span>
        </Card>

        {/* Occupied Rooms */}
        <Card hoverGlow={false} className="cp-metric-card">
          <div className="cp-metric-top">
            <div className="cp-metric-icon">
              <DoorOpen size={18} />
            </div>
            <span className="cp-metric-score">{rooms.utilization || 0}%</span>
          </div>
          <span className="cp-metric-val">{rooms.occupied || 0} / {rooms.total || 0}</span>
          <span className="cp-metric-lbl">Occupied Rooms</span>
        </Card>

        {/* Active Events */}
        <Card hoverGlow={false} className="cp-metric-card">
          <div className="cp-metric-top">
            <div className="cp-metric-icon">
              <Calendar size={18} />
            </div>
            <span className="cp-metric-score">{events.score || 0}%</span>
          </div>
          <span className="cp-metric-val">{events.active || 0}</span>
          <span className="cp-metric-lbl">Active Events</span>
        </Card>

        {/* Active Labs */}
        <Card hoverGlow={false} className="cp-metric-card">
          <div className="cp-metric-top">
            <div className="cp-metric-icon">
              <FlaskConical size={18} />
            </div>
            <span className="cp-metric-score">{labs.score || 0}%</span>
          </div>
          <span className="cp-metric-val">{labs.active || 0} / {labs.total || 0}</span>
          <span className="cp-metric-lbl">Active Labs</span>
        </Card>
      </div>
    </div>
  );
}
