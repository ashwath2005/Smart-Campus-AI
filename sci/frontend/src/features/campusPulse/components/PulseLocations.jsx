import React from 'react';
import { Card, Button } from '../../../components/ui';
import { Building2, Search, Box } from 'lucide-react';

export function PulseLocations({ locationData = [], onInvestigate, onFocusBuilding }) {
  return (
    <div style={{ marginTop: '24px' }}>
      <h3 className="cp-card-title" style={{ marginBottom: '16px' }}>
        <Building2 size={18} style={{ color: '#ef4444' }} />
        Campus Locations & Block Telemetry
      </h3>

      <div className="cp-locations-grid">
        {locationData.map((loc) => (
          <Card key={loc.id} hoverGlow={false} className="cp-location-card">
            <div>
              <div className="cp-loc-header">
                <h4 className="cp-loc-name">{loc.name}</h4>
                <span className="cp-loc-score">{loc.activityScore}%</span>
              </div>

              <div className="cp-loc-meta-rows">
                <div className="cp-loc-row">
                  <span>Occupied Rooms:</span>
                  <strong>{loc.occupiedRooms} / {loc.totalRooms}</strong>
                </div>
                <div className="cp-loc-row">
                  <span>Active Labs:</span>
                  <strong>{loc.activeLabs} labs</strong>
                </div>
                <div className="cp-loc-row">
                  <span>Current Occupancy:</span>
                  <strong>~{loc.currentOccupancy} / {loc.capacity}</strong>
                </div>
                <div className="cp-loc-row">
                  <span>Vs Expected Norm:</span>
                  <strong style={{ color: loc.difference >= 0 ? "#ef4444" : "#94a3b8" }}>
                    {loc.difference >= 0 ? `+${loc.difference}%` : `${loc.difference}%`}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {onFocusBuilding && (
                <button
                  type="button"
                  onClick={() => onFocusBuilding(loc.id)}
                  style={{
                    flex: 1,
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#38bdf8';
                    e.currentTarget.style.color = '#0b1120';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                    e.currentTarget.style.color = '#38bdf8';
                  }}
                  title="Fly 3D Camera to this block"
                >
                  <Box size={13} />
                  <span>3D Focus</span>
                </button>
              )}

              <button
                type="button"
                className="cp-investigate-btn"
                style={{ flex: 1.2, height: '36px' }}
                onClick={() => onInvestigate(loc.id)}
              >
                <Search size={13} />
                <span>Investigate</span>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
