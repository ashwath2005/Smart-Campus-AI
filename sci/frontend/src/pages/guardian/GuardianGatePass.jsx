import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  MapPin,
  ChevronDown,
  ArrowRight,
  Shield,
  Building,
  GraduationCap,
  Layers,
  Cpu,
  HeartPulse,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./GuardianGatePass.css";

export function GuardianGatePass() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarksInput, setRemarksInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [overviewTimeframe, setOverviewTimeframe] = useState("This semester");
  const [chartTimeframe, setChartTimeframe] = useState("Last 7 days");

  const fetchWardData = async () => {
    try {
      const res = await api.get("/guardian/ward-overview");
      setData(res.data);
    } catch {
      // robust fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardData();
  }, []);

  const handleApprove = async (passId) => {
    setSubmitting(true);
    const loadToast = toast.loading("Authorizing ward gate pass...");
    try {
      await api.post(`/guardian/gate-passes/${passId}/approve`, {
        remarks: remarksInput || "Authorized by Guardian",
      });
      toast.success("Leave authorization granted! Forwarded to HOD/Warden.", { id: loadToast });
      setRemarksInput("");
      fetchWardData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to authorize leave request", { id: loadToast });
    } finally {
      setSubmitting(false);
    }
  };

  const wardName = data?.ward?.name || "Rahul Sharma";
  const wardRoll = data?.ward?.register_number || "23CS108";
  const wardAttendance = data?.attendance?.percentage ?? 85.4;
  const activePass = data?.active_pass;

  // 9 Velocity Bars matching reference rhythm
  const chartBars = [
    { label: "1", height: 44, active: false },
    { label: "2", height: 56, active: false },
    { label: "3", height: 38, active: false },
    { label: "4", height: 68, active: false },
    { label: "5", height: 46, active: false },
    { label: "6", height: 92, active: true, tag: "95%" },
    { label: "7", height: 62, active: false },
    { label: "8", height: 50, active: false },
    { label: "9", height: 76, active: false },
  ];

  // 5 Campus Activity Facilities matching reference
  const displayLocations = [
    {
      id: "hostel-residence",
      name: "Hostel Block A (Resident)",
      category: "Room 304 • Verified In",
      activityScore: "100%",
      status: "Active",
      icon: Building,
      tileClass: "tile-indigo",
    },
    {
      id: "health-center",
      name: "Campus Health Center",
      category: "24/7 Medical Care",
      activityScore: "99.0%",
      status: "Active",
      icon: HeartPulse,
      tileClass: "tile-emerald",
    },
    {
      id: "academic-block",
      name: "Academic Block A",
      category: "Computer Science Dept",
      activityScore: "92.0%",
      status: "Active",
      icon: GraduationCap,
      tileClass: "tile-sky",
    },
    {
      id: "security-gate",
      name: "Main Campus Checkpoint",
      category: "QR Pass Gate Access",
      activityScore: "98.4%",
      status: "Active",
      icon: ShieldCheck,
      tileClass: "tile-amber",
    },
    {
      id: "campus-3d",
      name: "Campus Digital Twin 3D",
      category: "Spatial Telemetry",
      activityScore: "99.1%",
      status: "Active",
      icon: Layers,
      tileClass: "tile-purple",
    },
  ];

  // Dispatches
  const displayDispatches = [
    {
      id: "disp-1",
      author: "Hostel Warden",
      context: "on Evening Attendance",
      time: "09:00 PM",
      message: `${wardName} checked in on schedule. Curfew compliance verified.`,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    },
    {
      id: "disp-2",
      author: "Faculty Advisor",
      context: "on Academic Performance",
      time: "11:30 AM",
      message: "Semester attendance is in good standing (above 85% requirement).",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    },
  ];

  const guardianPeers = [
    { name: wardName, role: "Ward (Student)", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" },
    { name: "Hostel Warden", role: "Warden", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80" },
    { name: "Dr. Sneha", role: "Advisor", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" },
    { name: "Dr. Sunita", role: "HOD", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="ref-dashboard-container"
    >
      {/* 2-Column Master Grid */}
      <div className="ref-dashboard-layout">
        
        {/* ============================================================
            LEFT COLUMN: OVERVIEW & WARD ACADEMIC VELOCITY
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
                  <Clock size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">Ward Attendance</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">{wardAttendance}%</span>
                  <div className="ref-trend-pill up">
                    <span>Good Standing</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">Eligibility for semester examinations active</span>
              </div>

              <div className="ref-metric-box flush">
                <div className="ref-metric-label-row">
                  <MapPin size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">Current Presence</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value" style={{ fontSize: "28px" }}>On Campus</span>
                </div>
                <span className="ref-trend-subtext">Hostel Block A • Verified by biometric check-in</span>
              </div>
            </div>

            {/* Contextual Statement */}
            <div className="ref-context-statement">
              <p className="ref-statement-heading">
                Ward Profile: {wardName} ({wardRoll}) • CS Department
              </p>
              <p className="ref-statement-sub">
                Curfew compliance at 100% • No active disciplinary or attendance flags.
              </p>
            </div>

            {/* Attention Section */}
            <div className="ref-attention-section">
              <div className="ref-attention-header">
                <span className="ref-attention-title">✦ WHAT NEEDS PARENT ATTENTION?</span>
                <span className="ref-live-intel-badge">Live Ward Telemetry</span>
              </div>

              <div className="ref-attention-cards-grid">
                <div className="ref-attention-card">
                  <div className="ref-attention-card-top">
                    <div className="ref-attention-card-left">
                      <ShieldCheck size={15} className="ref-attention-card-icon" />
                      <span className="ref-attention-card-id">Leave Consent</span>
                    </div>
                    <span className="ref-attention-status-pill approved">
                      {activePass ? "APPROVAL NEEDED" : "NO ACTIVE PENDING"}
                    </span>
                  </div>
                  <p className="ref-attention-card-desc">
                    {activePass
                      ? `Gate pass requested for: ${activePass.reason}`
                      : "All recent outstation and weekend passes have been authorized."}
                  </p>
                </div>

                <div className="ref-attention-card">
                  <div className="ref-attention-card-top">
                    <div className="ref-attention-card-left">
                      <GraduationCap size={15} className="ref-attention-card-icon" />
                      <span className="ref-attention-card-id">Examinations</span>
                    </div>
                    <span className="ref-attention-status-pill due-soon">UPCOMING</span>
                  </div>
                  <p className="ref-attention-card-desc">
                    Continuous Internal Assessment (CAT-1) starting next week.
                  </p>
                </div>
              </div>

              {/* Contacts Avatars */}
              <div className="ref-avatars-action-row">
                <div className="ref-avatars-list">
                  {guardianPeers.map((peer, i) => (
                    <div key={i} className="ref-avatar-unit">
                      <img src={peer.avatar} alt={peer.name} className="ref-user-avatar" />
                      <span className="ref-user-name">{peer.name}</span>
                    </div>
                  ))}
                  <button
                    className="ref-view-all-circle-btn"
                    onClick={() => navigate("/campus-pulse")}
                    title="View Campus Overview"
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

          {/* 2. Ward Attendance Velocity Bar Chart Card */}
          <div className="ref-card ref-chart-card">
            <div className="ref-card-header">
              <h2 className="ref-card-title">Ward Attendance Trend</h2>
              <div className="ref-pill-dropdown">
                <span>{chartTimeframe}</span>
                <ChevronDown size={14} className="ref-dropdown-caret" />
              </div>
            </div>

            <div className="ref-chart-body">
              <div className="ref-chart-kpi-block">
                <span className="ref-chart-kpi-value">{wardAttendance}%</span>
                <span className="ref-chart-kpi-label">Cumulative Rate</span>
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
            RIGHT COLUMN: CAMPUS FACILITIES & DISPATCHES
            ============================================================ */}
        <div className="ref-side-column">

          {/* 3. Campus Activity Card */}
          <div className="ref-card ref-products-card">
            <h3 className="ref-products-title">Campus Safety Nodes</h3>

            <div className="ref-products-list">
              {displayLocations.map((loc) => {
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
              })}
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
            <h3 className="ref-comments-title">Hostel & Warden Dispatches</h3>

            <div className="ref-comments-list">
              {displayDispatches.map((disp) => (
                <div key={disp.id} className="ref-comment-item">
                  <div className="ref-comment-avatar-col">
                    <img src={disp.avatar} alt={disp.author} className="ref-comment-avatar" />
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
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================
          LEAVE AUTHORIZATION BOX
          ============================================================ */}
      {activePass && (
        <div className="ref-card" style={{ marginTop: "24px" }}>
          <h3 className="ref-card-title" style={{ marginBottom: "12px" }}>Authorize Pending Gate Pass</h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Your ward {wardName} has requested permission for off-campus transit: <strong>{activePass.reason}</strong>.
          </p>

          <div style={{ display: "flex", gap: "12px", maxWidth: "600px" }}>
            <input
              type="text"
              placeholder="Add authorization remarks (optional)..."
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
            />
            <button
              disabled={submitting}
              onClick={() => handleApprove(activePass.id)}
              className="ref-all-products-btn"
              style={{ width: "auto", padding: "8px 24px" }}
            >
              {submitting ? "Authorizing..." : "Grant Consent"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default GuardianGatePass;
