import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";
import { Card, Skeleton, Button } from "../../components/ui";
import {
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Save,
  BookOpen,
  Check,
  X,
  RefreshCw,
  Search,
  AlertTriangle,
  Award
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import "./FacultyAttendance.css";

export const FacultyAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedSubject, setSelectedSubject] = useState("Data Structures");
  const [subjectsList, setSubjectsList] = useState([
    "Data Structures",
    "Operating Systems",
    "Software Engineering"
  ]);

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // 1. Initial Load: Faculty Subjects & Student Roster
  useEffect(() => {
    const fetchInitialMeta = async () => {
      setLoading(true);
      try {
        const [metaRes, rosterRes] = await Promise.allSettled([
          api.get("/assignments/faculty-meta"),
          api.get("/attendance/students"),
        ]);

        if (metaRes.status === "fulfilled" && metaRes.value.data?.subjects) {
          const names = metaRes.value.data.subjects.map((s) => s.name);
          if (names.length > 0) {
            setSubjectsList(names);
            setSelectedSubject(names[0]);
          }
        }

        if (rosterRes.status === "fulfilled" && Array.isArray(rosterRes.value.data)) {
          setStudents(rosterRes.value.data);
        }
      } catch (err) {
        toast.error("Failed to load attendance roster");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMeta();
  }, []);

  // 2. Hydrate Attendance for Selected Date & Subject
  const fetchClassStatus = async (dateVal, subVal) => {
    if (!subVal || !dateVal) return;
    try {
      const res = await api.get(
        `/attendance/class-status?subject=${encodeURIComponent(subVal)}&date=${encodeURIComponent(dateVal)}`
      );
      const existing = res.data?.records || {};

      setAttendanceMap((prev) => {
        const updated = {};
        students.forEach((s) => {
          // If record exists in DB for this date/subject, use it; otherwise default to present
          updated[s.id] = existing[s.id] ? existing[s.id].toLowerCase() : "present";
        });
        return updated;
      });

      if (res.data?.total_recorded > 0) {
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setLastSavedTime(null);
      }
    } catch {
      // Default to present if class-status isn't populated yet
      const fallback = {};
      students.forEach((s) => {
        fallback[s.id] = "present";
      });
      setAttendanceMap(fallback);
    }
  };

  useEffect(() => {
    if (students.length > 0) {
      fetchClassStatus(selectedDate, selectedSubject);
    }
  }, [selectedDate, selectedSubject, students]);

  // Quick Action Toggles
  const handleToggleStatus = (studentId) => {
    setAttendanceMap((prev) => {
      const current = prev[studentId] || "present";
      return {
        ...prev,
        [studentId]: current === "present" ? "absent" : "present",
      };
    });
  };

  const handleMarkAll = (statusChoice) => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      students.forEach((s) => {
        updated[s.id] = statusChoice;
      });
      return updated;
    });
    toast.success(`Marked all students as ${statusChoice}`);
  };

  // Submit Bulk Attendance to Backend
  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      toast.error("No students available to mark attendance");
      return;
    }

    setSaving(true);
    try {
      const records = students.map((s) => ({
        student_id: s.id,
        status: attendanceMap[s.id] || "present",
        remarks: remarksMap[s.id] || null,
      }));

      const payload = {
        subject: selectedSubject,
        date: selectedDate,
        records,
      };

      const res = await api.post("/attendance/bulk", payload);
      toast.success(res.data?.message || `Attendance logged for ${records.length} students!`);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Failed to submit class attendance records.";
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Calculations for KPI summaries
  const presentCount = useMemo(() => {
    return Object.values(attendanceMap).filter((st) => st === "present").length;
  }, [attendanceMap]);

  const absentCount = useMemo(() => {
    return Object.values(attendanceMap).filter((st) => st === "absent").length;
  }, [attendanceMap]);

  const attendancePercentage = useMemo(() => {
    if (students.length === 0) return 100;
    return Math.round((presentCount / students.length) * 100);
  }, [presentCount, students.length]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.roll_number?.toLowerCase().includes(term) ||
        String(s.id).includes(term)
    );
  }, [students, searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="faculty-att-container"
    >
      {/* Header Bar */}
      <header className="faculty-att-header">
        <div>
          <h2 className="faculty-att-title">
            <Clock size={26} className="text-red" />
            Class Attendance Roll Call
          </h2>
          <p className="faculty-att-subtitle">
            Record, verify, and persist daily classroom attendance across your assigned courses
          </p>
        </div>

        <div className="faculty-att-header-actions">
          <button
            onClick={() => fetchClassStatus(selectedDate, selectedSubject)}
            className="btn-att-ghost"
            title="Refresh status from database"
          >
            <RefreshCw size={14} />
            <span>Reload</span>
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading || students.length === 0}
            className="btn-save-attendance"
          >
            <Save size={15} />
            <span>{saving ? "Saving Records..." : "Save Attendance"}</span>
          </button>
        </div>
      </header>

      {/* KPI Stats Overview Cards */}
      <section className="faculty-att-kpi-grid">
        <motion.div whileHover={{ y: -2 }} className="faculty-att-kpi-card">
          <div className="att-kpi-header">
            <span className="att-kpi-lbl">Total Students</span>
            <div className="att-kpi-icon blue">
              <Users size={16} />
            </div>
          </div>
          <div className="att-kpi-val">{students.length}</div>
          <div className="att-kpi-sub">Enrolled roster for this session</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="faculty-att-kpi-card">
          <div className="att-kpi-header">
            <span className="att-kpi-lbl">Present in Class</span>
            <div className="att-kpi-icon emerald">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="att-kpi-val emerald">{presentCount}</div>
          <div className="att-kpi-sub">Marked attending today</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="faculty-att-kpi-card">
          <div className="att-kpi-header">
            <span className="att-kpi-lbl">Absent</span>
            <div className="att-kpi-icon red">
              <XCircle size={16} />
            </div>
          </div>
          <div className="att-kpi-val red">{absentCount}</div>
          <div className="att-kpi-sub">Unaccounted absence</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="faculty-att-kpi-card">
          <div className="att-kpi-header">
            <span className="att-kpi-lbl">Attendance Rate</span>
            <div className={`att-kpi-icon ${attendancePercentage >= 75 ? "emerald" : "amber"}`}>
              <Award size={16} />
            </div>
          </div>
          <div className={`att-kpi-val ${attendancePercentage >= 75 ? "emerald" : "amber"}`}>
            {attendancePercentage}%
          </div>
          <div className="att-kpi-sub">
            {attendancePercentage >= 75 ? "Target standard met (>75%)" : "Attendance shortage alert"}
          </div>
        </motion.div>
      </section>

      {/* Control Bar: Date, Subject Filter, Search, Quick Mark Actions */}
      <div className="faculty-att-controls-card">
        <div className="controls-left-group">
          {/* Date Picker */}
          <div className="control-item">
            <label className="control-label">
              <Calendar size={13} />
              <span>Session Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="att-date-input"
            />
          </div>

          {/* Subject Dropdown */}
          <div className="control-item">
            <label className="control-label">
              <BookOpen size={13} />
              <span>Assigned Subject</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="att-subject-select"
            >
              {subjectsList.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div className="control-item search-item">
            <label className="control-label">
              <Search size={13} />
              <span>Find Student</span>
            </label>
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="att-search-input"
            />
          </div>
        </div>

        <div className="controls-right-group">
          <button
            type="button"
            onClick={() => handleMarkAll("present")}
            className="btn-mark-all present"
          >
            <Check size={13} />
            <span>Mark All Present</span>
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll("absent")}
            className="btn-mark-all absent"
          >
            <X size={13} />
            <span>Mark All Absent</span>
          </button>
        </div>
      </div>

      {lastSavedTime && (
        <div className="att-saved-status-banner">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>Attendance records verified in database (Last saved at {lastSavedTime})</span>
        </div>
      )}

      {/* Student Roster Table */}
      <div className="faculty-att-table-wrapper">
        {loading ? (
          <div style={{ padding: "2rem" }}>
            <Skeleton variant="card" count={2} />
          </div>
        ) : filteredStudents.length > 0 ? (
          <table className="faculty-att-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Roll Number</th>
                <th>Student Name</th>
                <th style={{ width: "160px" }}>Department</th>
                <th style={{ width: "240px" }}>Attendance Status</th>
                <th>Notes / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const status = attendanceMap[student.id] || "present";
                const isPresent = status === "present";
                return (
                  <tr key={student.id} className="att-student-row">
                    <td className="att-roll-cell">
                      <span className="roll-badge">
                        {student.roll_number && student.roll_number !== "N/A"
                          ? student.roll_number
                          : `CS00${student.id}`}
                      </span>
                    </td>
                    <td className="att-name-cell">
                      <div className="student-profile-flex">
                        <div className="student-avatar-placeholder">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="student-full-name">{student.name}</div>
                          <div className="student-email-sub">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="att-dept-cell">
                      <span className="dept-tag">{student.department || "CSE"}</span>
                    </td>
                    <td className="att-toggle-cell">
                      <div className="att-segmented-control">
                        <button
                          type="button"
                          onClick={() =>
                            setAttendanceMap((prev) => ({
                              ...prev,
                              [student.id]: "present",
                            }))
                          }
                          className={`att-segment-btn present ${isPresent ? "active" : ""}`}
                        >
                          <Check size={12} />
                          <span>Present</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAttendanceMap((prev) => ({
                              ...prev,
                              [student.id]: "absent",
                            }))
                          }
                          className={`att-segment-btn absent ${!isPresent ? "active" : ""}`}
                        >
                          <X size={12} />
                          <span>Absent</span>
                        </button>
                      </div>
                    </td>
                    <td className="att-remarks-cell">
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. late by 10m)..."
                        value={remarksMap[student.id] || ""}
                        onChange={(e) =>
                          setRemarksMap((prev) => ({
                            ...prev,
                            [student.id]: e.target.value,
                          }))
                        }
                        className="att-remarks-input"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="faculty-att-empty-state">
            <Users size={32} className="text-slate-500" />
            <p>No students found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <footer className="faculty-att-sticky-footer">
        <div className="sticky-footer-summary">
          <span>
            Marking attendance for <strong>{students.length} students</strong> in{" "}
            <strong>{selectedSubject}</strong> on <strong>{selectedDate}</strong>
          </span>
          <span className="summary-pill">
            {presentCount} Present • {absentCount} Absent
          </span>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving || loading || students.length === 0}
          className="btn-save-attendance-large"
        >
          <Save size={16} />
          <span>{saving ? "Saving to Database..." : "Save Attendance"}</span>
        </button>
      </footer>
    </motion.div>
  );
};
