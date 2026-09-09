import React from 'react';
import { X, Building2, BookOpen, FlaskConical, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui';

export function PulseInvestigateModal({ payload, onClose }) {
  if (!payload) return null;

  const {
    block = {},
    activeClassesList = [],
    activeLabsList = [],
    activeEventsList = [],
    associatedFactors = [],
    recommendedActions = []
  } = payload;

  return (
    <div className="cp-modal-overlay" onClick={onClose}>
      <div className="cp-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cp-modal-header">
          <div>
            <h3 className="cp-modal-title">{block.name || 'Block Investigation'}</h3>
            <span className="text-xs text-muted font-semibold">
              Current Activity Score: {block.activityScore || 94.5}% ({block.status || 'HIGH'})
            </span>
          </div>
          <button className="cp-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Associated Factors */}
        <div>
          <h4 className="cp-section-subtitle">
            <AlertCircle size={14} className="inline mr-1 text-brand-red" />
            Associated Contributing Factors
          </h4>
          <div className="cp-inv-list">
            {associatedFactors.map((fact, idx) => (
              <div key={idx} className="cp-inv-item">
                <div className="cp-inv-item-title">✓ {fact}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Classes */}
        <div>
          <h4 className="cp-section-subtitle">
            <BookOpen size={14} className="inline mr-1 text-brand-red" />
            Active Lecture Sessions ({activeClassesList.length})
          </h4>
          <div className="cp-inv-list">
            {activeClassesList.map((cls, idx) => (
              <div key={idx} className="cp-inv-item">
                <div className="cp-inv-item-title">{cls.code}: {cls.name}</div>
                <div className="cp-inv-item-sub">
                  {cls.room} | {cls.faculty} | {cls.students} students present
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Labs */}
        <div>
          <h4 className="cp-section-subtitle">
            <FlaskConical size={14} className="inline mr-1 text-brand-red" />
            Active Laboratories ({activeLabsList.length})
          </h4>
          <div className="cp-inv-list">
            {activeLabsList.map((lab, idx) => (
              <div key={idx} className="cp-inv-item">
                <div className="cp-inv-item-title">{lab.code}: {lab.name}</div>
                <div className="cp-inv-item-sub">
                  {lab.room} | {lab.students} students | Status: {lab.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Events */}
        {activeEventsList.length > 0 && (
          <div>
            <h4 className="cp-section-subtitle">
              <Calendar size={14} className="inline mr-1 text-brand-red" />
              Active Events ({activeEventsList.length})
            </h4>
            <div className="cp-inv-list">
              {activeEventsList.map((evt, idx) => (
                <div key={idx} className="cp-inv-item">
                  <div className="cp-inv-item-title">{evt.title}</div>
                  <div className="cp-inv-item-sub">
                    Venue: {evt.venue} | Attendees: ~{evt.attendees}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Close Panel
          </Button>
        </div>
      </div>
    </div>
  );
}
