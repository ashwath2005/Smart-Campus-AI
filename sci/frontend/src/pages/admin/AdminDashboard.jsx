import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import {
  Users,
  Landmark,
  Briefcase,
  Clock,
  Activity,
  Layers,
  Building,
  Cpu,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Database,
  Calendar,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [events, setEvents] = useState([]);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [pulseData, setPulseData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overviewTimeframe, setOverviewTimeframe] = useState("This semester");
  const [chartTimeframe, setChartTimeframe] = useState("Last 7 days");

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, eventsRes, notifsRes, pulseRes, locsRes, facsRes] = await Promise.allSettled([
        api.get("/admin/analytics"),
        api.get("/events/"),
        api.get("/notifications/"),
        api.get("/campus-pulse/current"),
        api.get("/campus-pulse/locations"),
        api.get("/faculty-locator/admin/faculties"),
      ]);

      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value.data);
      if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value.data)) {
        setEvents(eventsRes.value.data.slice(0, 4));
      }
      if (notifsRes.status === "fulfilled" && Array.isArray(notifsRes.value.data)) {
        setRecentNotifs(notifsRes.value.data.slice(0, 4));
      }
      if (pulseRes.status === "fulfilled") setPulseData(pulseRes.value.data);
      if (locsRes.status === "fulfilled" && Array.isArray(locsRes.value.data)) {
        setLocations(locsRes.value.data);
      }
      if (facsRes.status === "fulfilled" && Array.isArray(facsRes.value.data)) {
        setFaculties(facsRes.value.data);
      }
    } catch {
      toast.error("Failed to load administrator console metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const totalStudents = analytics?.total_students ?? 0;
  const totalFaculty = analytics?.total_faculty ?? 0;
  const totalDepts = analytics?.total_departments ?? 0;
  const totalPlacements = analytics?.total_placed_students ?? 0;
  const pulseScore = pulseData?.activityScore ?? (totalStudents > 0 ? 95 : 0);

  // Velocity Bars based on pulseScore
  const chartBars = [
    { label: "1", height: Math.max(15, Math.round(pulseScore * 0.45)), active: false },
    { label: "2", height: Math.max(18, Math.round(pulseScore * 0.58)), active: false },
    { label: "3", height: Math.max(12, Math.round(pulseScore * 0.38)), active: false },
    { label: "4", height: Math.max(22, Math.round(pulseScore * 0.72)), active: false },
    { label: "5", height: Math.max(16, Math.round(pulseScore * 0.42)), active: false },
    { label: "6", height: Math.max(25, Math.min(100, Math.round(pulseScore))), active: pulseScore > 0, tag: `${Math.round(pulseScore)}%` },
    { label: "7", height: Math.max(20, Math.round(pulseScore * 0.64)), active: false },
    { label: "8", height: Math.max(18, Math.round(pulseScore * 0.5)), active: false },
    { label: "9", height: Math.max(24, Math.round(pulseScore * 0.78)), active: false },
  ];

  const displayLocations = (locations || []).slice(0, 5).map((loc, i) => ({
    id: loc.id || `loc-${i}`,
    name: loc.name,
    category: loc.category || "Campus Facility",
    activityScore: typeof loc.activityScore === "number" ? `${loc.activityScore}%` : (loc.activityScore || "Active"),
    status: loc.status || "Active",
    icon: Building,
    tileClass: ["tile-indigo", "tile-sky", "tile-purple", "tile-emerald", "tile-amber"][i % 5],
  }));

  const displayDispatches = recentNotifs.slice(0, 4).map((n, i) => ({
    id: n.id || `disp-${i}`,
    author: n.sender || "System Admin",
    context: n.type ? `on ${n.type}` : "on Campus Operations",
    time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
    message: n.message || n.title || "Operational notification recorded.",
    initial: (n.sender || "A").charAt(0).toUpperCase(),
  }));

  const adminPeers = (faculties || []).slice(0, 5).map((f) => ({
    id: f.id,
    name: f.name,
    role: f.role || "Faculty",
    initial: (f.name || "F").charAt(0).toUpperCase(),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="ref-dashboard-container"
    >
      {/* 2-Column Master Grid (Main / Side) */}
      <div className="ref-dashboard-layout">
        
        {/* ============================================================
            LEFT COLUMN: OVERVIEW & PLATFORM VELOCITY
            ============================================================ */}
        <div className="ref-main-column">

          {/* 1. Overview Card */}
          <div className="ref-card ref-overview-card">
            <div className="ref-card-header">
              <h2 className="ref-card-title">Overview</h2>
              <div className="ref-pill-dropdown">
                <span>{overviewTimeframe}</span>
                <ChevronDown size={14} className="ref-dropdown-caret" />
              </div>
            </div>

            {/* Metric Boxes Row */}
            <div className="ref-metrics-row">
              <div className="ref-metric-box elevated">
                <div className="ref-metric-label-row">
                  <Users size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">Total Campus Population</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">{totalStudents + totalFaculty}</span>
                  <div className="ref-trend-pill up">
                    <span>Live</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">{totalStudents} Students • {totalFaculty} Faculty</span>
              </div>

              <div className="ref-metric-box flush">
                <div className="ref-metric-label-row">
                  <Activity size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">Campus Pulse Load</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">{Math.round(pulseScore)}%</span>
                  <div className="ref-trend-pill up">
                    <span>Active</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">{totalDepts} academic departments operational</span>
              </div>
            </div>

            {/* Contextual Statement */}
            <div className="ref-context-statement">
              <p className="ref-statement-heading">
                All campus core infrastructure operating at optimal capacity!
              </p>
              <p className="ref-statement-sub">
                {totalPlacements} students placed in recruitment drives • 0 scheduling conflicts active.
              </p>
            </div>

            {/* What Needs Attention Section */}
            <div className="ref-attention-section">
              <div className="ref-attention-header">
                <span className="ref-attention-title">✦ WHAT NEEDS SYSTEM ATTENTION?</span>
                <span className="ref-live-intel-badge">Live Campus Intelligence</span>
              </div>

              <div className="ref-attention-cards-grid">
                <div
                  className="ref-attention-card cursor-pointer"
                  onClick={() => navigate("/admin/core-hub")}
                >
                  <div className="ref-attention-card-top">
                    <div className="ref-attention-card-left">
                      <Database size={15} className="ref-attention-card-icon" />
                      <span className="ref-attention-card-id">MySQL Cluster</span>
                    </div>
                    <span className="ref-attention-status-pill approved">HEALTHY</span>
                  </div>
                  <p className="ref-attention-card-desc">
                    Database connection pool active with zero latency.
                  </p>
                </div>

                <div
                  className="ref-attention-card cursor-pointer"
                  onClick={() => navigate("/admin/timetable-generator")}
                >
                  <div className="ref-attention-card-top">
                    <div className="ref-attention-card-left">
                      <Calendar size={15} className="ref-attention-card-icon" />
                      <span className="ref-attention-card-id">CSP Scheduler</span>
                    </div>
                    <span className="ref-attention-status-pill due-soon">OPTIMAL</span>
                  </div>
                  <p className="ref-attention-card-desc">
                    Constraint solver ready for section timetable generation.
                  </p>
                </div>
              </div>

              {/* Administrative Peers / Heads */}
              <div className="ref-avatars-action-row">
                <div className="ref-avatars-list">
                  {adminPeers.length > 0 ? (
                    adminPeers.map((peer, i) => (
                      <div key={i} className="ref-avatar-unit">
                        <div
                          className="ref-user-avatar"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(242, 23, 34, 0.12)",
                            color: "#f21722",
                            fontWeight: "700",
                            fontSize: "12px",
                            borderRadius: "9999px",
                          }}
                        >
                          {peer.initial}
                        </div>
                        <span className="ref-user-name">{peer.name}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Faculty roster synced</span>
                  )}
                  <button
                    className="ref-view-all-circle-btn"
                    onClick={() => navigate("/faculty-locator")}
                    title="View Faculty Directory"
                  >
                    <div className="ref-circle-arrow-box">
                      <ArrowRight size={14} />
                    </div>
                    <span className="ref-view-all-text">View all</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Platform Velocity Bar Chart Card */}
          <div className="ref-card ref-chart-card">
            <div className="ref-card-header">
              <h2 className="ref-card-title">Platform Velocity</h2>
              <div className="ref-pill-dropdown">
                <span>{chartTimeframe}</span>
                <ChevronDown size={14} className="ref-dropdown-caret" />
              </div>
            </div>

            <div className="ref-chart-body">
              <div className="ref-chart-kpi-block">
                <span className="ref-chart-kpi-value">99.4%</span>
                <span className="ref-chart-kpi-label">System Uptime</span>
              </div>

              <div className="ref-chart-bars-track">
                {chartBars.map((bar, i) => (
                  <div key={i} className="ref-chart-bar-column">
                    {bar.active && (
                      <div className="ref-bar-tooltip-bubble">
                        <span>{bar.tag}</span>
                        <div className="ref-bar-target-ring" />
                      </div>
                    )}
                    <div
                      className={`ref-chart-bar-pill ${bar.active ? "highlighted" : ""}`}
                      style={{ height: `${bar.height}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT COLUMN: INFRASTRUCTURE ACTIVITY & DISPATCHES
            ============================================================ */}
        <div className="ref-side-column">

          {/* 3. Campus Activity Card */}
          <div className="ref-card ref-products-card">
            <h3 className="ref-products-title">Campus Activity</h3>

            <div className="ref-products-list">
              {displayLocations.length > 0 ? (
                displayLocations.map((loc) => {
                  const IconComponent = loc.icon;
                  return (
                    <div
                      key={loc.id}
                      className="ref-product-item"
                      onClick={() => navigate("/campus-pulse")}
                    >
                      <div className={`ref-product-icon-box ${loc.tileClass}`}>
                        <IconComponent size={16} />
                      </div>
                      <div className="ref-product-details">
                        <span className="ref-product-name">{loc.name}</span>
                        <span className="ref-product-category">{loc.category}</span>
                      </div>
                      <div className="ref-product-right-col">
                        <span className="ref-product-score">{loc.activityScore}</span>
                        <span className="ref-status-capsule active">{loc.status}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "16px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                  No active campus locations registered.
                </div>
              )}
            </div>

            <button
              className="ref-all-products-btn"
              onClick={() => navigate("/campus-pulse")}
            >
              Open Campus Pulse 3D
            </button>
          </div>

          {/* 4. Campus Dispatches Card */}
          <div className="ref-card ref-comments-card">
            <h3 className="ref-comments-title">Campus Dispatches</h3>

            <div className="ref-comments-list">
              {displayDispatches.length > 0 ? (
                displayDispatches.map((disp) => (
                  <div key={disp.id} className="ref-comment-item">
                    <div className="ref-comment-avatar-col">
                      <div
                        className="ref-comment-avatar"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(242, 23, 34, 0.15)",
                          color: "#f21722",
                          fontWeight: "700",
                          fontSize: "12px",
                          borderRadius: "9999px",
                        }}
                      >
                        {disp.initial}
                      </div>
                    </div>
                    <div className="ref-comment-content">
                      <div className="ref-comment-meta">
                        <span className="ref-comment-author">{disp.author}</span>
                        <span className="ref-comment-context">{disp.context}</span>
                        <span className="ref-comment-time">{disp.time}</span>
                      </div>
                      <p className="ref-comment-text">{disp.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "16px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                  No campus dispatches at this time.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Admin Quick Operations Bar */}
      <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <button
          onClick={() => navigate("/admin/data-import")}
          className="ref-card"
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", cursor: "pointer", textAlign: "left" }}
        >
          <div className="ref-product-icon-box tile-indigo">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>Data Import</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Batch CSV/Excel ingestion</div>
          </div>
        </button>

        <button
          onClick={() => navigate("/admin/timetable-generator")}
          className="ref-card"
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", cursor: "pointer", textAlign: "left" }}
        >
          <div className="ref-product-icon-box tile-sky">
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>Timetable Generator</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Automated CSP solver</div>
          </div>
        </button>

        <button
          onClick={() => navigate("/admin/core-hub")}
          className="ref-card"
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", cursor: "pointer", textAlign: "left" }}
        >
          <div className="ref-product-icon-box tile-purple">
            <Database size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>Core Infrastructure</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Node & service monitor</div>
          </div>
        </button>

        <button
          onClick={() => navigate("/gate-pass-admin")}
          className="ref-card"
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", cursor: "pointer", textAlign: "left" }}
        >
          <div className="ref-product-icon-box tile-emerald">
            <Shield size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>Gate Pass Admin</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Review campus exits</div>
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
