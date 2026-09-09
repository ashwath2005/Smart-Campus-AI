import "./HodDashboard.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Card, StatCard, Skeleton, Button, Select, Tabs, Textarea, Badge } from "../../components/ui";
import { FileText, Check, X, Calendar, User, Paperclip, ClipboardList, ThumbsUp, ThumbsDown, Shield, Users, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export const HodDashboard = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [ods, setOds] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // pending | history | gate_passes | faculty_monitor

  // Decision Input States
  const [decisionComments, setDecisionComments] = useState({}); // { [req_id]: comment }
  const [actionLoading, setActionLoading] = useState({}); // { [req_id]: loading_boolean }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, odsRes, passesRes, facRes] = await Promise.allSettled([
        api.get("/workflows/leaves"),
        api.get("/workflows/ods"),
        api.get("/gate-pass/all-passes"),
        api.get(`/faculty-locator/search${user?.department ? `?department=${encodeURIComponent(user.department)}` : ""}`)
      ]);
      if (leavesRes.status === "fulfilled") setLeaves(leavesRes.value.data || []);
      if (odsRes.status === "fulfilled") setOds(odsRes.value.data || []);
      if (passesRes.status === "fulfilled") setGatePasses(passesRes.value.data || []);
      if (facRes.status === "fulfilled") setFaculties(facRes.value.data || []);
    } catch {
      toast.error("Failed to load department requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDecision = async (id, type, status) => {
    const comment = decisionComments[id] || "";
    setActionLoading(prev => ({ ...prev, [id]: true }));
    const loadId = toast.loading(`Submitting review decision...`);
    try {
      const endpoint = type === "leave" ? `/workflows/leaves/${id}/approve` : `/workflows/ods/${id}/approve`;
      await api.put(endpoint, {
        status: status, // Approved / Rejected
        comment: comment
      });
      toast.success(`Request ${status.toLowerCase()} successfully!`, { id: loadId });
      // Reset comments
      setDecisionComments(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to submit approval review.";
      toast.error(msg, { id: loadId });
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleGatePassAction = async (passId, action) => {
    setActionLoading(prev => ({ ...prev, [`gp-${passId}`]: true }));
    try {
      await api.post("/gate-pass/warden-action", {
        pass_id: passId,
        action: action // "approve" or "reject"
      });
      toast.success(`Gate pass ${action}d successfully!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to ${action} gate pass`);
    } finally {
      setActionLoading(prev => ({ ...prev, [`gp-${passId}`]: false }));
    }
  };

  // Compile pending and completed list
  const pendingLeaves = leaves.filter(l => l.status === "Pending HOD Approval").map(l => ({ ...l, req_type: "leave" }));
  const pendingOds = ods.filter(o => o.status === "Pending HOD Approval").map(o => ({ ...o, req_type: "od" }));
  const pendingRequests = [...pendingLeaves, ...pendingOds].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const historyLeaves = leaves.filter(l => l.status !== "Pending HOD Approval").map(l => ({ ...l, req_type: "leave" }));
  const historyOds = ods.filter(o => o.status !== "Pending HOD Approval").map(o => ({ ...o, req_type: "od" }));
  const historyRequests = [...historyLeaves, ...historyOds].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Department Gate Passes requiring approval
  const pendingGatePasses = gatePasses.filter(p => p.status === "PENDING_WARDEN_APPROVAL");

  // Stats
  const totalApproved = [...leaves, ...ods].filter(r => r.status === "Approved").length;
  const totalRejected = [...leaves, ...ods].filter(r => r.status === "Rejected").length;

  const hodTabs = [
    { id: "pending", label: `Pending Leave/OD (${pendingRequests.length})` },
    { id: "gate_passes", label: `Gate Passes (${pendingGatePasses.length})` },
    { id: "faculty_monitor", label: `Faculty Presence (${faculties.length})` },
    { id: "history", label: `Department History (${historyRequests.length})` }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="pg-hoddashboard-container"
    >
      {/* Header */}
      <div className="pg-hoddashboard-header">
        <h2 className="pg-hoddashboard-title">HOD Dashboard — {user?.department || "Campus"}</h2>
        <p className="pg-hoddashboard-subtitle">
          Final review portal for department student leave applications and On-Duty requests.
        </p>
      </div>

      {/* Stats Widgets */}
      <div className="pg-hoddashboard-stats">
        <StatCard
          label="Pending Your Approval"
          value={pendingRequests.length}
          icon={<ClipboardList size={18} />}
        />
        <StatCard
          label="Total Approved"
          value={totalApproved}
          icon={<ThumbsUp size={18} />}
        />
        <StatCard
          label="Total Rejected"
          value={totalRejected}
          icon={<ThumbsDown size={18} />}
        />
      </div>

      {/* Tabs */}
      <div className="pg-hoddashboard-tabs">
        <Tabs tabs={hodTabs} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />
      </div>

      {/* Content Panels */}
      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : activeTab === "pending" ? (
        <div className="pg-hod-request-list">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <motion.div
                key={`${req.req_type}-${req.id}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pg-hod-card"
              >
                <div className="pg-hod-card-header">
                  <div className="pg-hod-card-title-sec">
                    <div className="flex items-center gap-2">
                      <span className="pg-hod-card-name">{req.student_name}</span>
                      <span className="text-xs text-slate-500">({req.student_roll})</span>
                      <span className="pg-hod-card-type-badge">{req.req_type}</span>
                    </div>
                    <div className="pg-hod-card-meta">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {req.start_date} to {req.end_date}
                      </span>
                      <span>•</span>
                      <span>{req.req_type === "leave" ? req.leave_type : req.event_title}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${req.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {req.status}
                  </span>
                </div>

                <div className="pg-hod-card-body">
                  <strong>Reason:</strong> {req.reason}
                  {req.description && <p className="mt-1 text-slate-400">{req.description}</p>}
                  {req.supporting_document && (
                    <div>
                      <a
                        href={req.supporting_document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pg-hod-card-attachment"
                      >
                        <Paperclip size={12} />
                        <span>View Attachment Proof</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Faculty Advisor Recommendation details */}
                <div className="pg-hod-advisor-sub">
                  <div className="pg-hod-advisor-header">
                    Verified By Faculty Advisor: {req.faculty_reviewer_name}
                  </div>
                  <div className="pg-hod-advisor-comment">
                    "{req.faculty_comment || "Recommended for HOD final review approval."}"
                  </div>
                </div>

                {/* Final Decision Form Panel */}
                <div className="pg-hod-decision-panel">
                  <Textarea
                    placeholder="Enter approval feedback or rejection comment..."
                    rows={2}
                    value={decisionComments[req.id] || ""}
                    onChange={(e) => setDecisionComments(prev => ({ ...prev, [req.id]: e.target.value }))}
                  />
                  <div className="pg-hod-decision-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)" }}
                      loading={actionLoading[req.id]}
                      onClick={() => handleDecision(req.id, req.req_type, "Rejected")}
                    >
                      <X size={14} style={{ marginRight: "4px" }} /> Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionLoading[req.id]}
                      onClick={() => handleDecision(req.id, req.req_type, "Approved")}
                    >
                      <Check size={14} style={{ marginRight: "4px" }} /> Approve Request
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="pg-hod-empty card glass">
              <FileText size={36} className="text-white/20" />
              <p className="pg-hod-empty-title">All Cleared!</p>
              <p className="pg-hod-empty-subtitle">There are no pending student leaves or ODs in your queue.</p>
            </div>
          )}
        </div>
      ) : activeTab === "gate_passes" ? (
        <div className="pg-hod-request-list">
          {pendingGatePasses.length > 0 ? (
            pendingGatePasses.map((p) => (
              <div key={p.id} className="pg-hod-card" style={{ borderLeft: "4px solid #f59e0b" }}>
                <div className="pg-hod-card-header">
                  <div className="pg-hod-card-title-sec">
                    <div className="flex items-center gap-2">
                      <span className="pg-hod-card-name">{p.student?.name || `Student #${p.student_id}`}</span>
                      <span className="text-xs text-slate-500">({p.student?.roll_number || p.student?.department || "Student"})</span>
                      <span className="pg-hod-card-type-badge">{p.pass_type.toUpperCase()}</span>
                    </div>
                    <div className="pg-hod-card-meta">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        Dest: {p.destination}
                      </span>
                      <span>•</span>
                      <span>{p.parent_otp_verified ? "✓ Parent Verified" : "Pending Parent"}</span>
                    </div>
                  </div>
                  <span className="status-badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                    {p.status}
                  </span>
                </div>
                <div className="pg-hod-card-body">
                  <strong>Reason:</strong> {p.reason}
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#90929b" }}>
                    Expected Duration: {p.return_hours} hours | Leave: {p.custom_leave_time ? new Date(p.custom_leave_time).toLocaleString() : "Immediate"}
                  </div>
                </div>
                <div className="pg-hod-decision-panel" style={{ marginTop: "12px", borderTop: "1px solid #1f222e", paddingTop: "12px" }}>
                  <div className="pg-hod-decision-actions" style={{ justifyContent: "flex-end", width: "100%" }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)" }}
                      loading={actionLoading[`gp-${p.id}`]}
                      onClick={() => handleGatePassAction(p.id, "reject")}
                    >
                      <X size={14} style={{ marginRight: "4px" }} /> Reject Outpass
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionLoading[`gp-${p.id}`]}
                      onClick={() => handleGatePassAction(p.id, "approve")}
                    >
                      <Check size={14} style={{ marginRight: "4px" }} /> Approve Outpass
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="pg-hod-empty card glass">
              <Shield size={36} className="text-white/20" />
              <p className="pg-hod-empty-title">No Pending Gate Passes</p>
              <p className="pg-hod-empty-subtitle">All student weekend & day outpasses are processed or cleared.</p>
            </div>
          )}
        </div>
      ) : activeTab === "faculty_monitor" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {faculties.length > 0 ? (
            faculties.map((f) => (
              <Card key={f.id} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h4 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>{f.name}</h4>
                    <p style={{ fontSize: "12px", color: "#90929b", margin: "2px 0 0 0" }}>{f.employee_id || "Faculty"} • {f.department || "Dept"}</p>
                  </div>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: f.status === "Available" ? "rgba(16, 185, 129, 0.15)" : f.status === "Teaching" ? "rgba(59, 130, 246, 0.15)" : "rgba(239, 68, 68, 0.15)",
                      color: f.status === "Available" ? "#10b981" : f.status === "Teaching" ? "#3b82f6" : "#ef4444",
                      border: `1px solid ${f.status === "Available" ? "rgba(16, 185, 129, 0.3)" : f.status === "Teaching" ? "rgba(59, 130, 246, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                    }}
                  >
                    {f.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#90929b" }}>
                  Staff Room: <span style={{ color: "#fff" }}>{f.staff_room || "Main Staff Room"}</span>
                </div>
                {f.status_details?.current_class && f.status_details.current_class !== "N/A" && (
                  <div style={{ fontSize: "12px", color: "#3b82f6" }}>
                    Current Class: {f.status_details.current_class} ({f.status_details.classroom || f.status_details.room_number})
                  </div>
                )}
                {f.subjects && f.subjects.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                    {f.subjects.slice(0, 3).map((sub, i) => (
                      <span key={i} style={{ fontSize: "10px", padding: "2px 6px", background: "#181920", border: "1px solid #282a36", borderRadius: "4px", color: "#90929b" }}>
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))
          ) : (
            <div className="pg-hod-empty card glass" style={{ gridColumn: "1 / -1" }}>
              <Users size={36} className="text-white/20" />
              <p className="pg-hod-empty-title">No Faculty Found</p>
              <p className="pg-hod-empty-subtitle">No faculty profiles are registered under {user?.department || "this department"}.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="pg-hod-request-list">
          {historyRequests.length > 0 ? (
            historyRequests.map((req) => (
              <div key={`${req.req_type}-${req.id}`} className="pg-hod-card">
                <div className="pg-hod-card-header">
                  <div className="pg-hod-card-title-sec">
                    <div className="flex items-center gap-2">
                      <span className="pg-hod-card-name">{req.student_name}</span>
                      <span className="text-xs text-slate-500">({req.student_roll})</span>
                      <span className="pg-hod-card-type-badge">{req.req_type}</span>
                    </div>
                    <div className="pg-hod-card-meta">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {req.start_date} to {req.end_date}
                      </span>
                      <span>•</span>
                      <span>{req.req_type === "leave" ? req.leave_type : req.event_title}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${req.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {req.status}
                  </span>
                </div>

                <div className="pg-hod-card-body">
                  <strong>Reason:</strong> {req.reason}
                  {req.hod_comment && (
                    <div style={{ marginTop: "12px", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", fontSize: "12px", borderLeft: "2px solid var(--accent)" }}>
                      <strong>HOD Comment:</strong> "{req.hod_comment}"
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="pg-hod-empty card glass">
              <FileText size={36} className="text-white/20" />
              <p className="pg-hod-empty-title">No history logs</p>
              <p className="pg-hod-empty-subtitle">Past leaf/OD requests will appear here.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
