import React, { useState } from 'react';
import { useCampusPulse } from './hooks/useCampusPulse';
import { PulseOverview } from './components/PulseOverview';
import { PulseChart } from './components/PulseChart';
import { PulseInsights } from './components/PulseInsights';
import { PulseLocations } from './components/PulseLocations';
import { PulseForecast } from './components/PulseForecast';
import { PulseInvestigateModal } from './components/PulseInvestigateModal';
import { CampusDigitalTwin3D } from './components/CampusDigitalTwin3D';
import { Button } from '../../components/ui';
import { RefreshCw, Activity, Box, BarChart3, Radio } from 'lucide-react';
import './styles/campusPulse.css';
import './styles/CampusDigitalTwin3D.css';

export default function CampusPulse() {
  const [viewMode, setViewMode] = useState('3d');
  const [focusedBuildingId, setFocusedBuildingId] = useState(null);

  const {
    pulseData,
    historyData,
    locationData,
    forecastData,
    insightData,
    timeframe,
    setTimeframe,
    loading,
    refreshPulse,
    investigationPayload,
    handleInvestigate,
    closeInvestigate
  } = useCampusPulse();

  const handleFocusBuildingIn3D = (buildingId) => {
    setViewMode('3d');
    setFocusedBuildingId(buildingId);
    // Smooth scroll to top of twin if needed
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className="cp-container">
      {/* Header Banner */}
      <div className="cp-header">
        <div className="cp-header-left">
          <div className="cp-title-row">
            <h1 className="cp-title">Campus Pulse Intelligence</h1>
            <span className="cp-live-badge">
              <span className="cp-live-dot" />
              Operational • Live Sync
            </span>
          </div>
          <p className="cp-subtitle">
            Real-time campus-wide utilization, baseline modeling, and predictive anomaly intelligence.
          </p>
        </div>

        <Button
          variant="secondary"
          className="cp-refresh-btn"
          onClick={refreshPulse}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Pulse
        </Button>
      </div>

      {/* View Mode Switcher: 3D Digital Twin vs 2D Matrix */}
      <div className="cp-mode-switcher-bar">
        <div className="cp-mode-switcher-left">
          <span className="cp-mode-label">
            Visualization Mode:
          </span>
          <div className="cp-segmented-control">
            <button
              onClick={() => setViewMode('3d')}
              className={`cp-seg-btn ${viewMode === '3d' ? 'active' : ''}`}
            >
              <Box size={14} />
              <span>3D Campus Digital Twin</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`cp-seg-btn ${viewMode === '2d' ? 'active' : ''}`}
            >
              <BarChart3 size={14} />
              <span>2D Density Matrix</span>
            </button>
          </div>
        </div>

        <div className="cp-sync-indicator">
          <Radio size={14} style={{ color: '#10b981' }} />
          <span>Sync Frequency: 30s Real-Time</span>
        </div>
      </div>

      {/* 3D Campus Digital Twin Viewport */}
      {viewMode === '3d' && (
        <div style={{ marginBottom: '24px' }}>
          <CampusDigitalTwin3D
            liveData={{ blocks: locationData }}
            forecastData={forecastData?.[0]}
            focusedBuildingId={focusedBuildingId}
            onClearFocus={() => setFocusedBuildingId(null)}
            isLiveConnected={Boolean(pulseData && !loading)}
          />
        </div>
      )}

      {/* 1. Primary Overview Dial & 5 Sub-metrics */}
      <PulseOverview pulseData={pulseData} />

      {/* 2. Activity Trend Chart & AI Insights */}
      <div className="cp-main-grid">
        <PulseChart
          historyData={historyData}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
        />
        <PulseInsights insightData={insightData} />
      </div>

      {/* 3. 1-3 Hour Activity Forecast */}
      <PulseForecast forecastData={forecastData} />

      {/* 4. Block Level Location Intelligence */}
      <PulseLocations
        locationData={locationData}
        onInvestigate={handleInvestigate}
        onFocusBuilding={handleFocusBuildingIn3D}
      />

      {/* 5. Investigation Slide-over Panel */}
      {investigationPayload && (
        <PulseInvestigateModal
          payload={investigationPayload}
          onClose={closeInvestigate}
        />
      )}
    </div>
  );
}
