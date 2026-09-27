import "./Attendance.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Card, Skeleton, Badge, ProgressBar } from "../../components/ui";
import { Clock, Info, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FacultyAttendance } from "../faculty/FacultyAttendance";

export const Attendance = () => {
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

  if (isFacultyOrAdmin) {
    return <FacultyAttendance />;
  }

  return <StudentAttendanceView />;
};

const StudentAttendanceView = () => {
  const [summaries, setSummaries] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const [sumRes, histRes] = await Promise.allSettled([
          api.get("/attendance/my"),
          api.get("/attendance/history"),
        ]);

        if (sumRes.status === "fulfilled" && Array.isArray(sumRes.value.data)) {
          setSummaries(sumRes.value.data);
        }
        if (histRes.status === "fulfilled" && Array.isArray(histRes.value.data)) {
          setHistory(histRes.value.data);
        }
      } catch (err) {
        toast.error("Failed to load attendance metrics");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const totalClasses = summaries.reduce((acc, curr) => acc + curr.totalClasses, 0);
  const totalAttended = summaries.reduce((acc, curr) => acc + curr.attended, 0);
  const overallPercentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 100;
  const hasLowAttendance = summaries.some((s) => s.percentage < 75);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="attendance-container"
    >
      {/* Title Header */}
      <div className="attendance-header">
        <h2 className="attendance-title">Attendance Analytics</h2>
        <p className="attendance-subtitle">
          Verify your class presence by subject. Maintain at least 75% to stay exam eligible.
        </p>
      </div>

      {loading ? (
        <div className="attendance-loading-pane">
          <Skeleton variant="card" count={3} />
        </div>
      ) : summaries.length > 0 ? (
        <>
          {/* Top Metrics Row */}
          <div className="attendance-metrics-grid">
            {/* Overall Attendance Card */}
            <Card hoverGlow={false} className="attendance-overall-card">
              <div className="overall-progress-circle-box">
                <ProgressBar type="circular" value={overallPercentage} size={90} strokeWidth={8} />
              </div>
              <div className="overall-details-box">
                <span className="metrics-col-lbl">Overall Attendance</span>
                <span className="metrics-col-val">{overallPercentage.toFixed(1)}%</span>
                <span className="metrics-col-sub">
                  {totalAttended} / {totalClasses} classes attended
                </span>
              </div>
            </Card>

            {/* Regulations Alert Card */}
            <Card hoverGlow={false} className="attendance-rules-card">
              <div className="rules-header-box">
                <ShieldAlert size={20} className="text-red" />
                <h3 className="rules-title">Academic Regulations Notice</h3>
              </div>
              <p className="rules-text">
                University rules mandate a minimum of 75% attendance in each subject to be eligible
                for end-semester exams. Low attendance alerts are highlighted below.
              </p>
              {hasLowAttendance && (
                <div className="attendance-warning-banner">
                  <Clock size={14} />
                  <span>Warning: You have low attendance (&lt;75%) in one or more subjects!</span>
                </div>
              )}
            </Card>
          </div>

          {/* Subject Summaries Grid */}
          <div className="attendance-subjects-grid">
            {summaries.map((item, idx) => (
              <Card key={idx} className="subject-attendance-card">
                <div className="subject-card-header">
                  <h4 className="subject-card-name">{item.subject}</h4>
                  <Badge variant={item.percentage >= 75 ? "success" : "danger"}>
                    {item.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <span className="subject-card-details">
                  Attended: {item.attended} / {item.totalClasses} classes
                </span>
                <div className="subject-progress-box">
                  <ProgressBar value={item.percentage} />
                </div>
              </Card>
            ))}
          </div>

          {/* History Log Card */}
          <Card hoverGlow={false} className="attendance-history-card">
            <h3 className="history-card-title">Recent Attendance Log</h3>
            <div className="history-table-wrapper">
              <table className="history-data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length > 0 ? (
                    history.map((record) => (
                      <tr key={record.id}>
                        <td className="bold-td">{record.subject}</td>
                        <td>{record.date}</td>
                        <td>
                          <Badge variant={record.status === "present" ? "success" : "danger"}>
                            {record.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                        No individual attendance entries recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card hoverGlow={false} className="attendance-empty-card">
          <Info size={36} className="text-red" />
          <p className="empty-title">No attendance records found.</p>
        </Card>
      )}
    </motion.div>
  );
};
