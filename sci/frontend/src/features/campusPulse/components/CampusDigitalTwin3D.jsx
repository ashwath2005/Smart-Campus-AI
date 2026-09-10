import React, { useState, useRef, useEffect, useMemo } from "react";
import { CampusScene } from "./CampusScene";
import { BuildingInfoCard } from "./BuildingInfoCard";
import { TopDownVerificationView } from "./TopDownVerificationView";
import { CAMPUS_BUILDINGS, CAMERA_PRESETS, resolveBuilding } from "../utils/campusCoordinates";
import {
  Box,
  RotateCcw,
  Compass,
  Maximize2,
  Minimize2,
  Video,
  Eye,
  Sun,
  Sunset,
  Moon,
  Layers,
  ShieldCheck,
  AlertCircle,
  Search,
  Navigation
} from "lucide-react";
import "../styles/CampusDigitalTwin3D.css";

export function CampusDigitalTwin3D({
  liveData,
  forecastData,
  focusedBuildingId = null,
  onClearFocus,
  isLiveConnected = false
}) {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [cameraMode, setCameraMode] = useState("overview");
  const [timeOfDay, setTimeOfDay] = useState("day"); // 'day' | 'sunset' | 'night'
  const [isPatrolActive, setIsPatrolActive] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const controlsRef = useRef();

  // Test for WebGL capability
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setWebglSupported(Boolean(gl));
    } catch {
      setWebglSupported(false);
    }
  }, []);

  // Sync external building focus (e.g. from PulseLocations cards)
  useEffect(() => {
    if (focusedBuildingId) {
      const found = resolveBuilding(focusedBuildingId);
      if (found) {
        setSelectedBuilding(found);
        setCameraMode("overview");
        setIsPatrolActive(false);
      }
    }
  }, [focusedBuildingId]);

  // Process liveData into indexed map by building name and code
  const densityMap = useMemo(() => {
    const map = {};
    if (liveData?.blocks && Array.isArray(liveData.blocks)) {
      liveData.blocks.forEach((blk) => {
        map[blk.name] = blk;
        const matched = resolveBuilding(blk.name);
        if (matched) {
          map[matched.name] = blk;
          map[matched.id] = blk;
          map[matched.code] = blk;
        }
      });
    } else if (liveData?.locations && Array.isArray(liveData.locations)) {
      liveData.locations.forEach((loc) => {
        map[loc.name] = loc;
        const matched = resolveBuilding(loc.name);
        if (matched) {
          map[matched.name] = loc;
          map[matched.id] = loc;
          map[matched.code] = loc;
        }
      });
    }
    return map;
  }, [liveData]);

  const handleSelectPreset = (presetId) => {
    setSelectedBuilding(null);
    setCameraMode(presetId);
    setIsPatrolActive(false);
    if (onClearFocus) onClearFocus();
  };

  const handleTopDownView = () => {
    setSelectedBuilding(null);
    setCameraMode("topdown");
    setIsPatrolActive(false);
  };

  const handleTogglePatrol = () => {
    setSelectedBuilding(null);
    setCameraMode("overview");
    setIsPatrolActive((prev) => !prev);
  };

  const activeBuilding = selectedBuilding || hoveredBuilding;

  if (!webglSupported) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-black p-6 text-center text-amber-200">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          <AlertCircle size={24} />
        </div>
        <h4 className="text-base font-semibold">3D Hardware Acceleration Unavailable</h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
          WebGL hardware acceleration is inactive in this session. The 2D Campus Density overview is active below.
        </p>
      </div>
    );
  }

  return (
    <div className={`dt-viewport-container ${isExpanded ? "dt-expanded" : ""}`}>
      {/* 3D Canvas Scene */}
      <CampusScene
        densityMap={densityMap}
        selectedBuilding={selectedBuilding}
        hoveredBuilding={hoveredBuilding}
        onSelectBuilding={(bldg) => {
          setSelectedBuilding(bldg);
          if (bldg) setIsPatrolActive(false);
          if (!bldg && onClearFocus) onClearFocus();
        }}
        onHoverBuilding={setHoveredBuilding}
        onUnhoverBuilding={() => setHoveredBuilding(null)}
        cameraMode={cameraMode}
        timeOfDay={timeOfDay}
        isPatrolActive={isPatrolActive}
        debugMode={debugMode}
        onSnapTopDownNorth={handleTopDownView}
        controlsRef={controlsRef}
      />

      {/* Top HUD Controls Bar */}
      <div className="dt-top-hud">
        <div className="dt-top-hud-left">
          <div className="dt-title-badge">
            <Box size={14} style={{ color: "var(--brand, #F21722)" }} />
            <span>Campus Digital Twin 3D</span>
            <span className={`dt-live-pill ${isLiveConnected ? "live" : "simulation"}`}>
              <span className={`dt-live-dot ${isLiveConnected ? "live" : "simulation"}`} />
              {isLiveConnected ? "LIVE TELEMETRY" : "SIMULATION MODE"}
            </span>
          </div>

          {/* Camera Preset Toolbar */}
          <div className="dt-btn-group">
            <button
              onClick={() => handleSelectPreset("overview")}
              className={`dt-btn ${cameraMode === "overview" && !isPatrolActive && !selectedBuilding ? "active" : ""}`}
              title="Overview of Campus"
            >
              <RotateCcw size={11} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => handleSelectPreset("library-admin")}
              className={`dt-btn ${cameraMode === "library-admin" ? "active" : ""}`}
              title="Focus Vankatram Library and Admin Block"
            >
              <span>Library & Admin</span>
            </button>
            <button
              onClick={() => handleSelectPreset("academic-quad")}
              className={`dt-btn ${cameraMode === "academic-quad" ? "active" : ""}`}
              title="Focus C1-C2 Academic Quadrangle"
            >
              <span>Academic Quad</span>
            </button>
            <button
              onClick={() => handleSelectPreset("stadium")}
              className={`dt-btn ${cameraMode === "stadium" ? "active" : ""}`}
              title="Focus Sri Krishna Stadium & 400m Track"
            >
              <span>Stadium</span>
            </button>
            <button
              onClick={() => handleSelectPreset("krishna-square")}
              className={`dt-btn ${cameraMode === "krishna-square" ? "active" : ""}`}
              title="Focus Krishna Square Forum"
            >
              <span>Krishna Sq.</span>
            </button>
            <button
              onClick={handleTopDownView}
              className={`dt-btn ${cameraMode === "topdown" ? "active" : ""}`}
              title="Perpendicular Top-Down Overhead View (True North Up)"
            >
              <Compass size={11} />
              <span>Overhead</span>
            </button>
            <button
              onClick={handleTogglePatrol}
              className={`dt-btn ${isPatrolActive ? "active" : ""}`}
              title="Continuous Drone Patrol Orbit"
            >
              <Video size={11} />
              <span>Orbit</span>
            </button>
          </div>
        </div>

        <div className="dt-top-hud-right">
          {/* Quick Search Campus Trigger */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`dt-btn ${isSearchOpen ? "active" : ""}`}
              title="Search Campus Buildings, Labs, Sports & Facilities"
              style={{ gap: "6px" }}
            >
              <Search size={12} />
              <span>SEARCH</span>
            </button>

            {isSearchOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "115%",
                  right: 0,
                  width: "280px",
                  background: "#0A0A0C",
                  border: "1px solid #27272A",
                  borderRadius: "8px",
                  padding: "8px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                  zIndex: 200
                }}
              >
                <input
                  type="text"
                  placeholder="Search 28 buildings, stadium, labs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    background: "#18181B",
                    border: "1px solid #3F3F46",
                    borderRadius: "4px",
                    padding: "6px 10px",
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                    outline: "none"
                  }}
                />
                <div style={{ maxHeight: "200px", overflowY: "auto", marginTop: "6px" }}>
                  {CAMPUS_BUILDINGS.filter(b => 
                    !searchQuery || 
                    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    b.department.toLowerCase().includes(searchQuery.toLowerCase())
                  ).slice(0, 8).map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBuilding(b);
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                      style={{
                        padding: "6px 8px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        color: "#E4E4E7",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#27272A"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span>{b.name}</span>
                      <span style={{ fontSize: "0.6rem", color: "#F21722", fontWeight: 700 }}>{b.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* VERIFY MAP Button (Mandatory Ground Truth Mode) */}
          <button
            onClick={() => setIsVerifyModalOpen(true)}
            className="dt-btn dt-verify-btn"
            title="Open Google Maps & Georeferenced Accuracy Verification Panel"
            style={{
              background: "#101010",
              border: "1px solid #F21722",
              color: "#F21722",
              fontWeight: "600",
              gap: "6px"
            }}
          >
            <ShieldCheck size={13} />
            <span>VERIFY MAP</span>
          </button>

          {/* DEBUG GEO MODE Toggle */}
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`dt-btn ${debugMode ? "active" : ""}`}
            title="Toggle Debug Geographic Footprints & Centerlines"
            style={{
              background: debugMode ? "#F21722" : "transparent",
              color: debugMode ? "#FFFFFF" : "#A1A1AA"
            }}
          >
            <Layers size={12} />
            <span>GEO DEBUG</span>
          </button>

          {/* Time of Day Lighting Toggle */}
          <div className="dt-btn-group">
            <button
              onClick={() => setTimeOfDay("day")}
              className={`dt-btn ${timeOfDay === "day" ? "active" : ""}`}
              title="Day Solar Lighting"
              aria-label="Day Solar Lighting"
            >
              <Sun size={12} />
            </button>
            <button
              onClick={() => setTimeOfDay("sunset")}
              className={`dt-btn ${timeOfDay === "sunset" ? "active" : ""}`}
              title="Golden Hour Lighting"
              aria-label="Golden Hour Lighting"
            >
              <Sunset size={12} />
            </button>
            <button
              onClick={() => setTimeOfDay("night")}
              className={`dt-btn ${timeOfDay === "night" ? "active" : ""}`}
              title="Night Illumination"
              aria-label="Night Illumination"
            >
              <Moon size={12} />
            </button>
          </div>

          {/* Fullscreen Expand / Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="dt-icon-btn"
            title={isExpanded ? "Exit Fullscreen" : "Fullscreen 3D Twin"}
            aria-label={isExpanded ? "Exit Fullscreen" : "Fullscreen 3D Twin"}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Floating Info HUD Card */}
      {activeBuilding && (
        <BuildingInfoCard
          building={activeBuilding}
          densityData={
            densityMap[activeBuilding.name] ||
            densityMap[activeBuilding.code] ||
            densityMap[activeBuilding.id]
          }
          forecastData={forecastData}
          isSelected={Boolean(selectedBuilding)}
          onClose={() => {
            setSelectedBuilding(null);
            setHoveredBuilding(null);
            if (onClearFocus) onClearFocus();
          }}
          onFocusBuilding={(bldg) => {
            setSelectedBuilding(bldg);
            setIsPatrolActive(false);
          }}
        />
      )}

      {/* Dedicated Top-Down Verification View Modal */}
      <TopDownVerificationView
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        debugMode={debugMode}
        onToggleDebugMode={() => setDebugMode(!debugMode)}
        onSnapTopDownNorth={handleTopDownView}
      />

      {/* Bottom HUD Legend Bar */}
      <div className="dt-bottom-hud">
        <span className="dt-legend-title">Density Index:</span>
        <div className="dt-legend-item">
          <span className="dt-legend-dot green" />
          <span>&lt;45% Normal</span>
        </div>
        <div className="dt-legend-item">
          <span className="dt-legend-dot amber" />
          <span>45-75% Moderate</span>
        </div>
        <div className="dt-legend-item">
          <span className="dt-legend-dot red" />
          <span>&gt;75% Peak Density</span>
        </div>
      </div>

      {/* Quick Navigation Hint */}
      <div className="dt-nav-hint">
        <Eye size={11} />
        <span>Click building to inspect • Left drag orbit • Right drag pan • Scroll zoom</span>
      </div>

      {/* Accessibility Table for Screen Readers */}
      <table className="sr-only">
        <caption>Campus Real-time Density Statistics</caption>
        <thead>
          <tr>
            <th scope="col">Building</th>
            <th scope="col">Code</th>
            <th scope="col">Department</th>
            <th scope="col">Floors</th>
            <th scope="col">Density</th>
          </tr>
        </thead>
        <tbody>
          {CAMPUS_BUILDINGS.map((bldg) => (
            <tr key={bldg.id}>
              <td>{bldg.name}</td>
              <td>{bldg.code}</td>
              <td>{bldg.department}</td>
              <td>{bldg.floors}</td>
              <td>
                {densityMap[bldg.name]?.occupancyRate ??
                  densityMap[bldg.name]?.score ??
                  "55%"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
