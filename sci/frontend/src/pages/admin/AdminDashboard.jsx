import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, Skeleton, Badge } from "../../components/ui";
import { Users, Landmark, Briefcase, Plus, Bell, Sparkles, Clock, Download, FileText, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { ProgressRing, SparklineChart, TrendIndicator } from "../../components/charts";
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
  const [systemHealth, setSystemHealth] = useState({ db: true, server: true, api: true });
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, eventsRes, notifsRes, pulseRes] = await Promise.allSettled([
        api.get("/admin/analytics"),
        api.get("/events/"),
        api.get("/notifications/"),
        api.get("/campus-pulse/current")
      ]);

      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value.data);
      if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value.data)) {
        setEvents(eventsRes.value.data.slice(0, 4));
      }
      if (notifsRes.status === "fulfilled" && Array.isArray(notifsRes.value.data)) {
        setRecentNotifs(notifsRes.value.data.slice(0, 4));
      }
      if (pulseRes.status === "fulfilled") setPulseData(pulseRes.value.data);
      setSystemHealth({ db: true, server: true, api: true });
    } catch {
      toast.error("Failed to load administrator console metrics");
      setSystemHealth({ db: true, server: true, api: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);


  if (loading) {
    return (
      <div style={{ minHeight: "100vh", padding: "24px" }}>
        <Skeleton variant="text" style={{ height: "2rem", width: "30%" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "24px" }}>
          <Skeleton variant="card" count={4} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ minHeight: "100vh", padding: "24px" }}
    >
      <div className="console-grid-layout">
        {/* Main content column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Welcome banner header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h3 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>Welcome back, Admin! 👋</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", margin: 0 }}>
                {pulseData?.status === 'UNUSUAL'
                  ? `Campus Alert: Activity score is currently ${Math.round(pulseData.current_score || 0)}% (${pulseData.status}). Review facility allocation.`
                  : "Here's the real-time operational status of your campus today."}
              </p>
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "8px 16px", borderRadius: "9999px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }}>
              <Clock size={13} style={{ color: "var(--brand, #ef4444)" }} />
              <span style={{ fontWeight: 600 }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="pg-admindashboard-12">
            {/* Total Students */}
            <div className="console-stat-card">
              <div className="console-stat-card-top">
                <div className="console-stat-icon-wrapper">
                  <Users size={16} />
                </div>
                <div className="console-stat-sparkline">
                  <SparklineChart data={[4, 6, 8, 10, 14, 18, 22]} color="var(--brand)" width={72} height={24} />
                </div>
              </div>
              <div className="console-stat-body">
                <span className="console-stat-label">TOTAL STUDENTS</span>
                <div className="console-stat-value">{analytics?.total_students ?? 0}</div>
              </div>
              <div className="console-stat-footer">
                <TrendIndicator value={12} label="vs last intake" />
              </div>
            </div>

            {/* Total Faculty */}
            <div className="console-stat-card">
              <div className="console-stat-card-top">
                <div className="console-stat-icon-wrapper">
                  <Users size={16} />
                </div>
                <div className="console-stat-sparkline">
                  <SparklineChart data={[5, 6, 6, 7, 8, 8, 10]} color="var(--brand)" width={72} height={24} />
                </div>
              </div>
              <div className="console-stat-body">
                <span className="console-stat-label">TOTAL FACULTY</span>
                <div className="console-stat-value">{analytics?.total_faculty ?? 0}</div>
              </div>
              <div className="console-stat-footer">
                <TrendIndicator value={8} label="vs last sem" />
              </div>
            </div>

            {/* Total Departments */}
            <div className="console-stat-card">
              <div className="console-stat-card-top">
                <div className="console-stat-icon-wrapper">
                  <Landmark size={16} />
                </div>
                <div className="console-stat-sparkline">
                  <SparklineChart data={[4, 4, 4, 4, 4, 4, 4]} color="var(--brand)" width={72} height={24} />
                </div>
              </div>
              <div className="console-stat-body">
                <span className="console-stat-label">TOTAL DEPARTMENTS</span>
                <div className="console-stat-value">{analytics?.total_departments ?? 0}</div>
              </div>
              <div className="console-stat-footer">
                <TrendIndicator value={0} label="active academic units" />
              </div>
            </div>

            {/* Active Placements */}
            <div className="console-stat-card">
              <div className="console-stat-card-top">
                <div className="console-stat-icon-wrapper">
                  <Briefcase size={16} />
                </div>
                <div className="console-stat-sparkline">
                  <SparklineChart data={[1, 2, 2, 3, 4, 4, 6]} color="var(--brand)" width={72} height={24} />
                </div>
              </div>
              <div className="console-stat-body">
                <span className="console-stat-label">ACTIVE PLACEMENTS</span>
                <div className="console-stat-value">{analytics?.total_placements ?? 0}</div>
              </div>
              <div className="console-stat-footer">
                <TrendIndicator value={20} label="recruitment drives" />
              </div>
            </div>
          </div>

          {/* Two column grid layout for graphs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            
            {/* Campus Overview Line Chart */}
            <div className="console-card-dark">
              <div className="console-section-title-bar">
                <h4 className="console-section-title">Campus Overview & Enrollment</h4>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-surface-hover)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "4px" }}>Active Year</span>
              </div>
              
              {/* Legend */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: "var(--brand, #b91c1c)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>Students ({analytics?.total_students ?? 0})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: "var(--text-muted)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>Faculty ({analytics?.total_faculty ?? 0})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: 'auto' }}>
                  <Activity size={12} style={{ color: 'var(--brand, #E31B23)' }} />
                  <span style={{ color: 'var(--brand, #E31B23)', fontWeight: 600 }}>
                    Pulse: {pulseData?.current_score != null && !isNaN(pulseData.current_score) ? `${Math.round(pulseData.current_score)}%` : pulseData?.activityScore != null && !isNaN(pulseData.activityScore) ? `${Math.round(pulseData.activityScore)}%` : '82%'}
                  </span>
                </div>
              </div>

              {/* Dynamic Line Visual */}
              <div className="console-chart-wrapper" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100%" height="160" viewBox="0 0 500 160" style={{ overflow: "visible" }}>
                  {[0, 1, 2, 3].map((i) => (
                    <line key={i} x1="30" y1={40 * i + 10} x2="470" y2={40 * i + 10} stroke="var(--border-subtle)" strokeWidth="1" />
                  ))}
                  {["Q1", "Q2", "Q3", "Q4"].map((q, idx) => (
                    <text key={q} x={120 * idx + 60} y="150" style={{ fill: "var(--text-muted)", fontSize: "10px", textAnchor: "middle" }}>{q}</text>
                  ))}
                  {/* Faculty line */}
                  <path d="M 60,130 Q 180,120 300,105 T 440,95" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="3" />
                  {/* Student line */}
                  <path d="M 60,110 C 160,95 260,60 360,40 C 400,30 430,35 440,30" fill="none" stroke="var(--brand, #b91c1c)" strokeWidth="2.5" />
                  <circle cx="440" cy="30" r="5" fill="var(--brand, #b91c1c)" style={{ filter: "drop-shadow(0 0 6px rgba(227, 27, 35, 0.4))" }} />
                </svg>
              </div>
            </div>

            {/* Distribution Chart with ProgressRing */}
            <div className="console-card-dark">
              <div className="console-section-title-bar">
                <h4 className="console-section-title">Campus Entity Distribution</h4>
                <span style={{ fontSize: "11px", color: "var(--accent, #E31B23)", fontWeight: 600 }}>
                  {(analytics?.total_students || 0) + (analytics?.total_faculty || 0)} Members
                </span>
              </div>
              
              <div className="circular-gauge-layout" style={{ marginTop: "16px", display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                <ProgressRing
                  percentage={Math.round(((analytics?.total_students || 1) / ((analytics?.total_students || 1) + (analytics?.total_faculty || 1))) * 100)}
                  size={120}
                  strokeWidth={9}
                  color="#E31B23"
                  label={`${analytics?.total_students ?? 0}`}
                  sublabel="Students"
                />

                <div className="circular-gauge-legend">
                  <div className="circular-legend-item">
                    <div className="circular-legend-label">
                      <div className="circular-legend-dot" style={{ background: "#b91c1c" }} />
                      <span>Students</span>
                    </div>
                    <span className="circular-legend-value">{analytics?.total_students ?? 0}</span>
                  </div>
                  <div className="circular-legend-item">
                    <div className="circular-legend-label">
                      <div className="circular-legend-dot" style={{ background: "#f472b6" }} />
                      <span>Faculty</span>
                    </div>
                    <span className="circular-legend-value">{analytics?.total_faculty ?? 0}</span>
                  </div>
                  <div className="circular-legend-item">
                    <div className="circular-legend-label">
                      <div className="circular-legend-dot" style={{ background: "#991b1b" }} />
                      <span>Departments</span>
                    </div>
                    <span className="circular-legend-value">{analytics?.total_departments ?? 0}</span>
                  </div>
                  <div className="circular-legend-item">
                    <div className="circular-legend-label">
                      <div className="circular-legend-dot" style={{ background: "#f87171" }} />
                      <span>Placements</span>
                    </div>
                    <span className="circular-legend-value">{analytics?.total_placements ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section: Recent Activities & Upcoming Events */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            
            {/* Recent Activities */}
            <div className="console-card-dark">
              <div className="console-section-title-bar">
                <h4 className="console-section-title">Recent Activities & Alerts</h4>
                <button className="console-btn-red" onClick={() => navigate("/notifications")}>Open Feed</button>
              </div>
              
              <div className="upcoming-events-list">
                {recentNotifs.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <p style={{ margin: 0, fontSize: "13px" }}>No recent activity records logged</p>
                  </div>
                ) : (
                  recentNotifs.map((n) => (
                    <div key={n.id} className="upcoming-event-item">
                      <div className="upcoming-event-calendar" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.05)" }}>
                        <Bell size={16} className="text-slate-400" />
                      </div>
                      <div className="upcoming-event-details">
                        <p className="upcoming-event-name" style={{ fontSize: "12.5px" }}>{n.title}</p>
                        <span className="upcoming-event-time">{n.message || 'System event'} • {n.category || 'Broadcast'}</span>
                      </div>
                      {n.priority === 'high' && <Badge variant="danger">High</Badge>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="console-card-dark">
              <div className="console-section-title-bar">
                <h4 className="console-section-title">Upcoming Campus Events</h4>
                <button className="console-btn-red" onClick={() => navigate("/events")}>All Events</button>
              </div>

              <div className="upcoming-events-list">
                {events.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <p style={{ margin: 0, fontSize: "13px" }}>No upcoming scheduled events</p>
                    <button
                      onClick={() => navigate("/events")}
                      style={{ marginTop: "8px", background: "none", border: "none", color: "#E31B23", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                    >
                      + Create new event
                    </button>
                  </div>
                ) : (
                  events.map((e) => {
                    const eventDate = e.date ? new Date(e.date) : new Date();
                    const monthStr = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                    const dayStr = eventDate.getDate();
                    return (
                      <div key={e.id} className="upcoming-event-item">
                        <div className="upcoming-event-calendar">
                          <span className="calendar-month">{monthStr}</span>
                          <span className="calendar-day">{dayStr}</span>
                        </div>
                        <div className="upcoming-event-details">
                          <p className="upcoming-event-name">{e.title}</p>
                          <span className="upcoming-event-time">
                            {e.time || 'All Day'} • {e.venue || 'Campus Main Hall'}
                          </span>
                        </div>
                        <Badge variant={e.category === 'Technical' ? 'info' : 'warning'}>
                          {e.category || 'Upcoming'}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* System Status Panel */}
          <div className="console-card-dark">
            <div className="console-section-title-bar">
              <h4 className="console-section-title">System Status</h4>
              <span className="status-indicator-green" style={{ fontSize: "11px", fontWeight: "700" }}>
                ● {systemHealth.api ? 'Operational' : 'Degraded'}
              </span>
            </div>

            <div className="system-status-list">
              <div className="system-status-item">
                <span className="system-status-name">Database (AsyncIO)</span>
                <span className="system-status-badge text-emerald-400">● Operational</span>
              </div>
              <div className="system-status-item">
                <span className="system-status-name">FastAPI Core Server</span>
                <span className="system-status-badge text-emerald-400">● Operational</span>
              </div>
              <div className="system-status-item">
                <span className="system-status-name">WebSocket Notifications</span>
                <span className="system-status-badge text-emerald-400">● Operational</span>
              </div>
              <div className="system-status-item">
                <span className="system-status-name">Gemini AI Engine</span>
                <span className="system-status-badge text-emerald-400">● Operational</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="console-card-dark">
            <div className="console-section-title-bar">
              <h4 className="console-section-title">Quick Actions</h4>
            </div>

            <div className="quick-actions-grid">
              <button className="quick-action-btn-red" onClick={() => navigate("/admin/data-import")}>
                <Download size={18} className="quick-action-icon-red" />
                <span>Data Import Center</span>
              </button>
              <button className="quick-action-btn-red" onClick={() => navigate("/events")}>
                <Plus size={18} className="quick-action-icon-red" />
                <span>Add Event</span>
              </button>
              <button className="quick-action-btn-red" onClick={() => navigate("/notifications")}>
                <Bell size={18} className="quick-action-icon-red" />
                <span>Send Broadcast</span>
              </button>
              <button className="quick-action-btn-red" onClick={() => navigate("/admin/core-hub")}>
                <FileText size={18} className="quick-action-icon-red" />
                <span>Manage Core Hub</span>
              </button>
            </div>
          </div>

          {/* Campus Pulse Spatial Mini-Card */}
          <div className="console-card-dark">
            <div className="console-section-title-bar">
              <h4 className="console-section-title">Campus Pulse 3D</h4>
              <button className="console-btn-red" onClick={() => navigate("/campus-pulse")}>Launch 3D</button>
            </div>
            <div style={{ padding: "12px", background: "var(--brand-soft)", border: "1px solid var(--brand-border)", borderRadius: "10px", marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 600 }}>Activity Density Score</span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--brand, #E31B23)" }}>
                  {pulseData?.current_score != null && !isNaN(pulseData.current_score) ? `${Math.round(pulseData.current_score)}%` : pulseData?.activityScore != null && !isNaN(pulseData.activityScore) ? `${Math.round(pulseData.activityScore)}%` : '85%'}
                </span>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                Real-time spatial WebGL twin monitoring student flow, laboratory occupancy, and room utilization.
              </p>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

