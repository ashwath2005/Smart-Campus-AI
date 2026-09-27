import "./StudentDashboard.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import {
  Users,
  Clock,
  Activity,
  ArrowRight,
  ChevronDown,
  Building,
  Cpu,
  GraduationCap,
  Sparkles,
  Layers,
  MessageSquare,
  QrCode,
  BookOpen,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [data, setData] = useState(null);
  const [pulseData, setPulseData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overviewTimeframe, setOverviewTimeframe] = useState("This semester");
  const [chartTimeframe, setChartTimeframe] = useState("Last 7 days");
  const navigate = useNavigate();

  const [activeGatePass, setActiveGatePass] = useState(null);
  const [urgentAssignments, setUrgentAssignments] = useState([]);
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, pulseRes, locsRes, forumRes, passRes, assignRes, peersRes] = await Promise.allSettled([
          api.get("/students/dashboard"),
          api.get("/campus-pulse/current"),
          api.get("/campus-pulse/locations"),
          api.get("/forum/posts?page=1&page_size=3"),
          api.get("/gate-pass/my-passes"),
          api.get("/assignments/"),
          api.get("/students/peers"),
        ]);

        if (dashRes.status === "fulfilled") {
          setData(dashRes.value.data);
        }

        if (pulseRes.status === "fulfilled") {
          setPulseData(pulseRes.value.data);
        }

        if (locsRes.status === "fulfilled" && Array.isArray(locsRes.value.data)) {
          setLocations(locsRes.value.data);
        }

        if (forumRes.status === "fulfilled" && forumRes.value.data?.posts) {
          setForumPosts(forumRes.value.data.posts);
        }

        if (passRes.status === "fulfilled" && Array.isArray(passRes.value.data)) {
          const activeStatuses = ["PENDING_PARENT_OTP", "PENDING_WARDEN_APPROVAL", "APPROVED", "OUT", "OVERDUE"];
          const active = passRes.value.data.find(p => p && activeStatuses.includes(p.status));
          setActiveGatePass(active || passRes.value.data[0] || null);
        }

        if (assignRes.status === "fulfilled" && Array.isArray(assignRes.value.data)) {
          setUrgentAssignments(assignRes.value.data.slice(0, 2));
        }

        if (peersRes.status === "fulfilled" && Array.isArray(peersRes.value.data)) {
          setPeers(peersRes.value.data);
        }
      } catch (err) {
        toast.error("Failed to load live Smart Campus metrics");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const attendancePct = data?.attendancePercentage ?? 0;
  const activeStudentsCount = pulseData?.students?.active ?? 0;
  const pulseScore = pulseData?.activityScore ?? 0;
  const pendingAssignmentsCount = data?.pendingAssignments ?? 0;
  const todayClassesCount = data?.todayClasses?.length ?? 0;

  // Real classmates & department peers from database
  const campusPeers = (peers || []).map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role || "Student",
    initial: (p.name || "S").charAt(0).toUpperCase(),
  }));

  // Dynamic 9 Velocity Bars based on student attendance rate
  const chartBars = [
    { label: "1", height: Math.max(12, Math.round(attendancePct * 0.55)), active: false },
    { label: "2", height: Math.max(15, Math.round(attendancePct * 0.7)), active: false },
    { label: "3", height: Math.max(12, Math.round(attendancePct * 0.5)), active: false },
    { label: "4", height: Math.max(20, Math.round(attendancePct * 0.8)), active: false },
    { label: "5", height: Math.max(15, Math.round(attendancePct * 0.65)), active: false },
    { label: "6", height: Math.max(25, Math.min(100, Math.round(attendancePct))), active: attendancePct > 0, tag: `${attendancePct}%` },
    { label: "7", height: Math.max(18, Math.round(attendancePct * 0.75)), active: false },
    { label: "8", height: Math.max(14, Math.round(attendancePct * 0.6)), active: false },
    { label: "9", height: Math.max(20, Math.round(attendancePct * 0.85)), active: false },
  ];

  // Dynamic locations from Campus Pulse
  const displayLocations = (locations || []).map((loc, i) => ({
    id: loc.id || `loc-${i}`,
    name: loc.name,
    category: loc.category || "Campus Facility",
    activityScore: typeof loc.activityScore === "number" ? `${loc.activityScore}%` : (loc.activityScore || "Active"),
    status: loc.status || "Active",
    icon: Building,
    tileClass: i % 2 === 0 ? "tile-indigo" : "tile-emerald",
  }));

  // Dynamic dispatches from Peer Discussion Forum
  const displayDispatches = (forumPosts || []).map((post) => ({
    id: post.id,
    author: post.author_name || post.author || "Student",
    context: post.category ? `on ${post.category}` : "in Campus Forum",
    time: post.created_at ? new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent",
    message: post.title || post.content || "Discussion topic shared.",
    initial: (post.author_name || post.author || "S").charAt(0).toUpperCase(),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="ref-dashboard-container"
    >
      {/* 2-Column Master Grid (72% Main / 28% Side) */}
      <div className="ref-dashboard-layout">
        
        {/* ============================================================
            LEFT COLUMN: OVERVIEW & ACADEMIC VELOCITY CHART
            ============================================================ */}
        <div className="ref-main-column">

          {/* 1. Overview Card */}
          <div className="ref-card ref-overview-card">
            {/* Card Header: Title + Pill Dropdown */}
            <div className="ref-card-header">
              <h2 className="ref-card-title">Overview</h2>
              <div className="ref-pill-dropdown">
                <span>{overviewTimeframe}</span>
                <ChevronDown size={14} className="ref-dropdown-caret" />
              </div>
            </div>

            {/* Metric Boxes Row */}
            <div className="ref-metrics-row">
              {/* Left Metric: Elevated Card */}
              <div className="ref-metric-box elevated">
                <div className="ref-metric-label-row">
                  <Clock size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">Attendance Rate</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">{attendancePct}%</span>
                  <div className="ref-trend-pill up">
                    <span>Live</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">Across registered subjects</span>
              </div>

              {/* Right Metric: Flush on parent surface */}
              <div className="ref-metric-box flush">
                <div className="ref-metric-label-row">
                  <Activity size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">Campus Pulse</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">{pulseScore}</span>
                  <div className="ref-trend-pill up">
                    <span>Active</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">{activeStudentsCount} students active on campus</span>
              </div>
            </div>

            {/* Contextual Statement */}
            <div className="ref-context-statement">
              <h4 className="ref-statement-heading">
                {todayClassesCount} academic sessions scheduled today!
              </h4>
              <p className="ref-statement-sub">
                {pendingAssignmentsCount > 0 
                  ? `You have ${pendingAssignmentsCount} pending learning assignments due this week.`
                  : "All academic assignments and lab reports are up to date."}
              </p>
            </div>

            {/* Intelligent "What Needs My Attention?" section */}
            <div className="ref-attention-section">
              <div className="ref-attention-header">
                <span className="ref-attention-heading">
                  <Sparkles size={13} style={{ color: "var(--brand)" }} />
                  WHAT NEEDS MY ATTENTION?
                </span>
                <span className="ref-attention-meta">Live Campus Intelligence</span>
              </div>

              <div className="ref-attention-grid">
                {/* 1. Gate Pass status */}
                {activeGatePass ? (
                  <div
                    onClick={() => navigate('/gate-pass')}
                    className="ref-attention-card"
                  >
                    <div className="ref-attention-card-top">
                      <span className="ref-attention-card-title">
                        <QrCode size={13} style={{ color: "var(--brand)" }} />
                        Pass #{activeGatePass.id}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: activeGatePass.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: activeGatePass.status === 'APPROVED' ? '#10b981' : '#f59e0b' }}>
                        {activeGatePass.status}
                      </span>
                    </div>
                    <span className="ref-attention-card-desc">
                      {activeGatePass.status === 'APPROVED' ? 'QR Code ready for exit scan at Main Gate' :
                       activeGatePass.status === 'PENDING_PARENT_OTP' ? 'Waiting for Guardian SMS OTP authorization' :
                       activeGatePass.status === 'PENDING_WARDEN_APPROVAL' ? 'Guardian verified. Awaiting HOD sign-off' :
                       activeGatePass.status === 'OUT' ? 'Currently outside campus. Return before curfew' :
                       `Destination: ${activeGatePass.destination}`}
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={() => navigate('/gate-pass')}
                    className="ref-attention-card"
                  >
                    <div className="ref-attention-card-top">
                      <span className="ref-attention-card-title">
                        <QrCode size={13} style={{ color: "var(--text-muted)" }} />
                        Digital Gate Pass
                      </span>
                      <span style={{ fontSize: "10px", color: "#10b981", fontWeight: "600" }}>On Campus</span>
                    </div>
                    <span className="ref-attention-card-desc">Apply for day outpass or weekend leave</span>
                  </div>
                )}

                {/* 2. Urgent Assignment or Attendance Status */}
                {attendancePct < 75 ? (
                  <div
                    onClick={() => navigate('/attendance')}
                    className="ref-attention-card-alert"
                  >
                    <div className="ref-attention-card-top">
                      <span className="ref-attention-card-title" style={{ color: "#ef4444" }}>
                        <Clock size={13} style={{ color: "#ef4444" }} />
                        Attendance Shortage
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
                        {attendancePct}%
                      </span>
                    </div>
                    <span className="ref-attention-card-desc" style={{ color: "var(--text-secondary)" }}>Overall attendance is below the required 75% threshold</span>
                  </div>
                ) : urgentAssignments.length > 0 ? (
                  <div
                    onClick={() => navigate('/assignments')}
                    className="ref-attention-card"
                  >
                    <div className="ref-attention-card-top">
                      <span className="ref-attention-card-title">
                        <BookOpen size={13} style={{ color: "#0284c7" }} />
                        Coursework Due
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: "rgba(2, 132, 199, 0.15)", color: "#0284c7" }}>
                        Due Soon
                      </span>
                    </div>
                    <span className="ref-attention-card-desc">
                      {urgentAssignments[0]?.title || 'Pending academic assignment'}
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={() => navigate('/placements')}
                    className="ref-attention-card"
                  >
                    <div className="ref-attention-card-top">
                      <span className="ref-attention-card-title">
                        <Briefcase size={13} style={{ color: "#d97706" }} />
                        Placements
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: "rgba(217, 119, 6, 0.15)", color: "#d97706" }}>
                        Eligible
                      </span>
                    </div>
                    <span className="ref-attention-card-desc">Active campus recruitment drives open for your batch</span>
                  </div>
                )}
              </div>
            </div>


            {/* Active Users Avatar Row with Circular View All Button */}
            <div className="ref-avatars-action-row">
              <div className="ref-avatars-list">
                {campusPeers.length > 0 ? (
                  campusPeers.map((peer, idx) => (
                    <div key={idx} className="ref-avatar-unit">
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
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Class directory connected</span>
                )}

                {/* Circular View All Button with arrow */}
                <button
                  type="button"
                  onClick={() => navigate('/timetable')}
                  className="ref-view-all-circle-btn"
                  title="View full schedule & peers"
                >
                  <div className="ref-circle-arrow-box">
                    <ArrowRight size={17} />
                  </div>
                  <span className="ref-view-all-text">View all</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Academic Velocity Bar Chart Card */}
          <div className="ref-card ref-chart-card">
            {/* Card Header: Title + Pill Dropdown */}
            <div className="ref-card-header">
              <h2 className="ref-card-title">Academic Velocity</h2>
              <div className="ref-pill-dropdown">
                <span>{chartTimeframe}</span>
                <ChevronDown size={14} className="ref-dropdown-caret" />
              </div>
            </div>

            {/* Chart Body */}
            <div className="ref-chart-body">
              {/* Intentional Supporting KPI Block */}
              <div className="ref-chart-kpi-block">
                <span className="ref-chart-kpi-value">{attendancePct > 0 ? `${attendancePct}%` : "0%"}</span>
                <span className="ref-chart-kpi-label">Avg Attendance</span>
              </div>

              {/* 9 Vertical Bars */}
              <div className="ref-chart-bars-track">
                {chartBars.map((bar, index) => (
                  <div key={index} className="ref-chart-bar-column">
                    {/* Floating Tooltip Pill for Active Bar */}
                    {bar.active && (
                      <div className="ref-bar-tooltip-bubble">
                        <span>{bar.tag}</span>
                        <div className="ref-bar-target-ring" />
                      </div>
                    )}

                    {/* Bar Pill */}
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
            RIGHT COLUMN: CAMPUS LOCATIONS & RECENT DISPATCHES
            ============================================================ */}
        <div className="ref-side-column">

          {/* 1. Campus Activity (Popular products) Card */}
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
                      onClick={() => navigate('/campus-pulse')}
                      title="View in Campus Pulse 3D Digital Twin"
                    >
                      <div className={`ref-product-icon-box ${loc.tileClass}`}>
                        <IconComponent size={20} strokeWidth={1.8} />
                      </div>
                      
                      <div className="ref-product-details">
                        <span className="ref-product-name">{loc.name}</span>
                        <span className="ref-product-category">{loc.category}</span>
                      </div>

                      <div className="ref-product-right-col">
                        <span className="ref-product-score">{loc.activityScore}</span>
                        <span className={`ref-status-capsule ${loc.status === "Active" ? "active" : "offline"}`}>
                          {loc.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "1.5rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  No real-time facility telemetry active.
                </div>
              )}
            </div>

            {/* Pill Action Button at Bottom */}
            <button
              type="button"
              onClick={() => navigate('/campus-pulse')}
              className="ref-all-products-btn"
            >
              Open Campus Pulse 3D
            </button>
          </div>

          {/* 2. Campus Dispatches (Comments) Card */}
          <div className="ref-card ref-comments-card">
            <h3 className="ref-comments-title">Campus Dispatches</h3>

            <div className="ref-comments-list">
              {displayDispatches.length > 0 ? (
                displayDispatches.map((post) => (
                  <div 
                    key={post.id} 
                    className="ref-comment-item"
                    onClick={() => navigate('/forum')}
                    title="Open in Peer Forum"
                  >
                    <div className="ref-comment-header-row">
                      <div
                        className="ref-comment-avatar"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(242, 23, 34, 0.12)",
                          color: "#f21722",
                          fontWeight: "700",
                          fontSize: "12px",
                          borderRadius: "9999px",
                          width: "36px",
                          height: "36px",
                        }}
                      >
                        {post.initial}
                      </div>
                      <div className="ref-comment-author-block">
                        <p className="ref-comment-author-line">
                          <span className="ref-comment-author">{post.author}</span>{" "}
                          <span className="ref-comment-context">{post.context}</span>
                        </p>
                        <span className="ref-comment-time">{post.time}</span>
                      </div>
                    </div>
                    <p className="ref-comment-body">{post.message}</p>
                  </div>
                ))
              ) : (
                <div style={{ padding: "1.5rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  No peer dispatches posted yet.
                </div>
              )}
            </div>

            {/* Clean subtle footer action */}
            <div className="ref-dispatches-footer">
              <button
                type="button"
                onClick={() => navigate('/forum')}
                className="ref-view-dispatches-btn"
              >
                <span>View all peer dispatches</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};
