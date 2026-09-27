import "./Assignments.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Card, Skeleton, Badge, Button, Modal, Input, Tabs } from "../../components/ui";
import { FileText, Calendar, BookOpen, CheckCircle2, Award, MessageSquare, Clock, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FacultyAssignments } from "../faculty/FacultyAssignments";

export const Assignments = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: "2rem" }}>
        <Skeleton variant="card" count={2} />
      </div>
    );
  }

  const role = (user?.role || "").toLowerCase();
  const isFacultyOrAdmin = role === "faculty" || role === "admin" || role === "hod";

  // If Faculty, render Faculty Assignment Command Center
  if (isFacultyOrAdmin) {
    return <FacultyAssignments />;
  }

  // Otherwise, render Student Assignment View
  return <StudentAssignmentsView />;
};

const StudentAssignmentsView = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await api.get("/assignments");
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const openSubmitModal = (assign) => {
    setSelectedAssignment(assign);
    setSubmitUrl(assign.file_url || "");
    setIsSubmitOpen(true);
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !submitUrl.trim()) return;
    setSubmitLoading(true);
    try {
      await api.post(`/assignments/${selectedAssignment.id}/submit`, {
        file_url: submitUrl.trim(),
      });
      toast.success("Assignment solution submitted successfully!");
      setIsSubmitOpen(false);
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Error submitting assignment");
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatus = (item) => {
    if (item.grade || item.status === "graded") return "graded";
    if (item.submitted || item.status === "submitted" || item.status === "late") return "submitted";
    return "pending";
  };

  const filtered = assignments.filter((item) => {
    const status = getStatus(item);
    if (activeTab === "pending") return status === "pending";
    if (activeTab === "submitted") return status === "submitted" || status === "graded";
    return true;
  });

  const pendingCount = assignments.filter((a) => getStatus(a) === "pending").length;
  const submittedCount = assignments.filter((a) => getStatus(a) === "submitted" || getStatus(a) === "graded").length;

  const assignmentTabs = [
    { id: "all", label: `All Coursework (${assignments.length})` },
    { id: "pending", label: `Pending (${pendingCount})` },
    { id: "submitted", label: `Submitted & Graded (${submittedCount})` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="pg-assignments-1"
    >
      <div className="pg-assignments-2">
        <h2 className="pg-assignments-3">Academic Assignments & Coursework</h2>
        <p className="pg-assignments-4">
          View assigned coursework, submit solutions, check deadlines, and inspect faculty feedback and grades
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="pg-assignments-5">
        <Tabs tabs={assignmentTabs} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="pg-assignments-6">
          <Skeleton variant="card" count={2} />
        </div>
      ) : filtered.length > 0 ? (
        <div className="pg-assignments-6">
          {filtered.map((item, idx) => {
            const status = getStatus(item);
            const isGraded = status === "graded";
            const isSubmitted = status === "submitted" || isGraded;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03, type: "spring", stiffness: 350, damping: 25 }}
                className="pg-assignments-card-wrapper"
              >
                <Card className="pg-assignments-7">
                  <div className="pg-assignments-body">
                    <div className="pg-assignments-8">
                      <div className="pg-assignments-9">
                        <FileText size={16} className="pg-assignments-10" />
                        <h3 className="pg-assignments-11">{item.title}</h3>
                      </div>
                      <Badge variant={isGraded ? "success" : isSubmitted ? "info" : "warning"}>
                        {isGraded ? "✓ Graded" : isSubmitted ? "Submitted" : "Pending"}
                      </Badge>
                    </div>

                    <span className="pg-assignments-12">{item.subject}</span>
                    <p className="pg-assignments-13">{item.description || "No specific instructions provided."}</p>

                    {/* Graded Feedback Card */}
                    {isGraded && (
                      <div
                        style={{
                          background: "rgba(16, 185, 129, 0.08)",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          marginBottom: "1rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase" }}>
                            <Award size={12} style={{ display: "inline", marginRight: 4 }} />
                            Grade Awarded
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#34d399" }}>
                            {item.grade} {item.max_marks ? `/ ${item.max_marks}` : ""}
                          </span>
                        </div>
                        {item.remarks && (
                          <p style={{ margin: 0, fontSize: 12, color: "#cbd5e1", fontStyle: "italic" }}>
                            "{item.remarks}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submitted Work Link */}
                    {isSubmitted && item.file_url && (
                      <div style={{ marginBottom: "0.75rem", fontSize: 12, color: "var(--text-secondary)" }}>
                        <span>Your submission: </span>
                        <a
                          href={item.file_url.startsWith("http") ? item.file_url : `https://${item.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#38bdf8", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 3 }}
                        >
                          <ExternalLink size={11} /> View submitted solution
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pg-assignments-14">
                    <div className="pg-assignments-15">
                      <Calendar size={13} />
                      <span>Due: {item.due_date} {item.due_time ? `at ${item.due_time}` : ""}</span>
                    </div>

                    {!isSubmitted ? (
                      <Button variant="primary" size="sm" onClick={() => openSubmitModal(item)}>
                        Submit Solution
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => openSubmitModal(item)}>
                        {isGraded ? "Resubmit Work" : "Update Solution"}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="pg-assignments-17">
          <BookOpen size={36} className="pg-assignments-18" />
          <p className="pg-assignments-19">No assignments found matching this filter.</p>
        </Card>
      )}

      {/* Submit Modal */}
      <Modal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} title="Submit Assignment Solution">
        <form onSubmit={handleAssignmentSubmit} className="pg-assignments-20">
          <p className="pg-assignments-21">
            Submit your solution file link (Google Drive, OneDrive, GitHub repo, or cloud document) for{" "}
            <strong>{selectedAssignment?.title}</strong>:
          </p>
          <Input
            label="Solution Link or Document URL"
            placeholder="https://drive.google.com/... or https://github.com/..."
            value={submitUrl}
            onChange={(e) => setSubmitUrl(e.target.value)}
            disabled={submitLoading}
            required
          />
          <Button type="submit" variant="primary" loading={submitLoading} className="pg-assignments-22">
            Submit Solution
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Assignments;
