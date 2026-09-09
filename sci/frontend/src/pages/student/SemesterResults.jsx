import "./SemesterResults.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, Skeleton, Badge } from "../../components/ui";
import { PerformanceChart } from "../../components/charts/PerformanceChart";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export const SemesterResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSem, setActiveSem] = useState(3);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get("/students/semester-results");
        setResults(res.data);
      } catch (err) {
        toast.error("Failed to fetch semester results");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const activeResult = results.find((r) => r.semester === activeSem);
  const chartData = results
    .map((r) => ({
      semester: r.semester,
      sgpa: r.sgpa,
      cgpa: r.cgpa
    }))
    .sort((a, b) => a.semester - b.semester);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="semesterresults-container"
    >
      {/* Title Header */}
      <div className="semesterresults-header">
        <div className="header-details">
          <h2 className="semesterresults-title">Academic Grades & Results</h2>
          <p className="semesterresults-subtitle">
            View semester grades, SGPA and CGPA trends
          </p>
        </div>

        {results.length > 0 && (
          <div className="select-wrapper">
            <select
              value={activeSem}
              onChange={(e) => setActiveSem(Number(e.target.value))}
              className="semester-select-dropdown"
            >
              {results.map((r) => (
                <option key={r.semester} value={r.semester}>
                  Semester {r.semester}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="semesterresults-loading-pane">
          <div className="loading-metrics-row">
            <Skeleton variant="card" count={3} />
          </div>
          <div className="loading-split-row">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        </div>
      ) : results.length > 0 ? (
        <>
          {/* Top Metrics Row */}
          <div className="semesterresults-metrics-grid">
            <Card hoverGlow={false} className="gpa-metric-card">
              <span className="metric-card-lbl">Semester GPA (SGPA)</span>
              <span className="metric-card-val text-red">
                {activeResult?.sgpa.toFixed(2) || "0.00"}
              </span>
            </Card>
            <Card hoverGlow={false} className="gpa-metric-card">
              <span className="metric-card-lbl">Cumulative GPA (CGPA)</span>
              <span className="metric-card-val text-green">
                {activeResult?.cgpa.toFixed(2) || "0.00"}
              </span>
            </Card>
            <Card hoverGlow={false} className="gpa-metric-card">
              <span className="metric-card-lbl">Earned Credits</span>
              <span className="metric-card-val text-white">
                {activeResult?.earnedCredits} / {activeResult?.totalCredits}
              </span>
            </Card>
          </div>

          {/* Lower Split Sections */}
          <div className="semesterresults-split-grid">
            {/* Left Table Card */}
            <Card hoverGlow={false} className="results-table-card">
              <h3 className="card-section-title">Grade Sheet</h3>
              <div className="table-wrapper-box">
                <table className="results-data-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th>Credits</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeResult?.subjects.map((sub, idx) => (
                      <tr key={idx}>
                        <td className="code-td">{sub.code}</td>
                        <td className="bold-td">{sub.name}</td>
                        <td>{sub.credits}</td>
                        <td>
                          <Badge variant={sub.grade === "O" || sub.grade === "A" ? "success" : "default"}>
                            {sub.grade}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Right Chart Card */}
            <Card hoverGlow={false} className="results-chart-card">
              <h3 className="card-section-title">GPA Trend Analysis</h3>
              <div className="trend-chart-box">
                <PerformanceChart data={chartData} />
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card hoverGlow={false} className="semesterresults-empty-card">
          No results found.
        </Card>
      )}
    </motion.div>
  );
};
