import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import {
  Users,
  BookOpen,
  Clock,
  Activity,
  Sparkles,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building,
  GraduationCap,
  Layers,
  Cpu,
  Brain,
  Award,
  Save,
  RotateCcw,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./FacultyDashboard.css";

export const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overviewTimeframe, setOverviewTimeframe] = useState("This semester");
  const [chartTimeframe, setChartTimeframe] = useState("Last 7 days");
  const [activeTab, setActiveTab] = useState("roster"); // roster | marks | ai_analytics | create_assignment

  // Status state
  const [currentStatus, setCurrentStatus] = useState("Available");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Roster Bulk Attendance
  const [studentsRoster, setStudentsRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [bulkAttendance, setBulkAttendance] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [attSubject, setAttSubject] = useState("Data Structures");

  // AI Learning Analytics
  const [faData, setFaData] = useState(null);
  const [faLoading, setFaLoading] = useState(false);

  // Internal Marks
  const [marksSubject, setMarksSubject] = useState("Data Structures");
  const [marksExam, setMarksExam] = useState("cat1");
  const [marksSemester, setMarksSemester] = useState(4);
  const [marksMax, setMarksMax] = useState(50);
  const [marksRoster, setMarksRoster] = useState([]);
  const [marksValues, setMarksValues] = useState({});
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksSaving, setMarksSaving] = useState(false);

  // Quick Assignment state
  const [assignTitle, setAssignTitle] = useState("");
  const [assignSubject, setAssignSubject] = useState("Data Structures");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchFacultyData = async () => {
    try {
      const [analyticsRes, rosterRes] = await Promise.allSettled([
        api.get("/faculty/dashboard-analytics"),
        api.get("/attendance/students"),
      ]);

      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value.data);
      if (rosterRes.status === "fulfilled" && Array.isArray(rosterRes.value.data)) {
        setStudentsRoster(rosterRes.value.data);
        const initial = {};
        rosterRes.value.data.forEach((s) => {
          initial[s.id] = "present";
        });
        setBulkAttendance(initial);
      }
    } catch {
      toast.error("Failed to load faculty telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchFacultyAnalytics = async () => {
    setFaLoading(true);
    try {
      const res = await api.get("/learning-intelligence/faculty-analytics");
      setFaData(res.data);
    } catch {
      toast.error("Failed to load AI Learning Analytics data");
    } finally {
      setFaLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "ai_analytics") {
      fetchFacultyAnalytics();
    }
  }, [activeTab]);

  const handleUpdateStatus = async (status) => {
    setStatusUpdating(true);
    try {
      await api.post("/faculty-locator/status", { status });
      setCurrentStatus(status);
      toast.success(`Presence updated to ${status}`);
    } catch {
      toast.error("Failed to update availability status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleMarkBulk = async () => {
    setBulkLoading(true);
    try {
      const records = Object.entries(bulkAttendance).map(([studentId, status]) => ({
        student_id: parseInt(studentId, 10),
        subject: attSubject,
        date: attDate,
        status,
      }));
      await api.post("/attendance/bulk", { records });
      toast.success(`Attendance logged for ${records.length} students!`);
    } catch {
      toast.error("Failed to submit class attendance records.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignTitle || !assignDueDate) {
      toast.error("Title and due date are required");
      return;
    }
    setAssignLoading(true);
    try {
      await api.post("/assignments/", {
        title: assignTitle,
        subject: assignSubject,
        description: assignDesc,
        due_date: assignDueDate,
      });
      toast.success("Assignment published successfully!");
      setAssignTitle("");
      setAssignDesc("");
      setAssignDueDate("");
    } catch {
      toast.error("Failed to publish assignment");
    } finally {
      setAssignLoading(false);
    }
  };

  const attendanceAvg = analytics?.averageAttendance ?? 86.4;
  const classesToday = analytics?.classesToday ?? 3;
  const totalStudentsEnrolled = analytics?.totalStudents ?? 142;

  // 9 Velocity Bars matching reference rhythm
  const chartBars = [
    { label: "1", height: 50, active: false },
    { label: "2", height: 62, active: false },
    { label: "3", height: 44, active: false },
    { label: "4", height: 75, active: false },
    { label: "5", height: 48, active: false },
    { label: "6", height: 90, active: true, tag: "94%" },
    { label: "7", height: 68, active: false },
    { label: "8", height: 55, active: false },
    { label: "9", height: 82, active: false },
  ];

  // 5 Campus Activity Facilities matching reference
  const displayLocations = [
    {
      id: "block-a",
      name: "Lecture Hall A-204",
      category: "Data Structures & Algos",
      activityScore: "92.0%",
      status: "Active",
      icon: Building,
      tileClass: "tile-indigo",
    },
    {
      id: "lab-block",
      name: "Computing Systems Lab 2",
      category: "Systems & Network Lab",
      activityScore: "88.5%",
      status: "Active",
      icon: Cpu,
      tileClass: "tile-sky",
    },
    {
      id: "ai-lab",
      name: "AI & Robotics PG Suite",
      category: "Cognitive Research",
      activityScore: "95.0%",
      status: "Active",
      icon: Sparkles,
      tileClass: "tile-emerald",
    },
    {
      id: "block-c",
      name: "Seminar Hall C-1",
      category: "Department Faculty Room",
      activityScore: "74.0%",
      status: "Normal",
      icon: GraduationCap,
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
      author: "HOD Office",
      context: "on Curriculum Sync",
      time: "09:15 AM",
      message: "Internal CAT-1 marks submission window opens this Friday.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    },
    {
      id: "disp-2",
      author: "Priya P.",
      context: "on Data Structures",
      time: "08:50 AM",
      message: "Assignment #3 submission uploaded for verification.",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    },
  ];

  const facultyPeers = [
    { name: "Dr. Sunita", role: "HOD", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80" },
    { name: "Dr. Amit", role: "Faculty", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80" },
    { name: "Dr. Sneha", role: "Faculty", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" },
    { name: "Rahul S.", role: "Student CR", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" },
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
            LEFT COLUMN: OVERVIEW & TEACHING ENGAGEMENT VELOCITY
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
                  <span className="ref-metric-label">Course Attendance Rate</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">{attendanceAvg}%</span>
                  <div className="ref-trend-pill up">
                    <span>↑ 3.8%</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">Across {totalStudentsEnrolled} registered students</span>
              </div>

              <div className="ref-metric-box flush">
                <div className="ref-metric-label-row">
                  <Activity size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">Scheduled Sessions</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">{classesToday}</span>
                  <div className="ref-trend-pill up">
                    <span>Active</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">Next session at 10:30 AM in A-204</span>
              </div>
            </div>

            {/* Contextual Statement */}
            <div className="ref-context-statement">
              <p className="ref-statement-heading">
                {classesToday} academic lectures and lab sessions scheduled today!
              </p>
              <p className="ref-statement-sub">
                Availability status: <strong style={{ color: "var(--brand)" }}>{currentStatus}</strong> • Class attendance roster ready for sync.
              </p>
            </div>

            {/* Attention Section */}
            <div className="ref-attention-section">
              <div className="ref-attention-header">
                <span className="ref-attention-title">✦ WHAT NEEDS FACULTY ATTENTION?</span>
                <span className="ref-live-intel-badge">Live Class Intelligence</span>
              </div>

              <div className="ref-attention-cards-grid">
                <div
                  className="ref-attention-card cursor-pointer"
                  onClick={() => setActiveTab("roster")}
                >
                  <div className="ref-attention-card-top">
                    <div className="ref-attention-card-left">
                      <Users size={15} className="ref-attention-card-icon" />
                      <span className="ref-attention-card-id">Class Roster</span>
                    </div>
                    <span className="ref-attention-status-pill approved">READY</span>
                  </div>
                  <p className="ref-attention-card-desc">
                    {studentsRoster.length} students queued for today's roll call.
                  </p>
                </div>

                <div
                  className="ref-attention-card cursor-pointer"
                  onClick={() => setActiveTab("ai_analytics")}
                >
                  <div className="ref-attention-card-top">
                    <div className="ref-attention-card-left">
                      <Brain size={15} className="ref-attention-card-icon" />
                      <span className="ref-attention-card-id">Cognitive Engine</span>
                    </div>
                    <span className="ref-attention-status-pill due-soon">ALRA / KDPA</span>
                  </div>
                  <p className="ref-attention-card-desc">
                    AI identified 2 students requiring retention reinforcement.
                  </p>
                </div>
              </div>

              {/* Peers / Students Avatars */}
              <div className="ref-avatars-action-row">
                <div className="ref-avatars-list">
                  {facultyPeers.map((peer, i) => (
                    <div key={i} className="ref-avatar-unit">
                      <img src={peer.avatar} alt={peer.name} className="ref-user-avatar" />
                      <span className="ref-user-name">{peer.name}</span>
                    </div>
                  ))}
                  <button
                    className="ref-view-all-circle-btn"
                    onClick={() => navigate("/faculty-locator")}
                    title="View Department Roster"
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

          {/* 2. Engagement Velocity Bar Chart Card */}
          <div className="ref-card ref-chart-card">
            <div className="ref-card-header">
              <h2 className="ref-card-title">Academic Engagement</h2>
              <div className="ref-pill-dropdown">
                <span>{chartTimeframe}</span>
                <ChevronDown size={14} className="ref-dropdown-caret" />
              </div>
            </div>

            <div className="ref-chart-body">
              <div className="ref-chart-kpi-block">
                <span className="ref-chart-kpi-value">94%</span>
                <span className="ref-chart-kpi-label">Class Attendance</span>
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
            RIGHT COLUMN: FACULTY VENUES & DISPATCHES
            ============================================================ */}
        <div className="ref-side-column">

          {/* 3. Campus Activity Card */}
          <div className="ref-card ref-products-card">
            <h3 className="ref-products-title">Academic Venues</h3>

            <div className="ref-products-list">
              {displayLocations.map((loc) => {
                const IconComponent = loc.icon;
                return (
                  <div
                    key={loc.id}
                    className="ref-product-item"
                    onClick={() => navigate("/timetable")}
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
            <h3 className="ref-comments-title">Department Dispatches</h3>

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
          FACULTY OPERATIONAL WORKSPACE (ROSTER, MARKS, AI)
          ============================================================ */}
      <div className="ref-card" style={{ marginTop: "24px" }}>
        {/* Workspace Tab Header */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "14px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setActiveTab("roster")}
              className="ref-pill-dropdown"
              style={{
                background: activeTab === "roster" ? "var(--brand, #6366F1)" : "var(--bg-card)",
                color: activeTab === "roster" ? "#FFFFFF" : "var(--text-secondary)",
                borderColor: activeTab === "roster" ? "var(--brand, #6366F1)" : "var(--border-color)",
                fontWeight: 600,
              }}
            >
              <Users size={14} /> Class Roll Call
            </button>

            <button
              onClick={() => setActiveTab("ai_analytics")}
              className="ref-pill-dropdown"
              style={{
                background: activeTab === "ai_analytics" ? "var(--brand, #6366F1)" : "var(--bg-card)",
                color: activeTab === "ai_analytics" ? "#FFFFFF" : "var(--text-secondary)",
                borderColor: activeTab === "ai_analytics" ? "var(--brand, #6366F1)" : "var(--border-color)",
                fontWeight: 600,
              }}
            >
              <Brain size={14} /> AI Cognitive Insights
            </button>

            <button
              onClick={() => setActiveTab("create_assignment")}
              className="ref-pill-dropdown"
              style={{
                background: activeTab === "create_assignment" ? "var(--brand, #6366F1)" : "var(--bg-card)",
                color: activeTab === "create_assignment" ? "#FFFFFF" : "var(--text-secondary)",
                borderColor: activeTab === "create_assignment" ? "var(--brand, #6366F1)" : "var(--border-color)",
                fontWeight: 600,
              }}
            >
              <BookOpen size={14} /> New Assignment
            </button>
          </div>

          {/* Quick Faculty Status Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>My Status:</span>
            {["Available", "In Class", "In Meeting"].map((st) => (
              <button
                key={st}
                disabled={statusUpdating}
                onClick={() => handleUpdateStatus(st)}
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  border: "1px solid",
                  borderColor: currentStatus === st ? "var(--brand)" : "var(--border-color)",
                  background: currentStatus === st ? "var(--brand)" : "transparent",
                  color: currentStatus === st ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Class Roll Call Roster */}
        {activeTab === "roster" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                />
                <select
                  value={attSubject}
                  onChange={(e) => setAttSubject(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                >
                  <option value="Data Structures">Data Structures</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Database Systems">Database Systems</option>
                </select>
              </div>

              <button
                onClick={handleMarkBulk}
                disabled={bulkLoading}
                className="ref-all-products-btn"
                style={{ width: "auto", padding: "8px 20px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Save size={14} />
                {bulkLoading ? "Submitting..." : "Save Attendance"}
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textAlign: "left" }}>
                    <th style={{ padding: "10px" }}>Roll No / ID</th>
                    <th style={{ padding: "10px" }}>Student Name</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsRoster.slice(0, 8).map((student) => {
                    const st = bulkAttendance[student.id] || "present";
                    return (
                      <tr key={student.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "10px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {student.register_number || student.id}
                        </td>
                        <td style={{ padding: "10px", color: "var(--text-secondary)" }}>
                          {student.name}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          <button
                            onClick={() =>
                              setBulkAttendance((prev) => ({
                                ...prev,
                                [student.id]: st === "present" ? "absent" : "present",
                              }))
                            }
                            style={{
                              padding: "4px 12px",
                              borderRadius: "9999px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              border: "none",
                              background: st === "present" ? "var(--success-soft)" : "var(--danger-soft, rgba(239, 68, 68, 0.15))",
                              color: st === "present" ? "var(--success)" : "var(--danger, #ef4444)",
                            }}
                          >
                            {st === "present" ? "✓ Present" : "✕ Absent"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: AI Cognitive Insights */}
        {activeTab === "ai_analytics" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              <div className="ref-metric-box elevated">
                <div className="ref-metric-label-row">
                  <Brain size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">ALRA Latent Risk Score</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">{faData?.riskIndex ?? "Low"}</span>
                </div>
                <span className="ref-trend-subtext">Cognitive learning pathway stable across cohort</span>
              </div>

              <div className="ref-metric-box flush">
                <div className="ref-metric-label-row">
                  <Award size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">KDPA Retention Index</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">91.2%</span>
                </div>
                <span className="ref-trend-subtext">Ebbinghaus decay curve within optimal threshold</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Create Assignment */}
        {activeTab === "create_assignment" && (
          <form onSubmit={handleCreateAssignment} style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "600px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                Assignment Title
              </label>
              <input
                type="text"
                placeholder="e.g. Balanced BST Implementation"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Subject
                </label>
                <select
                  value={assignSubject}
                  onChange={(e) => setAssignSubject(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                >
                  <option value="Data Structures">Data Structures</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Database Systems">Database Systems</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Include submission criteria..."
                value={assignDesc}
                onChange={(e) => setAssignDesc(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={assignLoading}
              className="ref-all-products-btn"
              style={{ width: "auto", padding: "8px 24px", alignSelf: "flex-start" }}
            >
              {assignLoading ? "Publishing..." : "Publish Assignment"}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};

export default FacultyDashboard;
