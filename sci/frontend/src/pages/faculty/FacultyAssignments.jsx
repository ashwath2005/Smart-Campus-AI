import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";
import { Skeleton, Modal, Button } from "../../components/ui";
import {
  BookOpen,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  Users,
  Award,
  AlertCircle,
  Eye,
  Filter,
  Check,
  Send,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import "./FacultyAssignments.css";

export const FacultyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState({
    subjects: [],
    departments: ["CSE", "ECE", "MECH", "CIVIL", "IT"],
    years: ["I", "II", "III", "IV"],
    sections: ["A", "B", "C", "All"],
    stats: {
      total_assignments: 0,
      active_assignments: 0,
      draft_assignments: 0,
      total_submissions: 0,
      pending_reviews: 0,
      graded_submissions: 0,
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("published"); // 'published' | 'drafts' | 'submissions' | 'closed'

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Create / Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDept, setFormDept] = useState("CSE");
  const [formYear, setFormYear] = useState("II");
  const [formSection, setFormSection] = useState("A");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDueTime, setFormDueTime] = useState("23:59");
  const [formMaxMarks, setFormMaxMarks] = useState("100");
  const [formAttachments, setFormAttachments] = useState("");

  // Submissions Modal State
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradingState, setGradingState] = useState({}); // { [subId]: { grade, remarks } }
  const [savingGradeId, setSavingGradeId] = useState(null);

  // Details Modal
  const [viewingDetailsFor, setViewingDetailsFor] = useState(null);

  const fetchFacultyData = async () => {
    setLoading(true);
    try {
      const [assignRes, metaRes] = await Promise.all([
        api.get("/assignments"),
        api.get("/assignments/faculty-meta"),
      ]);
      setAssignments(Array.isArray(assignRes.data) ? assignRes.data : []);
      if (metaRes.data) {
        setMeta(metaRes.data);
      }
    } catch (err) {
      toast.error("Failed to load assignments data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  // Open Form
  const openCreateModal = () => {
    setEditingAssignment(null);
    setFormTitle("");
    setFormSubject(meta.subjects[0]?.name || "Data Structures");
    setFormDesc("");
    setFormDept(meta.departments[0] || "CSE");
    setFormYear("II");
    setFormSection("A");
    // Default due date: 7 days from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setFormDueDate(nextWeek.toISOString().slice(0, 10));
    setFormDueTime("23:59");
    setFormMaxMarks("100");
    setFormAttachments("");
    setIsFormOpen(true);
  };

  const openEditModal = (assign) => {
    setEditingAssignment(assign);
    setFormTitle(assign.title || "");
    setFormSubject(assign.subject || "");
    setFormDesc(assign.description || "");
    setFormDept(assign.department || "CSE");
    setFormYear(assign.year || "II");
    setFormSection(assign.section || "A");
    setFormDueDate(assign.due_date || "");
    setFormDueTime(assign.due_time || "23:59");
    setFormMaxMarks(String(assign.max_marks || 100));
    setFormAttachments(assign.attachments || "");
    setIsFormOpen(true);
  };

  // Submit Form (Draft or Published)
  const handleSaveAssignment = async (statusChoice = "PUBLISHED") => {
    if (!formTitle.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }
    if (!formSubject) {
      toast.error("Please select a subject");
      return;
    }
    if (!formDueDate) {
      toast.error("Please select a valid due date");
      return;
    }

    setFormSubmitting(true);
    const payload = {
      title: formTitle.trim(),
      subject: formSubject,
      description: formDesc.trim(),
      department: formDept,
      year: formYear,
      section: formSection,
      due_date: formDueDate,
      due_time: formDueTime || "23:59",
      max_marks: parseInt(formMaxMarks) || 100,
      status: statusChoice,
      attachments: formAttachments.trim() || null,
    };

    try {
      if (editingAssignment) {
        await api.put(`/assignments/${editingAssignment.id}`, payload);
        toast.success(`Assignment updated successfully!`);
      } else {
        await api.post("/assignments", payload);
        toast.success(
          statusChoice === "PUBLISHED"
            ? "Assignment published to target class!"
            : "Assignment saved as draft"
        );
      }
      setIsFormOpen(false);
      fetchFacultyData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save assignment");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Publish Draft
  const handlePublishDraft = async (assignId) => {
    try {
      await api.post(`/assignments/${assignId}/publish`);
      toast.success("Assignment published to students!");
      fetchFacultyData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to publish assignment");
    }
  };

  // Close Assignment
  const handleCloseAssignment = async (assignId) => {
    if (!window.confirm("Close this assignment? Students will no longer be able to submit.")) {
      return;
    }
    try {
      await api.post(`/assignments/${assignId}/close`);
      toast.success("Assignment marked as closed");
      fetchFacultyData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to close assignment");
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (assignId, title) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${title}"? Any student submissions associated with this assignment will also be permanently deleted.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/assignments/${assignId}`);
      toast.success("Assignment deleted successfully");
      fetchFacultyData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete assignment");
    }
  };

  // View Submissions
  const openSubmissionsModal = async (assign) => {
    setViewingSubmissionsFor(assign);
    setSubmissionsLoading(true);
    setSubmissionsList([]);
    try {
      const res = await api.get(`/assignments/${assign.id}/submissions`);
      const list = Array.isArray(res.data) ? res.data : [];
      setSubmissionsList(list);

      // Pre-fill grading state
      const initialGrades = {};
      list.forEach((sub) => {
        initialGrades[sub.id] = {
          grade: sub.grade || "",
          remarks: sub.remarks || "",
        };
      });
      setGradingState(initialGrades);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load submissions");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleSaveGrade = async (subId) => {
    const data = gradingState[subId];
    if (!data?.grade?.trim()) {
      toast.error("Please enter a grade or mark");
      return;
    }

    setSavingGradeId(subId);
    try {
      await api.put(`/assignments/submissions/${subId}/grade`, {
        grade: data.grade.trim(),
        remarks: data.remarks?.trim() || null,
      });
      toast.success("Grade and feedback saved!");
      // Update local item
      setSubmissionsList((prev) =>
        prev.map((s) =>
          s.id === subId
            ? { ...s, grade: data.grade.trim(), remarks: data.remarks?.trim(), status: "graded" }
            : s
        )
      );
      fetchFacultyData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save grade");
    } finally {
      setSavingGradeId(null);
    }
  };

  // Categorize Assignments by Status
  const publishedAssignments = useMemo(
    () => assignments.filter((a) => a.status === "PUBLISHED"),
    [assignments]
  );
  const draftAssignments = useMemo(
    () => assignments.filter((a) => a.status === "DRAFT"),
    [assignments]
  );
  const closedAssignments = useMemo(
    () => assignments.filter((a) => a.status === "CLOSED" || a.status === "ARCHIVED"),
    [assignments]
  );

  // Filtered by Search & Subject
  const currentList = useMemo(() => {
    let base = [];
    if (activeTab === "published") base = publishedAssignments;
    else if (activeTab === "drafts") base = draftAssignments;
    else if (activeTab === "closed") base = closedAssignments;
    else if (activeTab === "submissions") {
      // Show assignments that have pending or active submissions
      base = assignments.filter((a) => (a.submission_count ?? 0) > 0);
    }

    return base.filter((item) => {
      const matchSearch =
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSubject = subjectFilter === "all" || item.subject === subjectFilter;
      return matchSearch && matchSubject;
    });
  }, [activeTab, publishedAssignments, draftAssignments, closedAssignments, assignments, searchTerm, subjectFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="faculty-assignments-container"
    >
      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingAssignment ? "Edit Academic Assignment" : "Create New Academic Assignment"}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveAssignment("PUBLISHED");
          }}
          className="create-assign-form"
        >
          <div className="form-field">
            <label className="form-label">Assignment Title *</label>
            <input
              type="text"
              placeholder="e.g. AVL Tree & Binary Search Tree Implementation"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="form-input-text"
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label className="form-label">Subject / Course *</label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="form-select-input"
                required
              >
                {meta.subjects.length > 0 ? (
                  meta.subjects.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name} ({sub.code || "Core"})
                    </option>
                  ))
                ) : (
                  <option value="Data Structures">Data Structures</option>
                )}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Maximum Marks *</label>
              <input
                type="number"
                min="1"
                max="500"
                value={formMaxMarks}
                onChange={(e) => setFormMaxMarks(e.target.value)}
                className="form-input-text"
                required
              />
            </div>
          </div>

          {/* Target Class Section */}
          <div className="form-row-3">
            <div className="form-field">
              <label className="form-label">Department *</label>
              <select
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                className="form-select-input"
              >
                {meta.departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Target Year *</label>
              <select
                value={formYear}
                onChange={(e) => setFormYear(e.target.value)}
                className="form-select-input"
              >
                {meta.years.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Section *</label>
              <select
                value={formSection}
                onChange={(e) => setFormSection(e.target.value)}
                className="form-select-input"
              >
                {meta.sections.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule */}
          <div className="form-row-2">
            <div className="form-field">
              <label className="form-label">Submission Deadline (Date) *</label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="form-input-text"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Due Time</label>
              <input
                type="time"
                value={formDueTime}
                onChange={(e) => setFormDueTime(e.target.value)}
                className="form-input-text"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Instructions & Problem Statement</label>
            <textarea
              rows={4}
              placeholder="Detail assignment requirements, coding guidelines, report structure, and grading criteria..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="form-textarea-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Reference Materials or Resource Link (Optional)</label>
            <input
              type="text"
              placeholder="e.g. https://drive.google.com/problem_statement.pdf or GitHub template"
              value={formAttachments}
              onChange={(e) => setFormAttachments(e.target.value)}
              className="form-input-text"
            />
          </div>

          <div className="form-actions-footer">
            <button
              type="button"
              className="btn-assignment-action"
              onClick={() => setIsFormOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-draft"
              onClick={() => handleSaveAssignment("DRAFT")}
              disabled={formSubmitting}
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="btn-create-assignment"
              disabled={formSubmitting}
            >
              {editingAssignment ? "Update Assignment" : "Publish to Class"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Submissions Modal */}
      {viewingSubmissionsFor && (
        <Modal
          isOpen={!!viewingSubmissionsFor}
          onClose={() => setViewingSubmissionsFor(null)}
          title={`Submissions — ${viewingSubmissionsFor.title}`}
          size="xl"
        >
          <div className="submissions-modal-container">
            <div className="submissions-header-info">
              <div>
                <h4 className="subm-title">{viewingSubmissionsFor.title}</h4>
                <div className="subm-meta">
                  Subject: <strong>{viewingSubmissionsFor.subject}</strong> • Target:{" "}
                  <strong>
                    {viewingSubmissionsFor.department} Year {viewingSubmissionsFor.year} Sec{" "}
                    {viewingSubmissionsFor.section}
                  </strong>{" "}
                  • Max Marks: <strong>{viewingSubmissionsFor.max_marks}</strong>
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                Deadline: <span className="text-slate-200 font-bold">{viewingSubmissionsFor.due_date}</span>
              </div>
            </div>

            {submissionsLoading ? (
              <Skeleton variant="card" count={2} />
            ) : submissionsList.length > 0 ? (
              <div className="submissions-table-wrap">
                <table className="submissions-table">
                  <thead className="submissions-thead">
                    <tr>
                      <th className="submissions-th">Student</th>
                      <th className="submissions-th">Submitted At</th>
                      <th className="submissions-th">Work Link</th>
                      <th className="submissions-th">Status</th>
                      <th className="submissions-th">Grade & Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsList.map((sub) => {
                      const currentGrade = gradingState[sub.id]?.grade ?? (sub.grade || "");
                      const currentRemarks = gradingState[sub.id]?.remarks ?? (sub.remarks || "");

                      return (
                        <tr key={sub.id} className="submissions-tr">
                          <td className="submissions-td">
                            <div className="student-name-text">{sub.student.name}</div>
                            <div className="student-meta-text">
                              {sub.student.roll_number} • {sub.student.department}
                            </div>
                          </td>
                          <td className="submissions-td text-date">
                            {sub.submitted_at?.slice(0, 16) || "N/A"}
                          </td>
                          <td className="submissions-td">
                            {sub.file_url ? (
                              <a
                                href={sub.file_url.startsWith("http") ? sub.file_url : `https://${sub.file_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="meta-pill"
                                style={{ color: "#38bdf8" }}
                              >
                                <ExternalLink size={12} />
                                <span>Open Solution</span>
                              </a>
                            ) : sub.github_link ? (
                              <a
                                href={sub.github_link}
                                target="_blank"
                                rel="noreferrer"
                                className="meta-pill"
                                style={{ color: "#a855f7" }}
                              >
                                <ExternalLink size={12} />
                                <span>GitHub</span>
                              </a>
                            ) : (
                              <span className="text-xs text-slate-500">Text Response</span>
                            )}
                          </td>
                          <td className="submissions-td">
                            <span className={`subm-status-pill ${sub.status}`}>
                              {sub.status === "graded" ? "✓ Graded" : sub.status}
                            </span>
                          </td>
                          <td className="submissions-td">
                            <div className="grade-inline-form">
                              <input
                                type="text"
                                placeholder={`/ ${viewingSubmissionsFor.max_marks || 100}`}
                                value={currentGrade}
                                onChange={(e) =>
                                  setGradingState((prev) => ({
                                    ...prev,
                                    [sub.id]: {
                                      ...prev[sub.id],
                                      grade: e.target.value,
                                    },
                                  }))
                                }
                                className="grade-input"
                              />
                              <input
                                type="text"
                                placeholder="Feedback / comments..."
                                value={currentRemarks}
                                onChange={(e) =>
                                  setGradingState((prev) => ({
                                    ...prev,
                                    [sub.id]: {
                                      ...prev[sub.id],
                                      remarks: e.target.value,
                                    },
                                  }))
                                }
                                className="feedback-input"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveGrade(sub.id)}
                                disabled={savingGradeId === sub.id}
                                className="btn-save-grade"
                              >
                                {savingGradeId === sub.id ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="faculty-empty-state" style={{ padding: "2rem" }}>
                <Users size={32} className="text-slate-500" />
                <p>No student submissions received for this assignment yet.</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Details Modal */}
      {viewingDetailsFor && (
        <Modal
          isOpen={!!viewingDetailsFor}
          onClose={() => setViewingDetailsFor(null)}
          title={viewingDetailsFor.title}
        >
          <div className="submissions-modal-container">
            <div className="submissions-header-info">
              <div>
                <h4 className="subm-title">{viewingDetailsFor.subject}</h4>
                <div className="subm-meta">
                  Class: {viewingDetailsFor.department} Year {viewingDetailsFor.year} Sec{" "}
                  {viewingDetailsFor.section} • Due: {viewingDetailsFor.due_date} at{" "}
                  {viewingDetailsFor.due_time}
                </div>
              </div>
              <span className={`assignment-status-badge ${viewingDetailsFor.status?.toLowerCase()}`}>
                {viewingDetailsFor.status}
              </span>
            </div>

            <div>
              <h5 className="form-label" style={{ marginBottom: 6 }}>
                Instructions
              </h5>
              <div
                style={{
                  background: "#16171b",
                  border: "1px solid var(--border-color)",
                  borderRadius: 8,
                  padding: "1rem",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#cbd5e1",
                  whiteSpace: "pre-wrap",
                }}
              >
                {viewingDetailsFor.description || "No specific instructions provided."}
              </div>
            </div>

            {viewingDetailsFor.attachments && (
              <div>
                <h5 className="form-label" style={{ marginBottom: 6 }}>
                  Reference Attachment / URL
                </h5>
                <a
                  href={
                    viewingDetailsFor.attachments.startsWith("http")
                      ? viewingDetailsFor.attachments
                      : `https://${viewingDetailsFor.attachments}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="meta-pill"
                  style={{ color: "#38bdf8", padding: "6px 12px", display: "inline-flex" }}
                >
                  <ExternalLink size={13} />
                  <span>{viewingDetailsFor.attachments}</span>
                </a>
              </div>
            )}

            <div className="form-actions-footer">
              <button
                type="button"
                className="btn-create-assignment"
                onClick={() => {
                  const assign = viewingDetailsFor;
                  setViewingDetailsFor(null);
                  openSubmissionsModal(assign);
                }}
              >
                View Submissions ({viewingDetailsFor.submission_count ?? 0})
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header Bar */}
      <header className="faculty-assignments-header-row">
        <div>
          <h2 className="faculty-assignments-title">
            <BookOpen size={26} className="text-red-500" />
            Academic Coursework & Assignments
          </h2>
          <p className="faculty-assignments-subtitle">
            Create, publish, and evaluate academic assignments across your assigned courses and sections
          </p>
        </div>

        <div className="faculty-header-actions">
          <button onClick={openCreateModal} className="btn-create-assignment">
            <Plus size={15} />
            <span>Create Assignment</span>
          </button>
        </div>
      </header>

      {/* Real-time KPI Stats Cards */}
      <section className="faculty-stats-grid">
        <motion.div whileHover={{ y: -2 }} className="faculty-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Active Coursework</span>
            <div className="stat-icon-wrapper blue">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="stat-card-value">{meta.stats.active_assignments}</div>
          <div className="stat-card-footer">
            Across {meta.subjects.length} assigned courses
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="faculty-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Draft Assignments</span>
            <div className="stat-icon-wrapper amber">
              <Clock size={16} />
            </div>
          </div>
          <div className="stat-card-value amber">{meta.stats.draft_assignments}</div>
          <div className="stat-card-footer">Unpublished draft templates</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="faculty-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Pending Evaluation</span>
            <div className="stat-icon-wrapper purple">
              <Users size={16} />
            </div>
          </div>
          <div className="stat-card-value purple">{meta.stats.pending_reviews}</div>
          <div className="stat-card-footer">Submissions awaiting marks</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="faculty-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Graded Submissions</span>
            <div className="stat-icon-wrapper emerald">
              <Award size={16} />
            </div>
          </div>
          <div className="stat-card-value emerald">{meta.stats.graded_submissions}</div>
          <div className="stat-card-footer">Evaluated student work</div>
        </motion.div>
      </section>

      {/* Tabs Navigation */}
      <nav className="faculty-tabs-nav">
        <button
          onClick={() => setActiveTab("published")}
          className={`faculty-tab-btn ${activeTab === "published" ? "active" : ""}`}
        >
          <CheckCircle2 size={15} />
          <span>Active & Published</span>
          <span className="faculty-tab-count">{publishedAssignments.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("drafts")}
          className={`faculty-tab-btn ${activeTab === "drafts" ? "active" : ""}`}
        >
          <Clock size={15} />
          <span>Drafts</span>
          <span className="faculty-tab-count">{draftAssignments.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("submissions")}
          className={`faculty-tab-btn ${activeTab === "submissions" ? "active" : ""}`}
        >
          <Users size={15} />
          <span>Review Submissions</span>
          <span className="faculty-tab-count">
            {assignments.filter((a) => (a.submission_count ?? 0) > 0).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("closed")}
          className={`faculty-tab-btn ${activeTab === "closed" ? "active" : ""}`}
        >
          <Calendar size={15} />
          <span>Closed Coursework</span>
          <span className="faculty-tab-count">{closedAssignments.length}</span>
        </button>
      </nav>

      {/* Filters Row */}
      <div className="faculty-filter-bar">
        <div className="faculty-search-box">
          <Search size={14} className="faculty-search-icon" />
          <input
            type="text"
            placeholder="Search assignments by title or instructions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="faculty-search-input"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="faculty-select-filter"
        >
          <option value="all">All Courses / Subjects</option>
          {meta.subjects.map((sub) => (
            <option key={sub.id} value={sub.name}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Assignments List Content */}
      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : currentList.length > 0 ? (
        <div className="faculty-assignments-grid">
          {currentList.map((item) => {
            const isDraft = item.status === "DRAFT";
            const isClosed = item.status === "CLOSED";
            const totalSubs = item.submission_count ?? 0;
            const targetTotal = item.target_count ?? totalSubs;
            const gradedCount = item.graded_count ?? 0;
            const progressPct =
              targetTotal > 0 ? Math.min(100, Math.round((totalSubs / targetTotal) * 100)) : 0;

            return (
              <div key={item.id} className="faculty-assignment-card">
                <div>
                  <div className="assignment-card-header">
                    <div className="assignment-header-left">
                      <span className="assignment-card-subject">{item.subject}</span>
                      <h3 className="assignment-card-title">{item.title}</h3>
                    </div>

                    <span className={`assignment-status-badge ${item.status?.toLowerCase()}`}>
                      {item.status === "PUBLISHED" ? "● Active" : item.status}
                    </span>
                  </div>

                  <p className="assignment-card-desc" style={{ marginTop: 10 }}>
                    {item.description || "No specific instructions provided."}
                  </p>

                  {/* Target & Schedule Pills */}
                  <div className="assignment-meta-row" style={{ marginTop: 12 }}>
                    <span className="meta-pill">
                      <Users size={12} />
                      <span>
                        {item.department} • Year {item.year} • Sec {item.section}
                      </span>
                    </span>

                    <span className="meta-pill deadline">
                      <Calendar size={12} />
                      <span>Due: {item.due_date}</span>
                    </span>

                    <span className="meta-pill marks">
                      <Award size={12} />
                      <span>Max {item.max_marks || 100} Marks</span>
                    </span>
                  </div>
                </div>

                <div>
                  {/* Submission Progress */}
                  {!isDraft && (
                    <div className="submission-progress-box">
                      <div className="submission-progress-labels">
                        <span className="progress-text-main">
                          {totalSubs} / {targetTotal} Students Submitted ({progressPct}%)
                        </span>
                        <span className="progress-text-graded">
                          {gradedCount} Graded
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="assignment-card-actions" style={{ marginTop: 12 }}>
                    <div className="action-btn-group">
                      <button
                        onClick={() => setViewingDetailsFor(item)}
                        className="btn-assignment-action"
                        title="View Full Assignment Details"
                      >
                        <Eye size={12} />
                        <span>Details</span>
                      </button>

                      {!isDraft && (
                        <button
                          onClick={() => openSubmissionsModal(item)}
                          className="btn-assignment-action primary-subm"
                        >
                          <Users size={12} />
                          <span>Submissions ({totalSubs})</span>
                        </button>
                      )}

                      {isDraft && (
                        <button
                          onClick={() => handlePublishDraft(item.id)}
                          className="btn-assignment-action publish-btn"
                        >
                          <Send size={12} />
                          <span>Publish</span>
                        </button>
                      )}
                    </div>

                    <div className="action-btn-group">
                      <button
                        onClick={() => openEditModal(item)}
                        className="btn-assignment-action"
                        title="Edit Assignment"
                      >
                        <Edit size={12} />
                      </button>

                      {!isDraft && !isClosed && (
                        <button
                          onClick={() => handleCloseAssignment(item.id)}
                          className="btn-assignment-action"
                          title="Close Submissions"
                        >
                          <Clock size={12} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteAssignment(item.id, item.title)}
                        className="btn-assignment-action delete-btn"
                        title="Delete Assignment"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="faculty-empty-state">
          <div className="empty-icon-box">
            <BookOpen size={24} />
          </div>
          <p style={{ margin: 0 }}>
            {activeTab === "drafts"
              ? "No draft assignments saved."
              : activeTab === "submissions"
              ? "No assignments with student submissions found."
              : activeTab === "closed"
              ? "No past closed assignments."
              : "No active assignments posted yet."}
          </p>
          <button onClick={openCreateModal} className="btn-create-assignment">
            <Plus size={14} /> Create First Assignment
          </button>
        </div>
      )}
    </motion.div>
  );
};
