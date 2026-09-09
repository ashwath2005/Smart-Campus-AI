import "./StudentWorkflows.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Card, Button, Input, Select, Textarea, Skeleton } from "../../components/ui";
import { FileText, Plus, HelpCircle, Check, X, Calendar, MapPin, User, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export const StudentWorkflows = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("leaves"); // leaves | ods
  const [leaves, setLeaves] = useState([]);
  const [ods, setOds] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Form Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveDocument, setLeaveDocument] = useState("");
  const [leaveAdvisorId, setLeaveAdvisorId] = useState("");

  // OD Form Modal
  const [showODModal, setShowODModal] = useState(false);
  const [odTitle, setOdTitle] = useState("");
  const [odStartDate, setOdStartDate] = useState("");
  const [odEndDate, setOdEndDate] = useState("");
  const [odReason, setOdReason] = useState("");
  const [odDesc, setOdDesc] = useState("");
  const [odDocument, setOdDocument] = useState("");
  const [odAdvisorId, setOdAdvisorId] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, odsRes, advisorsRes] = await Promise.all([
        api.get("/workflows/leaves"),
        api.get("/workflows/ods"),
        api.get("/faculty")
      ]);
      setLeaves(leavesRes.data);
      setOds(odsRes.data);
      
      // Filter advisors to CSE or department of student
      const deptFaculty = advisorsRes.data.filter(
        (f) => f.department?.toUpperCase() === user?.department?.toUpperCase()
      );
      setAdvisors(deptFaculty);
      if (deptFaculty.length > 0) {
        setLeaveAdvisorId(deptFaculty[0].id);
        setOdAdvisorId(deptFaculty[0].id);
      }
    } catch {
      toast.error("Failed to load request history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason) {
      toast.error("All mandatory fields must be completed.");
      return;
    }
    setSubmitLoading(true);
    try {
      await api.post("/workflows/leaves", {
        leave_type: leaveType,
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        reason: leaveReason,
        supporting_document: leaveDocument || null,
        advisor_id: parseInt(leaveAdvisorId) || null
      });
      toast.success("Leave request submitted successfully!");
      setShowLeaveModal(false);
      // Reset
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
      setLeaveDocument("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit leave request.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApplyOD = async (e) => {
    e.preventDefault();
    if (!odTitle || !odStartDate || !odEndDate || !odReason) {
      toast.error("All mandatory fields must be completed.");
      return;
    }
    setSubmitLoading(true);
    try {
      await api.post("/workflows/ods", {
        event_title: odTitle,
        start_date: odStartDate,
        end_date: odEndDate,
        reason: odReason,
        description: odDesc || null,
        supporting_document: odDocument || null,
        advisor_id: parseInt(odAdvisorId) || null
      });
      toast.success("On-Duty request submitted successfully!");
      setShowODModal(false);
      // Reset
      setOdTitle("");
      setOdStartDate("");
      setOdEndDate("");
      setOdReason("");
      setOdDesc("");
      setOdDocument("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit OD request.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="pg-workflows-container"
    >
      <div className="pg-workflows-header">
        <div>
          <h2 className="pg-workflows-title">Workflow Management</h2>
          <p className="pg-workflows-subtitle">
            Apply for Leaves or On-Duty approvals and track real-time verification status.
          </p>
        </div>
        <div className="pg-workflows-action-row">
          <Button variant="outline" size="sm" onClick={() => setShowLeaveModal(true)}>
            <Plus size={16} />
            <span>Apply Leave</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowODModal(true)}>
            <Plus size={16} />
            <span>Request On-Duty</span>
          </Button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="pg-workflows-tabs-nav">
        <button
          onClick={() => setActiveTab("leaves")}
          className={`pg-workflows-tab-btn ${activeTab === "leaves" ? "active" : ""}`}
        >
          Leave Applications ({leaves.length})
        </button>
        <button
          onClick={() => setActiveTab("ods")}
          className={`pg-workflows-tab-btn ${activeTab === "ods" ? "active" : ""}`}
        >
          On-Duty Requests ({ods.length})
        </button>
      </div>

      {loading ? (
        <Skeleton variant="card" count={2} />
      ) : activeTab === "leaves" ? (
        <div className="pg-workflows-list">
          {leaves.length > 0 ? (
            leaves.map((l) => (
              <div key={l.id} className="pg-workflow-card">
                <div className="pg-workflow-card-header">
                  <div>
                    <h3 className="pg-workflow-card-title">{l.leave_type}</h3>
                    <div className="pg-workflow-card-meta">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {l.start_date} to {l.end_date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User size={13} />
                        Advisor: {l.advisor_name}
                      </span>
                    </div>
                  </div>
                  <span className={`status-badge ${l.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {l.status}
                  </span>
                </div>
                <div className="pg-workflow-card-body">
                  <strong>Reason:</strong> {l.reason}
                  {l.supporting_document && (
                    <a
                      href={l.supporting_document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pg-workflow-card-attachment"
                    >
                      <Paperclip size={12} />
                      <span>View Attachment</span>
                    </a>
                  )}
                </div>

                {/* Real-time Timeline */}
                <div className="pg-workflow-timeline">
                  <h4 className="pg-workflow-timeline-title">Approval Path Timeline</h4>
                  
                  {/* Step 1: Submission */}
                  <div className="pg-workflow-timeline-item">
                    <div className="pg-workflow-timeline-icon">
                      <Check size={12} className="text-green-500" />
                    </div>
                    <div className="pg-workflow-timeline-content">
                      <span className="pg-workflow-timeline-actor">Applied</span>
                      <span className="pg-workflow-timeline-action">Request filed successfully.</span>
                      <span className="pg-workflow-timeline-time">{l.created_at}</span>
                    </div>
                  </div>

                  {/* Step 2: Faculty Advisor Review */}
                  {l.status !== "Pending Faculty Review" || l.faculty_reviewer_name !== "N/A" ? (
                    <div className="pg-workflow-timeline-item">
                      <div className="pg-workflow-timeline-icon">
                        {l.status === "Rejected" && !l.hod_reviewed_at ? (
                          <X size={12} className="text-red-500" />
                        ) : (
                          <Check size={12} className="text-green-500" />
                        )}
                      </div>
                      <div className="pg-workflow-timeline-content">
                        <span className="pg-workflow-timeline-actor">
                          Faculty Advisor: {l.faculty_reviewer_name || l.advisor_name}
                        </span>
                        <span className="pg-workflow-timeline-action">
                          {l.status === "Rejected" && !l.hod_reviewed_at ? "Rejected request." : "Recommended & Forwarded to HOD."}
                        </span>
                        <span className="pg-workflow-timeline-time">{l.faculty_reviewed_at}</span>
                        {l.faculty_comment && (
                          <p className="pg-workflow-timeline-comment">"{l.faculty_comment}"</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pg-workflow-timeline-item">
                      <div className="pg-workflow-timeline-icon">
                        <HelpCircle size={12} className="text-yellow-500" />
                      </div>
                      <div className="pg-workflow-timeline-content">
                        <span className="pg-workflow-timeline-actor">Faculty Advisor: {l.advisor_name}</span>
                        <span className="pg-workflow-timeline-action">Pending advisor verification.</span>
                      </div>
                    </div>
                  )}

                  {/* Step 3: HOD Decision */}
                  {l.status === "Approved" || l.status === "Rejected" ? (
                    l.hod_reviewer_name !== "N/A" && (
                      <div className="pg-workflow-timeline-item">
                        <div className="pg-workflow-timeline-icon">
                          {l.status === "Approved" ? (
                            <Check size={12} className="text-green-500" />
                          ) : (
                            <X size={12} className="text-red-500" />
                          )}
                        </div>
                        <div className="pg-workflow-timeline-content">
                          <span className="pg-workflow-timeline-actor">HOD: {l.hod_reviewer_name}</span>
                          <span className="pg-workflow-timeline-action">{l.status} leave request.</span>
                          <span className="pg-workflow-timeline-time">{l.hod_reviewed_at}</span>
                          {l.hod_comment && (
                            <p className="pg-workflow-timeline-comment">"{l.hod_comment}"</p>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    l.status === "Pending HOD Approval" && (
                      <div className="pg-workflow-timeline-item">
                        <div className="pg-workflow-timeline-icon">
                          <HelpCircle size={12} className="text-blue-500" />
                        </div>
                        <div className="pg-workflow-timeline-content">
                          <span className="pg-workflow-timeline-actor">Head of Department</span>
                          <span className="pg-workflow-timeline-action">Pending department head final approval.</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="pg-workflows-empty">
              <FileText size={36} className="text-white/20" />
              <p className="pg-workflows-empty-title">No leave applications</p>
              <p className="pg-workflows-empty-subtitle">Your filed leave requests will be catalogued here.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="pg-workflows-list">
          {ods.length > 0 ? (
            ods.map((o) => (
              <div key={o.id} className="pg-workflow-card">
                <div className="pg-workflow-card-header">
                  <div>
                    <h3 className="pg-workflow-card-title">{o.event_title}</h3>
                    <div className="pg-workflow-card-meta">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {o.start_date} to {o.end_date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User size={13} />
                        Advisor: {o.advisor_name}
                      </span>
                    </div>
                  </div>
                  <span className={`status-badge ${o.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {o.status}
                  </span>
                </div>
                <div className="pg-workflow-card-body">
                  <strong>Activity/Reason:</strong> {o.reason}
                  {o.description && <p className="mt-1 text-slate-400">{o.description}</p>}
                  {o.supporting_document && (
                    <a
                      href={o.supporting_document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pg-workflow-card-attachment"
                    >
                      <Paperclip size={12} />
                      <span>View Supporting Proof</span>
                    </a>
                  )}
                </div>

                {/* OD Action Path Timeline */}
                <div className="pg-workflow-timeline">
                  <h4 className="pg-workflow-timeline-title">Approval Path Timeline</h4>
                  
                  {/* Step 1: Submission */}
                  <div className="pg-workflow-timeline-item">
                    <div className="pg-workflow-timeline-icon">
                      <Check size={12} className="text-green-500" />
                    </div>
                    <div className="pg-workflow-timeline-content">
                      <span className="pg-workflow-timeline-actor">Applied</span>
                      <span className="pg-workflow-timeline-action">Request filed successfully.</span>
                      <span className="pg-workflow-timeline-time">{o.created_at}</span>
                    </div>
                  </div>

                  {/* Step 2: Faculty Advisor Review */}
                  {o.status !== "Pending Faculty Review" || o.faculty_reviewer_name !== "N/A" ? (
                    <div className="pg-workflow-timeline-item">
                      <div className="pg-workflow-timeline-icon">
                        {o.status === "Rejected" && !o.hod_reviewed_at ? (
                          <X size={12} className="text-red-500" />
                        ) : (
                          <Check size={12} className="text-green-500" />
                        )}
                      </div>
                      <div className="pg-workflow-timeline-content">
                        <span className="pg-workflow-timeline-actor">
                          Faculty Advisor: {o.faculty_reviewer_name || o.advisor_name}
                        </span>
                        <span className="pg-workflow-timeline-action">
                          {o.status === "Rejected" && !o.hod_reviewed_at ? "Rejected OD request." : "Recommended & Forwarded to HOD."}
                        </span>
                        <span className="pg-workflow-timeline-time">{o.faculty_reviewed_at}</span>
                        {o.faculty_comment && (
                          <p className="pg-workflow-timeline-comment">"{o.faculty_comment}"</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pg-workflow-timeline-item">
                      <div className="pg-workflow-timeline-icon">
                        <HelpCircle size={12} className="text-yellow-500" />
                      </div>
                      <div className="pg-workflow-timeline-content">
                        <span className="pg-workflow-timeline-actor">Faculty Advisor: {o.advisor_name}</span>
                        <span className="pg-workflow-timeline-action">Pending advisor verification.</span>
                      </div>
                    </div>
                  )}

                  {/* Step 3: HOD Decision */}
                  {o.status === "Approved" || o.status === "Rejected" ? (
                    o.hod_reviewer_name !== "N/A" && (
                      <div className="pg-workflow-timeline-item">
                        <div className="pg-workflow-timeline-icon">
                          {o.status === "Approved" ? (
                            <Check size={12} className="text-green-500" />
                          ) : (
                            <X size={12} className="text-red-500" />
                          )}
                        </div>
                        <div className="pg-workflow-timeline-content">
                          <span className="pg-workflow-timeline-actor">HOD: {o.hod_reviewer_name}</span>
                          <span className="pg-workflow-timeline-action">{o.status} OD request.</span>
                          <span className="pg-workflow-timeline-time">{o.hod_reviewed_at}</span>
                          {o.hod_comment && (
                            <p className="pg-workflow-timeline-comment">"{o.hod_comment}"</p>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    o.status === "Pending HOD Approval" && (
                      <div className="pg-workflow-timeline-item">
                        <div className="pg-workflow-timeline-icon">
                          <HelpCircle size={12} className="text-blue-500" />
                        </div>
                        <div className="pg-workflow-timeline-content">
                          <span className="pg-workflow-timeline-actor">Head of Department</span>
                          <span className="pg-workflow-timeline-action">Pending department head final approval.</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="pg-workflows-empty">
              <FileText size={36} className="text-white/20" />
              <p className="pg-workflows-empty-title">No On-Duty requests</p>
              <p className="pg-workflows-empty-subtitle">Your filed OD requests will be catalogued here.</p>
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <div className="workflow-modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="workflow-modal-card"
            >
              <h3 className="workflow-modal-title">Apply for Student Leave</h3>
              <p className="workflow-modal-desc">
                Submit leave details. It will be sent to your advisor, then forwarded to HOD.
              </p>
              <form onSubmit={handleApplyLeave} className="workflow-modal-form">
                <Select
                  label="Leave Type"
                  options={[
                    { value: "Casual Leave", label: "Casual Leave" },
                    { value: "Medical Leave", label: "Medical/Sick Leave" },
                    { value: "Duty Leave", label: "Duty Leave" },
                    { value: "Sabbatical / Short Leave", label: "Short Leave" }
                  ]}
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                />
                <div className="workflow-form-row">
                  <Input
                    label="From Date"
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    required
                  />
                  <Input
                    label="To Date"
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    required
                  />
                </div>
                <Select
                  label="Select Reviewer (Faculty Advisor / Tutor)"
                  options={advisors.map((adv) => ({
                    value: adv.id.toString(),
                    label: `${adv.name} (${adv.employee_id || "Faculty"})`
                  }))}
                  value={leaveAdvisorId}
                  onChange={(e) => setLeaveAdvisorId(e.target.value)}
                />
                <Textarea
                  label="Reason for Leave"
                  rows={3}
                  placeholder="Explain why you need leave..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  required
                />
                <Input
                  label="Supporting Document Link (Optional)"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={leaveDocument}
                  onChange={(e) => setLeaveDocument(e.target.value)}
                />
                <div className="workflow-form-actions">
                  <Button variant="ghost" type="button" onClick={() => setShowLeaveModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" loading={submitLoading}>
                    Submit Request
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request OD Modal */}
      <AnimatePresence>
        {showODModal && (
          <div className="workflow-modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="workflow-modal-card"
            >
              <h3 className="workflow-modal-title">Request On-Duty (OD)</h3>
              <p className="workflow-modal-desc">
                File On-Duty details for attending events, competitions, or symposiums.
              </p>
              <form onSubmit={handleApplyOD} className="workflow-modal-form">
                <Input
                  label="Activity / Event Title"
                  placeholder="E.g. Inter-college Hackathon, Cultural Contest"
                  value={odTitle}
                  onChange={(e) => setOdTitle(e.target.value)}
                  required
                />
                <div className="workflow-form-row">
                  <Input
                    label="From Date"
                    type="date"
                    value={odStartDate}
                    onChange={(e) => setOdStartDate(e.target.value)}
                    required
                  />
                  <Input
                    label="To Date"
                    type="date"
                    value={odEndDate}
                    onChange={(e) => setOdEndDate(e.target.value)}
                    required
                  />
                </div>
                <Select
                  label="Select Reviewer (Faculty Advisor)"
                  options={advisors.map((adv) => ({
                    value: adv.id.toString(),
                    label: `${adv.name} (${adv.employee_id || "Faculty"})`
                  }))}
                  value={odAdvisorId}
                  onChange={(e) => setOdAdvisorId(e.target.value)}
                />
                <Textarea
                  label="Activity Details / Purpose"
                  rows={2}
                  placeholder="Attending national programming competition representing the college..."
                  value={odReason}
                  onChange={(e) => setOdReason(e.target.value)}
                  required
                />
                <Textarea
                  label="Brief Description (Optional)"
                  rows={2}
                  placeholder="Detail classes that will be missed or other comments..."
                  value={odDesc}
                  onChange={(e) => setOdDesc(e.target.value)}
                />
                <Input
                  label="Poster / Proof Document Link (Optional)"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={odDocument}
                  onChange={(e) => setOdDocument(e.target.value)}
                />
                <div className="workflow-form-actions">
                  <Button variant="ghost" type="button" onClick={() => setShowODModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" loading={submitLoading}>
                    Submit Request
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
