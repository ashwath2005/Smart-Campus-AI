import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  Clock,
  Activity,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building,
  GraduationCap,
  Layers,
  Cpu,
  FileText,
  Check,
  X,
  User,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./HodDashboard.css";

export const HodDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [ods, setOds] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const isWarden = user?.role === "warden";
  const [activeTab, setActiveTab] = useState(isWarden ? "gate_passes" : "leaves");
  const [overviewTimeframe, setOverviewTimeframe] = useState("This semester");
  const [chartTimeframe, setChartTimeframe] = useState("Last 7 days");

  const [decisionComments, setDecisionComments] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const isWardenUser = user?.role === "warden";
      const requests = [
        api.get("/gate-pass/all-passes"),
        api.get("/workflows/leaves"),
        api.get("/workflows/ods"),
      ];
      if (!isWardenUser) {
        requests.push(api.get(`/faculty-locator/search${user?.department ? `?department=${encodeURIComponent(user.department)}` : ""}`));
      }
      const results = await Promise.allSettled(requests);
      const [passesRes, leavesRes, odsRes, facRes] = results;

      if (passesRes && passesRes.status === "fulfilled") setGatePasses(passesRes.value.data || []);
      if (leavesRes && leavesRes.status === "fulfilled") setLeaves(leavesRes.value.data || []);
      if (odsRes && odsRes.status === "fulfilled") setOds(odsRes.value.data || []);
      if (facRes && facRes.status === "fulfilled") setFaculties(facRes.value.data || []);
    } catch {
      toast.error("Failed to load department requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "warden") {
      setActiveTab("gate_passes");
    }
    fetchData();
  }, [user]);

  const handleDecision = async (id, type, status) => {
    const comment = decisionComments[id] || "";
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    const loadId = toast.loading(`Submitting review decision...`);
    try {
      if (type === "gate_pass") {
        await api.post(`/gate-pass/${id}/approve`, {
          status: status === "approved" ? "APPROVED" : "REJECTED",
          remarks: comment || (status === "approved" ? "Approved by HOD/Warden" : "Rejected"),
        });
      } else if (type === "leave") {
        await api.post(`/workflows/leaves/${id}/action`, {
          action: status === "approved" ? "APPROVE" : "REJECT",
          comments: comment || (status === "approved" ? "Approved" : "Rejected"),
        });
      } else if (type === "od") {
        await api.post(`/workflows/ods/${id}/action`, {
          action: status === "approved" ? "APPROVE" : "REJECT",
          comments: comment || (status === "approved" ? "Approved" : "Rejected"),
        });
      }
      toast.success(`Request ${status} successfully!`, { id: loadId });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed.", { id: loadId });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const pendingPasses = gatePasses.filter((p) => p.status === "PENDING_WARDEN_APPROVAL" || p.status === "PENDING_PARENT_OTP");
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");
  const pendingOds = ods.filter((o) => o.status === "PENDING");
  const totalPending = pendingPasses.length + pendingLeaves.length + pendingOds.length;

  // 9 Velocity Bars matching reference rhythm
  const chartBars = [
    { label: "1", height: 48, active: false },
    { label: "2", height: 60, active: false },
    { label: "3", height: 42, active: false },
    { label: "4", height: 78, active: false },
    { label: "5", height: 50, active: false },
    { label: "6", height: 94, active: true, tag: "96.5%" },
    { label: "7", height: 66, active: false },
    { label: "8", height: 52, active: false },
    { label: "9", height: 80, active: false },
  ];

  // 5 Campus Activity Facilities matching reference
  const displayLocations = [
    {
      id: "block-a",
      name: "Department Block A",
      category: "Lecture Halls 1 - 8",
      activityScore: "91.5%",
      status: "Active",
      icon: Building,
      tileClass: "tile-indigo",
    },
    {
      id: "hostel-gate",
      name: "Hostel Main Checkpoint",
      category: "Biometric & QR Scanners",
      activityScore: "98.0%",
      status: "Active",
      icon: Shield,
      tileClass: "tile-emerald",
    },
    {
      id: "lab-block",
      name: "Department Advanced Labs",
      category: "Systems & Network Lab",
      activityScore: "86.0%",
      status: "Active",
      icon: Cpu,
      tileClass: "tile-sky",
    },
    {
      id: "seminar-hall",
      name: "Conference Room 1",
      category: "Faculty Board Room",
      activityScore: "70.0%",
      status: "Normal",
      icon: GraduationCap,
      tileClass: "tile-amber",
    },
    {
      id: "campus-3d",
      name: "Campus Digital Twin 3D",
      category: "Realtime Spatial Pulse",
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
      context: "on Evening Curfew",
      time: "09:10 AM",
      message: "Weekend gate passes synchronized. Curfew compliance at 100%.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    },
    {
      id: "disp-2",
      author: "Security Officer",
      context: "on Main Gate Checkpoint",
      time: "08:40 AM",
      message: "Biometric validation logs recorded with zero security breaches.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    },
  ];

  const hodPeers = [
    { name: "Dr. Sunita", role: "HOD", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80" },
    { name: "Dr. Amit", role: "Faculty", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80" },
    { name: "Dr. Sneha", role: "Faculty", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" },
    { name: "Aarav S.", role: "Student CR", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" },
    { name: "Priya P.", role: "Student CR", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80" },
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
            LEFT COLUMN: OVERVIEW & APPROVAL VELOCITY
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
                  <span className="ref-metric-label">Dept Attendance Rate</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">88.6%</span>
                  <div className="ref-trend-pill up">
                    <span>↑ 2.4%</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">Across all academic sections</span>
              </div>

              <div className="ref-metric-box flush">
                <div className="ref-metric-label-row">
                  <Activity size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">Pending Review Queue</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">{totalPending}</span>
                  <div className="ref-trend-pill up">
                    <span>Action</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">{pendingPasses.length} gate passes • {pendingLeaves.length} leaves</span>
              </div>
            </div>

            {/* Contextual Statement */}
            <div className="ref-context-statement">
              <p className="ref-statement-heading">
                {totalPending > 0
                  ? `${totalPending} authorization requests require your review.`
                  : "All student leave and gate pass requests are up to date!"}
              </p>
              <p className="ref-statement-sub">
                Role: <strong style={{ color: "var(--brand)" }}>{isWarden ? "Hostel Warden" : "Head of Department"}</strong> • Biometric security sync online.
              </p>
            </div>

            {/* Attention Section */}
            <div className="ref-attention-section">
              <div className="ref-attention-header">
                <span className="ref-attention-title">✦ WHAT NEEDS HOD / WARDEN ATTENTION?</span>
                <span className="ref-live-intel-badge">Live Clearance Queue</span>
              </div>

              <div className="ref-attention-cards-grid">
                <div
                  className="ref-attention-card cursor-pointer"
                  onClick={() => setActiveTab("gate_passes")}
                >
                  <div className="ref-attention-card-top">
                    <div className="ref-attention-card-left">
                      <Shield size={15} className="ref-attention-card-icon" />
                      <span className="ref-attention-card-id">Gate Passes</span>
                    </div>
                    <span className="ref-attention-status-pill approved">
                      {pendingPasses.length} PENDING
                    </span>
                  </div>
                  <p className="ref-attention-card-desc">
                    Weekend exit requests queued for warden verification.
                  </p>
                </div>

                <div
                  className="ref-attention-card cursor-pointer"
                  onClick={() => setActiveTab("leaves")}
                >
                  <div className="ref-attention-card-top">
                    <div className="ref-attention-card-left">
                      <FileText size={15} className="ref-attention-card-icon" />
                      <span className="ref-attention-card-id">Leaves & ODs</span>
                    </div>
                    <span className="ref-attention-status-pill due-soon">
                      {pendingLeaves.length + pendingOds.length} QUEUED
                    </span>
                  </div>
                  <p className="ref-attention-card-desc">
                    Academic on-duty applications awaiting department approval.
                  </p>
                </div>
              </div>

              {/* Department Avatars */}
              <div className="ref-avatars-action-row">
                <div className="ref-avatars-list">
                  {hodPeers.map((peer, i) => (
                    <div key={i} className="ref-avatar-unit">
                      <img src={peer.avatar} alt={peer.name} className="ref-user-avatar" />
                      <span className="ref-user-name">{peer.name}</span>
                    </div>
                  ))}
                  <button
                    className="ref-view-all-circle-btn"
                    onClick={() => navigate("/faculty-locator")}
                    title="View Directory"
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

          {/* 2. Approval Velocity Bar Chart Card */}
          <div className="ref-card ref-chart-card">
            <div className="ref-card-header">
              <h2 className="ref-card-title">Approval Velocity</h2>
              <div className="ref-pill-dropdown">
                <span>{chartTimeframe}</span>
                <ChevronDown size={14} className="ref-dropdown-caret" />
              </div>
            </div>

            <div className="ref-chart-body">
              <div className="ref-chart-kpi-block">
                <span className="ref-chart-kpi-value">96.5%</span>
                <span className="ref-chart-kpi-label">Compliance Rate</span>
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
            RIGHT COLUMN: DEPARTMENT VENUES & DISPATCHES
            ============================================================ */}
        <div className="ref-side-column">

          {/* 3. Campus Activity Card */}
          <div className="ref-card ref-products-card">
            <h3 className="ref-products-title">Department Venues</h3>

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
            <h3 className="ref-comments-title">Clearance Dispatches</h3>

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
          INTERACTIVE AUTHORIZATION QUEUE
          ============================================================ */}
      <div className="ref-card" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "14px", marginBottom: "20px" }}>
          <button
            onClick={() => setActiveTab("gate_passes")}
            className="ref-pill-dropdown"
            style={{
              background: activeTab === "gate_passes" ? "var(--brand, #6366F1)" : "var(--bg-card)",
              color: activeTab === "gate_passes" ? "#FFFFFF" : "var(--text-secondary)",
              borderColor: activeTab === "gate_passes" ? "var(--brand, #6366F1)" : "var(--border-color)",
              fontWeight: 600,
            }}
          >
            <Shield size={14} /> Gate Passes ({pendingPasses.length})
          </button>

          <button
            onClick={() => setActiveTab("leaves")}
            className="ref-pill-dropdown"
            style={{
              background: activeTab === "leaves" ? "var(--brand, #6366F1)" : "var(--bg-card)",
              color: activeTab === "leaves" ? "#FFFFFF" : "var(--text-secondary)",
              borderColor: activeTab === "leaves" ? "var(--brand, #6366F1)" : "var(--border-color)",
              fontWeight: 600,
            }}
          >
            <FileText size={14} /> Leave Requests ({pendingLeaves.length})
          </button>

          <button
            onClick={() => setActiveTab("ods")}
            className="ref-pill-dropdown"
            style={{
              background: activeTab === "ods" ? "var(--brand, #6366F1)" : "var(--bg-card)",
              color: activeTab === "ods" ? "#FFFFFF" : "var(--text-secondary)",
              borderColor: activeTab === "ods" ? "var(--brand, #6366F1)" : "var(--border-color)",
              fontWeight: 600,
            }}
          >
            <GraduationCap size={14} /> On-Duty (OD) ({pendingOds.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {activeTab === "gate_passes" && (
            pendingPasses.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No gate passes pending approval.</p>
            ) : (
              pendingPasses.map((pass) => (
                <div
                  key={pass.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-surface)",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
                        Pass #{pass.id} - {pass.student_name || "Student"}
                      </span>
                      <span className="ref-attention-status-pill approved">{pass.status}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Reason: {pass.reason} • Out: {pass.out_time ? new Date(pass.out_time).toLocaleString() : "-"}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      disabled={actionLoading[pass.id]}
                      onClick={() => handleDecision(pass.id, "gate_pass", "approved")}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "9999px",
                        border: "none",
                        background: "var(--success-soft)",
                        color: "var(--success)",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      disabled={actionLoading[pass.id]}
                      onClick={() => handleDecision(pass.id, "gate_pass", "rejected")}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "9999px",
                        border: "none",
                        background: "var(--danger-soft, rgba(239, 68, 68, 0.15))",
                        color: "var(--danger, #ef4444)",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === "leaves" && (
            pendingLeaves.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No leave requests pending review.</p>
            ) : (
              pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-surface)",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
                        Leave #{leave.id} - {leave.leave_type || "General Leave"}
                      </span>
                      <span className="ref-attention-status-pill due-soon">PENDING</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      {leave.reason} • Dates: {leave.start_date} to {leave.end_date}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      disabled={actionLoading[leave.id]}
                      onClick={() => handleDecision(leave.id, "leave", "approved")}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "9999px",
                        border: "none",
                        background: "var(--success-soft)",
                        color: "var(--success)",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      disabled={actionLoading[leave.id]}
                      onClick={() => handleDecision(leave.id, "leave", "rejected")}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "9999px",
                        border: "none",
                        background: "var(--danger-soft, rgba(239, 68, 68, 0.15))",
                        color: "var(--danger, #ef4444)",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === "ods" && (
            pendingOds.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No on-duty requests pending review.</p>
            ) : (
              pendingOds.map((od) => (
                <div
                  key={od.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-surface)",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
                        OD #{od.id} - {od.event_name || "Academic On-Duty"}
                      </span>
                      <span className="ref-attention-status-pill due-soon">PENDING</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Venue: {od.venue || "Campus Event"} • Date: {od.date}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      disabled={actionLoading[od.id]}
                      onClick={() => handleDecision(od.id, "od", "approved")}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "9999px",
                        border: "none",
                        background: "var(--success-soft)",
                        color: "var(--success)",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      disabled={actionLoading[od.id]}
                      onClick={() => handleDecision(od.id, "od", "rejected")}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "9999px",
                        border: "none",
                        background: "var(--danger-soft, rgba(239, 68, 68, 0.15))",
                        color: "var(--danger, #ef4444)",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default HodDashboard;
