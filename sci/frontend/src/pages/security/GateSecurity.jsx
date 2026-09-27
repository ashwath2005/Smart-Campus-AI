import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import {
  ShieldCheck,
  QrCode,
  LogOut,
  LogIn,
  AlertOctagon,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Sparkles,
  Activity,
  X,
  Clock,
  ChevronDown,
  ArrowRight,
  Shield,
  Building,
  Layers,
  Cpu,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./GateSecurity.css";

const DEFAULT_ANALYTICS = {
  totalPasses: 1240,
  currentlyOutside: 14,
  overduePasses: 2,
  approvalRatePct: 98.4,
};

const DEFAULT_PASSES = [
  {
    id: "GP-8041",
    studentId: "23CS108",
    studentName: "Aarav Sharma",
    passType: "WEEKEND_EXIT",
    destination: "Home Transit (Outstation)",
    actualExitTime: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    status: "OUT",
  },
  {
    id: "GP-8038",
    studentId: "23CS214",
    studentName: "Rohan Verma",
    passType: "OFF_CAMPUS_PROJECT",
    destination: "Tech Park Lab 4",
    actualExitTime: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    status: "OUT",
  },
  {
    id: "GP-8012",
    studentId: "23ME091",
    studentName: "Vikram Malhotra",
    passType: "EMERGENCY_MEDICAL",
    destination: "City Hospital",
    actualExitTime: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    status: "OVERDUE",
  },
];

export function GateSecurity() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);
  const [qrInput, setQrInput] = useState("");
  const [allPasses, setAllPasses] = useState(DEFAULT_PASSES);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overviewTimeframe, setOverviewTimeframe] = useState("Today");
  const [chartTimeframe, setChartTimeframe] = useState("Last 7 days");

  const fetchPassesAndAnalytics = async () => {
    try {
      const [passesRes, summaryRes] = await Promise.allSettled([
        api.get("/gate-pass/all-passes"),
        api.get("/gate-pass/summary"),
      ]);
      if (passesRes.status === "fulfilled" && Array.isArray(passesRes.value.data) && passesRes.value.data.length > 0) {
        setAllPasses(passesRes.value.data);
      }
      if (summaryRes.status === "fulfilled" && summaryRes.value.data) {
        setAnalytics(summaryRes.value.data);
      }
    } catch {
      // maintain robust mock fallback
    }
  };

  useEffect(() => {
    fetchPassesAndAnalytics();
  }, []);

  const handleScanSubmit = async (e) => {
    e?.preventDefault();
    if (!qrInput.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/gate-pass/security-scan", { qr_token: qrInput.trim() });
      setScanResult(res.data);
      toast.success(res.data?.message || "Pass verified successfully!");
      fetchPassesAndAnalytics();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired gate pass QR token");
    } finally {
      setLoading(false);
    }
  };

  // 9 Velocity Bars matching reference rhythm
  const chartBars = [
    { label: "1", height: 42, active: false },
    { label: "2", height: 55, active: false },
    { label: "3", height: 35, active: false },
    { label: "4", height: 70, active: false },
    { label: "5", height: 48, active: false },
    { label: "6", height: 95, active: true, tag: "98.4%" },
    { label: "7", height: 60, active: false },
    { label: "8", height: 46, active: false },
    { label: "9", height: 76, active: false },
  ];

  // 5 Campus Activity Facilities matching reference
  const displayLocations = [
    {
      id: "main-gate",
      name: "Main Campus Gate #1",
      category: "Vehicular & Pedestrian",
      activityScore: "98.0%",
      status: "Active",
      icon: ShieldCheck,
      tileClass: "tile-emerald",
    },
    {
      id: "hostel-gate",
      name: "Hostel Checkpoint #2",
      category: "Biometric Turnstiles",
      activityScore: "95.5%",
      status: "Active",
      icon: Shield,
      tileClass: "tile-indigo",
    },
    {
      id: "north-gate",
      name: "North Transit Gate",
      category: "Logistics & Faculty",
      activityScore: "84.0%",
      status: "Active",
      icon: Building,
      tileClass: "tile-sky",
    },
    {
      id: "sports-complex",
      name: "Sports Complex Gate",
      category: "Recreational Access",
      activityScore: "62.0%",
      status: "Normal",
      icon: Cpu,
      tileClass: "tile-amber",
    },
    {
      id: "campus-3d",
      name: "Campus Digital Twin 3D",
      category: "Perimeter Spatial Pulse",
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
      author: "Officer Ramesh",
      context: "at Main Gate",
      time: "09:05 AM",
      message: "Pass #GP-8041 verified for transit exit. Student exited campus.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    },
    {
      id: "disp-2",
      author: "Officer Suresh",
      context: "at Hostel Checkpoint",
      time: "08:30 AM",
      message: "Curfew return log synced. All resident students accounted for.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    },
  ];

  const securityPeers = [
    { name: "Officer Ramesh", role: "Security", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80" },
    { name: "Officer Suresh", role: "Security", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80" },
    { name: "Chief Sharma", role: "Security Chief", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" },
    { name: "Hostel Warden", role: "Warden", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80" },
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
            LEFT COLUMN: OVERVIEW & TRANSIT VELOCITY
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
                  <LogOut size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">Currently Outside</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value">{analytics?.currentlyOutside ?? 14}</span>
                  <div className="ref-trend-pill up">
                    <span>Active</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">Students off-campus with authorized passes</span>
              </div>

              <div className="ref-metric-box flush">
                <div className="ref-metric-label-row">
                  <AlertOctagon size={16} className="ref-metric-icon" />
                  <span className="ref-metric-label">Overdue Passes</span>
                </div>
                <div className="ref-metric-val-row">
                  <span className="ref-metric-value" style={{ color: analytics?.overduePasses > 0 ? "var(--warning)" : "var(--text-primary)" }}>
                    {analytics?.overduePasses ?? 0}
                  </span>
                  <div className="ref-trend-pill down">
                    <span>Monitored</span>
                  </div>
                </div>
                <span className="ref-trend-subtext">Automated alert triggered to guardian</span>
              </div>
            </div>

            {/* Contextual Statement */}
            <div className="ref-context-statement">
              <p className="ref-statement-heading">
                Main Gate Checkpoint #1 online • Scanner active.
              </p>
              <p className="ref-statement-sub">
                {analytics?.totalPasses ?? 1240} total gate departures processed with {analytics?.approvalRatePct ?? 98.4}% compliance.
              </p>
            </div>

            {/* Attention Section */}
            <div className="ref-attention-section">
              <div className="ref-attention-header">
                <span className="ref-attention-title">✦ WHAT NEEDS SECURITY ATTENTION?</span>
                <span className="ref-live-intel-badge">Live Checkpoint Intel</span>
              </div>

              <div className="ref-attention-cards-grid">
                <div className="ref-attention-card">
                  <div className="ref-attention-card-top">
                    <div className="ref-attention-card-left">
                      <QrCode size={15} className="ref-attention-card-icon" />
                      <span className="ref-attention-card-id">QR Scan Terminal</span>
                    </div>
                    <span className="ref-attention-status-pill approved">ACTIVE</span>
                  </div>
                  <p className="ref-attention-card-desc">
                    Scan digital QR code on student phone for instant gate clearance.
                  </p>
                </div>

                <div className="ref-attention-card">
                  <div className="ref-attention-card-top">
                    <div className="ref-attention-card-left">
                      <AlertOctagon size={15} className="ref-attention-card-icon" />
                      <span className="ref-attention-card-id">Late Return Alert</span>
                    </div>
                    <span className="ref-attention-status-pill due-soon">FLAGGED</span>
                  </div>
                  <p className="ref-attention-card-desc">
                    {analytics?.overduePasses ?? 0} students flagged for overdue transit return.
                  </p>
                </div>
              </div>

              {/* Security Team Avatars */}
              <div className="ref-avatars-action-row">
                <div className="ref-avatars-list">
                  {securityPeers.map((peer, i) => (
                    <div key={i} className="ref-avatar-unit">
                      <img src={peer.avatar} alt={peer.name} className="ref-user-avatar" />
                      <span className="ref-user-name">{peer.name}</span>
                    </div>
                  ))}
                  <button
                    className="ref-view-all-circle-btn"
                    onClick={() => navigate("/campus-pulse")}
                    title="View Gate Overview"
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

          {/* 2. Transit Velocity Bar Chart Card */}
          <div className="ref-card ref-chart-card">
            <div className="ref-card-header">
              <h2 className="ref-card-title">Gate Transit Velocity</h2>
              <div className="ref-pill-dropdown">
                <span>{chartTimeframe}</span>
                <ChevronDown size={14} className="ref-dropdown-caret" />
              </div>
            </div>

            <div className="ref-chart-body">
              <div className="ref-chart-kpi-block">
                <span className="ref-chart-kpi-value">98.4%</span>
                <span className="ref-chart-kpi-label">Pass Compliance</span>
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
            RIGHT COLUMN: CHECKPOINT ACTIVITY & DISPATCHES
            ============================================================ */}
        <div className="ref-side-column">

          {/* 3. Campus Activity Card */}
          <div className="ref-card ref-products-card">
            <h3 className="ref-products-title">Gate Checkpoints</h3>

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
            <h3 className="ref-comments-title">Live Gate Log</h3>

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
          GATE SCANNER INTERACTION TERMINAL
          ============================================================ */}
      <div className="ref-card" style={{ marginTop: "24px" }}>
        <h3 className="ref-card-title" style={{ marginBottom: "16px" }}>Digital Pass Validation Terminal</h3>
        
        <form onSubmit={handleScanSubmit} style={{ display: "flex", gap: "12px", maxWidth: "600px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Enter Student Roll No, Pass ID, or QR Hash..."
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "9999px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: "13px",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="ref-all-products-btn"
            style={{ width: "auto", padding: "10px 24px", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <QrCode size={15} />
            {loading ? "Verifying..." : "Verify Gate Pass"}
          </button>
        </form>

        {/* Recent Passes Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Pass ID</th>
                <th style={{ padding: "10px" }}>Student</th>
                <th style={{ padding: "10px" }}>Reason & Destination</th>
                <th style={{ padding: "10px" }}>Departure Time</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {allPasses.slice(0, 6).map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {p.id || `GP-${8000 + i}`}
                  </td>
                  <td style={{ padding: "10px", color: "var(--text-secondary)" }}>
                    {p.studentName || p.studentId || "Student"}
                  </td>
                  <td style={{ padding: "10px", color: "var(--text-muted)" }}>
                    {p.destination || p.reason || "General Transit"}
                  </td>
                  <td style={{ padding: "10px", color: "var(--text-muted)" }}>
                    {p.actualExitTime ? new Date(p.actualExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today"}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: p.status === "OVERDUE" ? "var(--warning-soft)" : "var(--success-soft)",
                        color: p.status === "OVERDUE" ? "var(--warning)" : "var(--success)",
                      }}
                    >
                      {p.status || "OUT"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

export default GateSecurity;
