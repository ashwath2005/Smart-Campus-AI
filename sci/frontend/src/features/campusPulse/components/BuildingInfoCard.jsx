import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  Layers,
  X,
  Compass,
  Info
} from "lucide-react";
import { getDensityColor } from "../utils/campusCoordinates";

export function BuildingInfoCard({
  building,
  densityData,
  forecastData,
  onClose,
  isSelected,
  onFocusBuilding
}) {
  if (!building) return null;

  const density = densityData?.occupancyRate ?? densityData?.score ?? 65;
  const activeCount = densityData?.activeCount ?? Math.round((density / 100) * (building.floors * 120));
  const colorMeta = getDensityColor(density);
  const forecast1h = forecastData?.forecast_1h ?? Math.min(100, density + 3);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="dt-inspector-card"
        role="dialog"
        aria-label={`${building.name} facility details`}
      >
        {/* Header */}
        <div className="dt-card-header">
          <div className="dt-card-header-left">
            <div
              className="dt-card-icon-wrap"
              style={{
                backgroundColor: "rgba(242, 23, 34, 0.12)",
                color: "#F21722",
                border: "1px solid rgba(242, 23, 34, 0.3)"
              }}
            >
              <Building2 size={16} />
            </div>
            <div>
              <h4 className="dt-card-title">
                {building.name}
                <span className="dt-badge-code">
                  {building.code}
                </span>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "4px",
                    marginLeft: "6px",
                    backgroundColor: building.confidence === "high" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: building.confidence === "high" ? "#10B981" : "#F59E0B",
                    border: `1px solid ${building.confidence === "high" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                  }}
                >
                  {building.confidence === "high" ? "VERIFIED" : "INFERRED"}
                </span>
              </h4>
              <p className="dt-card-dept">{building.department}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="dt-card-close"
              aria-label="Close building details"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Real-time Occupancy Metric */}
        <div className="dt-density-box">
          <div className="dt-density-header">
            <span className="dt-density-lbl">
              <Activity size={13} style={{ color: colorMeta.hex }} />
              Occupancy Utilization
            </span>
            <span
              className="dt-density-badge"
              style={{
                backgroundColor: `${colorMeta.hex}18`,
                color: colorMeta.hex,
                border: `1px solid ${colorMeta.hex}35`
              }}
            >
              {colorMeta.badge}
            </span>
          </div>

          <div className="dt-density-val-row">
            <span className="dt-density-number">
              {density}%
            </span>
            <span className="dt-density-occupants">
              <Users size={12} /> ~{activeCount} occupants
            </span>
          </div>

          <div className="dt-progress-track">
            <div
              className="dt-progress-fill"
              style={{
                width: `${Math.min(100, Math.max(8, density))}%`,
                backgroundColor: colorMeta.hex
              }}
            />
          </div>
        </div>

        {/* Facility Attributes Grid */}
        <div className="dt-attr-grid">
          <div className="dt-attr-item">
            <div className="dt-attr-label">
              <Layers size={11} /> Architectural Levels
            </div>
            <div className="dt-attr-val">{building.floors} Floors</div>
          </div>
          <div className="dt-attr-item">
            <div className="dt-attr-label">
              <TrendingUp size={11} /> +1h Projection
            </div>
            <div className="dt-attr-val">{forecast1h}% Expected</div>
          </div>
        </div>

        {/* Verified Facility Description */}
        <div className="dt-desc-wrap">
          <div className="dt-desc-title">
            <Info size={11} /> Verified Landmark Specification
          </div>
          <p className="dt-desc-text">
            {building.description}
          </p>
          {building.source && (
            <div style={{ marginTop: "8px", fontSize: "0.66rem", color: "#71717A" }}>
              <span style={{ color: "#A1A1AA", fontWeight: 600 }}>Source: </span>
              {building.source}
            </div>
          )}
        </div>

        {/* Action Button */}
        {onFocusBuilding && (
          <button
            onClick={() => onFocusBuilding(building)}
            className="dt-action-btn"
          >
            <Compass size={13} />
            <span>Focus 3D Camera</span>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
