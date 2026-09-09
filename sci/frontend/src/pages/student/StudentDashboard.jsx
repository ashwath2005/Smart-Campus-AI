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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, pulseRes, locsRes, forumRes, passRes, assignRes] = await Promise.allSettled([
          api.get("/students/dashboard"),
          api.get("/campus-pulse/current"),
          api.get("/campus-pulse/locations"),
          api.get("/forum/posts?page=1&page_size=3"),
          api.get("/gate-pass/my-passes"),
          api.get("/assignments/"),
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
          const active = passRes.value.data.find(p => p.status in {"PENDING_PARENT_OTP": 1, "PENDING_WARDEN_APPROVAL": 1, "APPROVED": 1, "OUT": 1, "OVERDUE": 1});
          setActiveGatePass(active || passRes.value.data[0] || null);
        }

        if (assignRes.status === "fulfilled" && Array.isArray(assignRes.value.data)) {
          setUrgentAssignments(assignRes.value.data.slice(0, 2));
        }
      } catch (err) {
        toast.error("Failed to load live Smart Campus metrics");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Peer students & faculty matching human warmth of reference avatars
  const campusPeers = [
    {
      name: "Rahul S.",
      role: "Student",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
    },
    {
      name: "Priya P.",
      role: "Student",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80"
    },
    {
      name: "Dr. Amit",
      role: "Faculty",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
    },
    {
      name: "Dr. Sneha",
      role: "Faculty",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
    },
    {
      name: "Dr. Sunita",
      role: "HOD",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"
    }
  ];

  // 9 Vertical Bars matching reference visual rhythm & highlighted active bar
  const chartBars = [
    { label: "1", height: 40, active: false },
    { label: "2", height: 52, active: false },
    { label: "3", height: 35, active: false },
    { label: "4", height: 65, active: false },
    { label: "5", height: 38, active: false },
    { label: "6", height: 88, active: true, tag: "96%" },
    { label: "7", height: 58, active: false },
    { label: "8", height: 44, active: false },
    { label: "9", height: 72, active: false }
  ];

  // 5 Campus Activity Facilities matching Popular Products card geometry
  const displayLocations = [
    {
      id: "block-a",
      name: "Block A (Main Academic)",
      category: "Lecture Halls & Depts",
      activityScore: "88.0%",
      status: "Active",
      icon: Building,
      tileClass: "tile-indigo"
    },
    {
      id: "block-b",
      name: "Block B (Placements & IT)",
      category: "Career & Computing Hub",
      activityScore: "94.5%",
      status: "Active",
      icon: Cpu,
      tileClass: "tile-sky"
    },
    {
      id: "block-c",
      name: "Block C (Research & PG)",
      category: "Innovation & PG Labs",
      activityScore: "64.0%",
      status: "Normal",
      icon: GraduationCap,
      tileClass: "tile-amber"
    },
    {
      id: "lab-block",
      name: "Innovation & Lab Complex",
      category: "Advanced Robotics Center",
      activityScore: "82.0%",
      status: "Active",
      icon: Sparkles,
      tileClass: "tile-emerald"
    },
    {
      id: "campus-3d",
      name: "SKCET Digital Twin 3D",
      category: "Realtime Spatial Pulse",
      activityScore: "99.1%",
      status: "Active",
      icon: Layers,
      tileClass: "tile-purple"
    }
  ];

  // 2 Dispatches matching Comments card geometry in reference
  const displayDispatches = [
    {
      id: "disp-1",
      author: "Dr. Sneha",
      context: "on AI Intelligence Lab",
      time: "09:00 AM",
      message: "Semester lab schedules and attendance metrics synchronized.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
    },
    {
      id: "disp-2",
      author: "Priya P.",
      context: "on Placement Drive",
      time: "08:35 AM",
      message: "Tier-1 campus recruitment schedules posted on placement portal.",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80"
    }
  ];

  const attendancePct = data?.attendancePercentage ?? 82.3;
  const activeStudentsCount = pulseData?.students?.active ?? 120;
  const pulseScore = pulseData?.activityScore ?? 50.1;
  const pendingAssignmentsCount = data?.pendingAssignments ?? 0;
  const todayClassesCount = data?.todayClasses?.length ?? 3;

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
                    <span>↑ 4.2%</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">vs last month</span>
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
                    <span>↑ 36.8%</span>
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
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={13} style={{ color: "#ef4444" }} />
                  WHAT NEEDS MY ATTENTION?
                </span>
                <span style={{ fontSize: "10.5px", color: "#64748b" }}>Live Campus Intelligence</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                {/* 1. Gate Pass status */}
                {activeGatePass ? (
                  <div
                    onClick={() => navigate('/gate-pass')}
                    style={{ padding: "12px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.45)", border: "1px solid rgba(255, 255, 255, 0.08)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                        <QrCode size={13} style={{ color: "#ef4444" }} />
                        Pass #{activeGatePass.id}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: activeGatePass.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: activeGatePass.status === 'APPROVED' ? '#34d399' : '#fbbf24' }}>
                        {activeGatePass.status}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.3 }}>
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
                    style={{ padding: "12px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.45)", border: "1px solid rgba(255, 255, 255, 0.08)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                        <QrCode size={13} style={{ color: "#64748b" }} />
                        Digital Gate Pass
                      </span>
                      <span style={{ fontSize: "10px", color: "#34d399", fontWeight: "600" }}>On Campus</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Apply for day outpass or weekend leave</span>
                  </div>
                )}

                {/* 2. Urgent Assignment or Attendance Status */}
                {attendancePct < 75 ? (
                  <div
                    onClick={() => navigate('/attendance')}
                    style={{ padding: "12px", borderRadius: "10px", background: "rgba(225, 29, 72, 0.15)", border: "1px solid rgba(225, 29, 72, 0.3)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#f43f5e", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock size={13} style={{ color: "#f43f5e" }} />
                        Attendance Shortage
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: "rgba(225, 29, 72, 0.25)", color: "#fda4af" }}>
                        {attendancePct}%
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#fecdd3" }}>Overall attendance is below the required 75% threshold</span>
                  </div>
                ) : urgentAssignments.length > 0 ? (
                  <div
                    onClick={() => navigate('/assignments')}
                    style={{ padding: "12px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.45)", border: "1px solid rgba(255, 255, 255, 0.08)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                        <BookOpen size={13} style={{ color: "#38bdf8" }} />
                        Coursework Due
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8" }}>
                        Due Soon
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {urgentAssignments[0]?.title || 'Pending academic assignment'}
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={() => navigate('/placements')}
                    style={{ padding: "12px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.45)", border: "1px solid rgba(255, 255, 255, 0.08)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Briefcase size={13} style={{ color: "#fbbf24" }} />
                        Placements
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", background: "rgba(251, 191, 36, 0.2)", color: "#fbbf24" }}>
                        Eligible
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Active campus recruitment drives open for your batch</span>
                  </div>
                )}
              </div>
            </div>


            {/* Active Users Avatar Row with Circular View All Button */}
            <div className="ref-avatars-action-row">
              <div className="ref-avatars-list">
                {campusPeers.map((peer, idx) => (
                  <div key={idx} className="ref-avatar-unit">
                    <img 
                      src={peer.avatar} 
                      alt={peer.name}
                      className="ref-user-avatar"
                    />
                    <span className="ref-user-name">{peer.name}</span>
                  </div>
                ))}

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
                <span className="ref-chart-kpi-value">{attendancePct}%</span>
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
              {displayLocations.map((loc) => {
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
              })}
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
              {displayDispatches.map((post) => (
                <div 
                  key={post.id} 
                  className="ref-comment-item"
                  onClick={() => navigate('/forum')}
                  title="Open in Peer Forum"
                >
                  <div className="ref-comment-header-row">
                    <img
                      src={post.avatar}
                      alt={post.author}
                      className="ref-comment-avatar"
                    />
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
              ))}
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
