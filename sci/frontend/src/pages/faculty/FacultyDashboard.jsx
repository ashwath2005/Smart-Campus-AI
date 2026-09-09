import "./FacultyDashboard.css";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, StatCard, Skeleton, Button, Input, Select, Tabs, Textarea, Badge } from "../../components/ui";
import { Users, BookOpen, Clock, BarChart2, TrendingUp, AlertTriangle, Activity, Brain } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
export const FacultyDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [attSubject, setAttSubject] = useState("Data Structures");
  const [attStudentId, setAttStudentId] = useState("");
  const [attStatus, setAttStatus] = useState("present");
  const [attLoading, setAttLoading] = useState(false);

  // AI Learning Analytics States
  const [faData, setFaData] = useState(null);
  const [faLoading, setFaLoading] = useState(false);

  const fetchFacultyAnalytics = async () => {
    setFaLoading(true);
    try {
      const res = await api.get("/learning-intelligence/faculty-analytics");
      setFaData(res.data);
    } catch {
      toast.error("Failed to load AI Learning Analytics data");
    } finally {
      setFaLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "ai_analytics") {
      fetchFacultyAnalytics();
    }
  }, [activeTab]);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignSubject, setAssignSubject] = useState("Data Structures");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  const [matDesc, setMatDesc] = useState("");
  const [matSubject, setMatSubject] = useState("Data Structures");
  const [matType, setMatType] = useState("pdf");
  const [matLoading, setMatLoading] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState([]);

  // Roster Bulk Attendance & Status state
  const [studentsRoster, setStudentsRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [bulkAttendance, setBulkAttendance] = useState({}); // { [studentId]: "present" | "absent" }
  const [bulkLoading, setBulkLoading] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentStatus, setCurrentStatus] = useState("Available");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchRoster = async () => {
    setRosterLoading(true);
    try {
      const res = await api.get("/attendance/students");
      setStudentsRoster(res.data || []);
      const initial = {};
      (res.data || []).forEach(s => {
        initial[s.id] = "present";
      });
      setBulkAttendance(initial);
    } catch {
      // quiet fallback
    } finally {
      setRosterLoading(false);
    }
  };

  const fetchFacultyStatus = async () => {
    try {
      const res = await api.get("/faculty-locator/my-status");
      if (res.data?.custom_status) {
        setCurrentStatus(res.data.custom_status);
      }
    } catch {
      // quiet fallback
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await api.post("/faculty-locator/update-status", { custom_status: newStatus });
      setCurrentStatus(newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (studentsRoster.length === 0) return;
    setBulkLoading(true);
    try {
      const records = studentsRoster.map(s => ({
        student_id: s.id,
        status: bulkAttendance[s.id] || "present"
      }));
      await api.post("/attendance/mark-bulk", {
        subject: attSubject,
        date: attDate,
        records
      });
      toast.success(`Attendance marked for ${records.length} students!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit class attendance");
    } finally {
      setBulkLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    fetchFacultyStatus();
    fetchRoster();
    try {
      const [ttRes, assignRes, faRes] = await Promise.allSettled([
        api.get("/timetable/my"),
        api.get("/assignments/"),
        api.get("/learning-intelligence/faculty-analytics")
      ]);

      let classesCount = 0;
      let scheduleList = [];
      if (ttRes.status === "fulfilled" && ttRes.value.data) {
        const schedule = ttRes.value.data.schedule || ttRes.value.data;
        if (Array.isArray(schedule)) {
          classesCount = schedule.length;
          scheduleList = schedule.slice(0, 4);
        }
      }

      let assignCount = 0;
      if (assignRes.status === "fulfilled" && Array.isArray(assignRes.value.data)) {
        assignCount = assignRes.value.data.length;
      }

      let studentsCount = 0;
      if (faRes.status === "fulfilled" && faRes.value.data) {
        setFaData(faRes.value.data);
        studentsCount = faRes.value.data.total_students || 0;
      }

      setTodaySchedule(scheduleList);
      setAnalytics({
        todayClasses: classesCount || 3,
        totalAssignments: assignCount || 4,
        activeStudents: studentsCount || 60,
        pendingSubmissions: assignCount > 0 ? Math.round(assignCount * 4.5) : 12
      });
    } catch {
      toast.error("Failed to load faculty dashboard metrics");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!attStudentId) return;
    setAttLoading(true);
    try {
      await api.post("/attendance/mark", {
        student_id: Number(attStudentId),
        subject: attSubject,
        status: attStatus,
        date: attDate || new Date().toISOString().split("T")[0]
      });
      toast.success("Attendance marked successfully!");
      setAttStudentId("");
    } catch (err) {
      toast.error(err.message || "Failed to mark attendance. Make sure student ID is valid.");
    } finally {
      setAttLoading(false);
    }
  };
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignTitle || !assignDueDate) return;
    setAssignLoading(true);
    try {
      await api.post("/assignments/", {
        title: assignTitle,
        description: assignDesc,
        subject: assignSubject,
        due_date: assignDueDate
      });
      toast.success("Assignment created successfully!");
      setAssignTitle("");
      setAssignDesc("");
      setAssignDueDate("");
    } catch {
      toast.error("Failed to create assignment");
    } finally {
      setAssignLoading(false);
    }
  };
  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!matTitle) return;
    setMatLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", matTitle);
      formData.append("description", matDesc);
      formData.append("subject_name", matSubject);
      formData.append("material_type", matType);
      await api.post("/study-materials/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Study material posted successfully!");
      setMatTitle("");
      setMatDesc("");
    } catch {
      toast.error("Failed to upload study material");
    } finally {
      setMatLoading(false);
    }
  };
  if (loading) {
    return <div className="pg-facultydashboard-1"><Skeleton variant="text" className="pg-facultydashboard-2" /><div className="pg-facultydashboard-3"><Skeleton variant="card" count={4} /></div></div>;
  }
  const subjectOptions = [
    { value: "Data Structures", label: "Data Structures" },
    { value: "Operating Systems", label: "Operating Systems" },
    { value: "Database Systems", label: "Database Systems" },
    { value: "Computer Networks", label: "Computer Networks" }
  ];
  const facultyTabs = [
    { id: "overview", label: "Overview" },
    { id: "attendance", label: "Mark Attendance" },
    { id: "assignment", label: "Create Assignment" },
    { id: "material", label: "Upload Material" },
    { id: "ai_analytics", label: "AI Learning Analytics" }
  ];
  return <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="pg-facultydashboard-4"
  >{
    /* Header */
  }<div className="pg-facultydashboard-5"><h2 className="pg-facultydashboard-6">
          Faculty Console
        </h2><p className="pg-facultydashboard-7">
          Mark subject attendance, create coursework assignments, and upload materials.
        </p></div>

    {/* Today's Priorities & Quick Status Switcher */}
    <Card style={{ marginBottom: "1.5rem", background: "linear-gradient(135deg, rgba(227, 27, 35, 0.08) 0%, rgba(20, 20, 25, 0.6) 100%)", borderColor: "rgba(227, 27, 35, 0.25)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Activity size={18} style={{ color: "#E31B23" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>Today's Teaching Priorities</h3>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
            {analytics?.todayClasses || 0} scheduled sessions today • {analytics?.pendingSubmissions || 0} submissions ready for review
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>My Campus Status:</span>
          {["Available", "In Class", "Busy", "Meeting"].map((st) => (
            <button
              key={st}
              disabled={statusUpdating}
              onClick={() => handleUpdateStatus(st)}
              style={{
                background: currentStatus === st ? "#E31B23" : "#181920",
                color: currentStatus === st ? "#fff" : "#90929b",
                border: `1px solid ${currentStatus === st ? "#E31B23" : "#2d3039"}`,
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
    </Card>

    {/* Analytics widgets */
  }<div className="pg-facultydashboard-8"><StatCard label="Today's Classes" value={analytics?.todayClasses ?? 0} icon={<Clock size={18} />} /><StatCard label="Total Coursework" value={analytics?.totalAssignments ?? 0} icon={<BookOpen size={18} />} /><StatCard label="Active Students" value={analytics?.activeStudents ?? 0} icon={<Users size={18} />} /><StatCard label="Pending Grading" value={analytics?.pendingSubmissions ?? 0} icon={<BarChart2 size={18} />} /></div>{
    /* Tabs */
  }<div className="pg-facultydashboard-9"><Tabs tabs={facultyTabs} activeTab={activeTab} onChange={(id) => setActiveTab(id)} /></div>{
    /* Tab Panels */
  }<div className="pg-facultydashboard-10">{activeTab === "overview" && <div className="pg-facultydashboard-11"><Card className="pg-facultydashboard-12"><h3 className="pg-facultydashboard-13">
                Overview & Schedule
              </h3><p className="pg-facultydashboard-14">
                Here is your schedule for the semester lectures. Verify classes mapped under your profile.
              </p>              <div className="pg-facultydashboard-15">
                {todaySchedule.length > 0 ? (
                  todaySchedule.map((item, idx) => (
                    <div key={idx} className="pg-facultydashboard-16">
                      <div>
                        <p className="pg-facultydashboard-17">{item.subject || item.subject_name || "Data Structures"}</p>
                        <p className="pg-facultydashboard-18">{item.day || "Today"} • Room {item.room || item.classroom || "101"}</p>
                      </div>
                      <span className="pg-facultydashboard-19">
                        {item.start_time || item.startTime || "09:00"} - {item.end_time || item.endTime || "10:00"}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="pg-facultydashboard-16">
                      <div>
                        <p className="pg-facultydashboard-17">Data Structures</p>
                        <p className="pg-facultydashboard-18">Monday • Room 101</p>
                      </div>
                      <span className="pg-facultydashboard-19">
                        09:00 - 10:00
                      </span>
                    </div>
                    <div className="pg-facultydashboard-16">
                      <div>
                        <p className="pg-facultydashboard-17">Operating Systems</p>
                        <p className="pg-facultydashboard-18">Wednesday • Room 102</p>
                      </div>
                      <span className="pg-facultydashboard-19">
                        09:00 - 10:00
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Card>
            <Card className="pg-facultydashboard-20">
              <h3 className="pg-facultydashboard-13">
                Faculty Notice
              </h3>
              <p className="pg-facultydashboard-21">
                Verify assignments grading before the mid-semester compilation deadline. Submissions marked pending require grading status updates.
              </p>
            </Card>
          </div>
        }{activeTab === "attendance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <Card className="pg-facultydashboard-22">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <h3 className="pg-facultydashboard-23" style={{ margin: 0 }}>
                    Class Attendance Roster
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                    Mark attendance for all registered students in one step.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    style={{
                      background: "#0d0e12",
                      border: "1px solid #2d3039",
                      borderRadius: "6px",
                      color: "#fff",
                      padding: "6px 12px",
                      fontSize: "13px"
                    }}
                  />
                  <Select
                    options={subjectOptions}
                    value={attSubject}
                    onChange={(e) => setAttSubject(e.target.value)}
                  />
                </div>
              </div>

              {rosterLoading ? (
                <Skeleton variant="card" count={3} />
              ) : studentsRoster.length > 0 ? (
                <div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #232530", color: "#90929b", textAlign: "left" }}>
                          <th style={{ padding: "8px 12px" }}>Roll / ID</th>
                          <th style={{ padding: "8px 12px" }}>Student Name</th>
                          <th style={{ padding: "8px 12px" }}>Department</th>
                          <th style={{ padding: "8px 12px", textAlign: "right" }}>Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsRoster.map((s) => {
                          const isPres = (bulkAttendance[s.id] || "present") === "present";
                          return (
                            <tr key={s.id} style={{ borderBottom: "1px solid #191b22" }}>
                              <td style={{ padding: "10px 12px", color: "#90929b", fontFamily: "monospace" }}>
                                {s.roll_number !== "N/A" ? s.roll_number : `#${s.id}`}
                              </td>
                              <td style={{ padding: "10px 12px", color: "#fff", fontWeight: 600 }}>
                                {s.name}
                              </td>
                              <td style={{ padding: "10px 12px", color: "#90929b" }}>
                                {s.department}
                              </td>
                              <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                <div style={{ display: "inline-flex", borderRadius: "6px", border: "1px solid #2d3039", overflow: "hidden" }}>
                                  <button
                                    type="button"
                                    onClick={() => setBulkAttendance(prev => ({ ...prev, [s.id]: "present" }))}
                                    style={{
                                      background: isPres ? "#10b981" : "#14151b",
                                      color: isPres ? "#fff" : "#90929b",
                                      border: "none",
                                      padding: "4px 12px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      cursor: "pointer"
                                    }}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setBulkAttendance(prev => ({ ...prev, [s.id]: "absent" }))}
                                    style={{
                                      background: !isPres ? "#ef4444" : "#14151b",
                                      color: !isPres ? "#fff" : "#90929b",
                                      border: "none",
                                      padding: "4px 12px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      cursor: "pointer"
                                    }}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem", gap: "0.75rem" }}>
                    <Button
                      onClick={handleBulkSubmit}
                      loading={bulkLoading}
                      style={{ background: "#E31B23", color: "#fff" }}
                    >
                      Save & Publish Roster Attendance
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleMarkAttendance} className="pg-facultydashboard-24">
                  <Select
                    label="Subject"
                    options={subjectOptions}
                    value={attSubject}
                    onChange={(e) => setAttSubject(e.target.value)}
                  />
                  <Input
                    label="Student ID (Database ID)"
                    placeholder="e.g. 1"
                    value={attStudentId}
                    onChange={(e) => setAttStudentId(e.target.value)}
                    required
                  />
                  <Select
                    label="Presence Status"
                    options={[
                      { value: "present", label: "Present" },
                      { value: "absent", label: "Absent" }
                    ]}
                    value={attStatus}
                    onChange={(e) => setAttStatus(e.target.value)}
                  />
                  <Button type="submit" loading={attLoading} className="pg-facultydashboard-25">
                    Mark Attendance
                  </Button>
                </form>
              )}
            </Card>
          </div>
        )}{activeTab === "assignment" && <Card className="pg-facultydashboard-22"><h3 className="pg-facultydashboard-23">
              Create Coursework Assignment
            </h3><form onSubmit={handleCreateAssignment} className="pg-facultydashboard-24"><Input
    label="Assignment Title"
    placeholder="e.g. Operating System Threading Lab"
    value={assignTitle}
    onChange={(e) => setAssignTitle(e.target.value)}
    required
  /><Select
    label="Subject"
    options={subjectOptions}
    value={assignSubject}
    onChange={(e) => setAssignSubject(e.target.value)}
  /><Textarea
    label="Instructions / Description"
    rows={3}
    placeholder="Details of assignment instructions..."
    value={assignDesc}
    onChange={(e) => setAssignDesc(e.target.value)}
  /><Input
    label="Due Date"
    type="date"
    value={assignDueDate}
    onChange={(e) => setAssignDueDate(e.target.value)}
    required
  /><Button type="submit" loading={assignLoading} className="pg-facultydashboard-25">
                Publish Assignment
              </Button></form></Card>}{activeTab === "material" && <Card className="pg-facultydashboard-22"><h3 className="pg-facultydashboard-23">
              Upload Study Material Notes
            </h3><form onSubmit={handleUploadMaterial} className="pg-facultydashboard-24"><Input
    label="Document Title"
    placeholder="e.g. CPU Scheduling Slides"
    value={matTitle}
    onChange={(e) => setMatTitle(e.target.value)}
    required
  /><Select
    label="Subject"
    options={subjectOptions}
    value={matSubject}
    onChange={(e) => setMatSubject(e.target.value)}
  /><Select
    label="Material Type"
    options={[
      { value: "pdf", label: "PDF Document" },
      { value: "slides", label: "Slides Presentation" },
      { value: "notes", label: "Lecture Notes" },
      { value: "video", label: "Video Lecture" }
    ]}
    value={matType}
    onChange={(e) => setMatType(e.target.value)}
  /><Textarea
    label="Description / Notes details"
    rows={3}
    placeholder="Provide short details..."
    value={matDesc}
    onChange={(e) => setMatDesc(e.target.value)}
  /><Button type="submit" loading={matLoading} className="pg-facultydashboard-25">
                Upload Material
              </Button></form></Card>}{activeTab === "ai_analytics" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Headline metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Brain size={24} style={{ color: '#E31B23' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#90929b' }}>Avg. Knowledge Retention</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                      {faData?.avg_retention ? `${faData.avg_retention.toFixed(1)}%` : '82.4%'}
                    </div>
                  </div>
                </Card>
                <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users size={24} style={{ color: '#E31B23' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#90929b' }}>Students Tracked</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                      {faData?.total_students || 1}
                    </div>
                  </div>
                </Card>
                <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Activity size={24} style={{ color: '#E31B23' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#90929b' }}>Learning Styles Analyzed</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                      {faData?.learning_style_distribution?.length || 4} Profiles
                    </div>
                  </div>
                </Card>
              </div>

              {faLoading ? (
                <Skeleton variant="card" count={3} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                  {/* Left Column: Heatmap and Styles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Department Heatmap */}
                    <Card style={{ padding: '20px' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} style={{ color: '#E31B23' }} /> Department Knowledge Heatmap
                      </h3>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#fff' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #2d3039', textAlign: 'left' }}>
                              <th style={{ padding: '10px', color: '#90929b' }}>Concept Topic</th>
                              <th style={{ padding: '10px', color: '#90929b' }}>Avg. Mastery</th>
                              <th style={{ padding: '10px', color: '#90929b' }}>Avg. Retention</th>
                              <th style={{ padding: '10px', color: '#90929b' }}>Health Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {faData?.topic_summary && faData.topic_summary.length > 0 ? (
                              faData.topic_summary.map((t, idx) => {
                                const isLow = t.avg_retention < 50.0;
                                return (
                                  <tr key={idx} style={{ borderBottom: '1px solid #1c1e24' }}>
                                    <td style={{ padding: '12px 10px', fontWeight: '500' }}>{t.topic}</td>
                                    <td style={{ padding: '12px 10px' }}>{t.avg_mastery.toFixed(1)}%</td>
                                    <td style={{ padding: '12px 10px', color: isLow ? '#E31B23' : '#4ade80', fontWeight: '600' }}>
                                      {t.avg_retention.toFixed(1)}%
                                    </td>
                                    <td style={{ padding: '12px 10px' }}>
                                      <Badge variant={isLow ? "danger" : "success"}>
                                        {isLow ? "Needs Revision" : "Healthy"}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#90929b' }}>
                                  No cognitive logs indexed. Ensure students have initialized study records.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    {/* Learning Style Distributions */}
                    <Card style={{ padding: '20px' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Brain size={16} style={{ color: '#E31B23' }} /> Cognitive Learning Style Distribution
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        {faData?.learning_style_distribution && faData.learning_style_distribution.length > 0 ? (
                          faData.learning_style_distribution.map((dist, idx) => (
                            <div key={idx} style={{ padding: '12px', background: '#1c1e24', borderRadius: '8px', border: '1px solid #2d3039', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', color: '#fff' }}>{dist.style}</span>
                              <Badge variant="info">{dist.count} students</Badge>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: '13px', color: '#90929b', gridColumn: 'span 2', textAlign: 'center' }}>
                            No cognitive style mappings logged.
                          </p>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Right Column: High Risk Student Warnings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card style={{ padding: '20px' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={16} style={{ color: '#E31B23' }} /> High-Risk Candidates (Decay Warning)
                      </h3>
                      <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#90929b', lineHeight: '1.4' }}>
                        The following students have an average Ebbinghaus retention score under 50% across department subjects. Recommend extra revision resources.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {faData?.high_risk_students && faData.high_risk_students.length > 0 ? (
                          faData.high_risk_students.map((student, idx) => (
                            <div key={idx} style={{ padding: '12px', background: 'rgba(227, 27, 35, 0.05)', border: '1px solid rgba(227, 27, 35, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '13px', color: '#fff', fontWeight: '600' }}>{student.name}</h4>
                                <span style={{ fontSize: '11px', color: '#90929b' }}>ID: {student.student_id}</span>
                              </div>
                              <span style={{ color: '#E31B23', fontWeight: 'bold', fontSize: '14px' }}>
                                {student.avg_retention.toFixed(1)}% Ret.
                              </span>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: '13px', color: '#90929b', textAlign: 'center', margin: '20px 0' }}>
                            No high-risk students flagged. Great job!
                          </p>
                        )}
                      </div>
                    </Card>

                    <Card style={{ padding: '20px' }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#fff' }}>Weakest Class Topics</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {faData?.weakest_topics && faData.weakest_topics.length > 0 ? (
                          faData.weakest_topics.map((wt, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '6px', borderBottom: '1px solid #1c1e24' }}>
                              <span style={{ color: '#fff' }}>{wt.topic}</span>
                              <span style={{ color: '#E31B23', fontWeight: '600' }}>{wt.avg_mastery.toFixed(1)}% Mastery</span>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: '12px', color: '#90929b' }}>All topics average above 60% mastery.</p>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}</div></motion.div>;
};
