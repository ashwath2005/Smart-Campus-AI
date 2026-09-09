import "./InternalMarks.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, Skeleton, Badge } from "../../components/ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export const InternalMarks = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSem, setActiveSem] = useState(4);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const res = await api.get(`/students/internal-marks?semester=${activeSem}`);
        setMarks(res.data);
      } catch (err) {
        toast.error("Failed to fetch internal marks");
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, [activeSem]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="internalmarks-container"
    >
      {/* Title Header */}
      <div className="internalmarks-header">
        <div className="header-details">
          <h2 className="internalmarks-title">Internal Marks</h2>
          <p className="internalmarks-subtitle">
            Monitor Continuous Assessment Tests (CAT) and Assignment scores
          </p>
        </div>
        
        {/* Semester Selector */}
        <div className="select-wrapper">
          <select
            value={activeSem}
            onChange={(e) => setActiveSem(Number(e.target.value))}
            className="semester-select-dropdown"
          >
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
            <option value={3}>Semester 3</option>
            <option value={4}>Semester 4</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="internalmarks-loading-pane">
          <Skeleton variant="card" count={2} />
        </div>
      ) : marks.length > 0 ? (
        <>
          {/* Chart Section */}
          <Card hoverGlow={false} className="internalmarks-chart-card">
            <h3 className="chart-card-title">Marks Comparison Chart</h3>
            <div className="chart-wrapper-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="subjectName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" domain={[0, 50]} fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "12px",
                      boxShadow: "var(--shadow-card)"
                    }}
                    itemStyle={{ color: "var(--text-primary)" }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="chart-legend-text">{value}</span>}
                  />
                  <Bar dataKey="cat1" name="CAT-1" fill="#E31B23" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cat2" name="CAT-2" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cat3" name="CAT-3" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Table List Card */}
          <Card hoverGlow={false} className="internalmarks-table-card">
            <div className="table-wrapper-box">
              <table className="marks-data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>CAT 1 (50)</th>
                    <th>CAT 2 (50)</th>
                    <th>CAT 3 (50)</th>
                    <th>Total Obtained</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((item, idx) => (
                    <tr key={idx}>
                      <td className="bold-td">{item.subjectName}</td>
                      <td>{item.cat1 ?? "—"}</td>
                      <td>{item.cat2 ?? "—"}</td>
                      <td>{item.cat3 ?? "—"}</td>
                      <td>
                        <Badge variant={item.total >= 70 ? "success" : "warning"}>
                          {item.total} / {item.maxTotal}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card hoverGlow={false} className="internalmarks-empty-card">
          No internal marks found for Semester {activeSem}.
        </Card>
      )}
    </motion.div>
  );
};
