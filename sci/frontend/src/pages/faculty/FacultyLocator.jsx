import "./FacultyLocator.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Card, Skeleton, Button, Input, Select, Tabs, Textarea } from "../../components/ui";
import {
  Search,
  MapPin,
  User,
  Clock,
  Calendar,
  Building,
  BookOpen,
  CheckCircle,
  XCircle,
  Plus,
  Edit3,
  Trash2,
  Activity,
  Laptop,
  Map,
  Mail,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export const FacultyLocator = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [searchLoading, setSearchLoading] = useState(true);

  // Faculty Only States
  const [myStatusData, setMyStatusData] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [myStatusLoading, setMyStatusLoading] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState("Available");
  const [applyLeaveType, setApplyLeaveType] = useState("Casual Leave");
  const [applyStartDate, setApplyStartDate] = useState("");
  const [applyEndDate, setApplyEndDate] = useState("");
  const [applyReason, setApplyReason] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);

  // Admin Only States
  const [adminFaculties, setAdminFaculties] = useState([]);
  const [adminLeaves, setAdminLeaves] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editStaffRoom, setEditStaffRoom] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [adminAddLeaveFacultyId, setAdminAddLeaveFacultyId] = useState("");
  const [adminAddLeaveType, setAdminAddLeaveType] = useState("Casual Leave");
  const [adminAddLeaveStartDate, setAdminAddLeaveStartDate] = useState("");
  const [adminAddLeaveEndDate, setAdminAddLeaveEndDate] = useState("");
  const [adminAddLeaveReason, setAdminAddLeaveReason] = useState("");
  const [adminAddLeaveStatus, setAdminAddLeaveStatus] = useState("Approved");
  const [adminAddLeaveLoading, setAdminAddLeaveLoading] = useState(false);

  const fetchSearch = async () => {
    setSearchLoading(true);
    try {
      const params = {};
      if (searchQuery) params.query = searchQuery;
      if (deptFilter) params.department = deptFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get("/faculty-locator/search", { params });
      setFaculties(response.data);
    } catch {
      toast.error("Failed to load faculty directory");
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchMyStatus = async () => {
    if (user?.role !== "faculty") return;
    setMyStatusLoading(true);
    try {
      const statusRes = await api.get("/faculty-locator/my-status");
      setMyStatusData(statusRes.data);
      setCustomStatusInput(statusRes.data.custom_status);
      const leavesRes = await api.get("/faculty-locator/leaves");
      setMyLeaves(leavesRes.data);
    } catch {
      toast.error("Failed to fetch status details");
    } finally {
      setMyStatusLoading(false);
    }
  };

  const fetchAdminData = async () => {
    if (user?.role !== "admin") return;
    setAdminLoading(true);
    try {
      const facsRes = await api.get("/faculty-locator/admin/faculties");
      setAdminFaculties(facsRes.data);
      const leavesRes = await api.get("/faculty-locator/admin/leaves");
      setAdminLeaves(leavesRes.data);
    } catch {
      toast.error("Failed to load admin locator panel");
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    fetchSearch();
  }, [searchQuery, deptFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === "search") {
      fetchSearch();
    } else if (activeTab === "my_status") {
      fetchMyStatus();
    } else if (activeTab === "admin") {
      fetchAdminData();
    }
  }, [activeTab]);

  const handleUpdateCustomStatus = async () => {
    try {
      await api.post("/faculty-locator/update-status", { custom_status: customStatusInput });
      toast.success("Availability updated successfully!");
      fetchMyStatus();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!applyStartDate || !applyEndDate) {
      toast.error("Choose start and end dates");
      return;
    }
    setApplyLoading(true);
    try {
      await api.post("/faculty-locator/apply-leave", {
        leave_type: applyLeaveType,
        start_date: applyStartDate,
        end_date: applyEndDate,
        reason: applyReason
      });
      toast.success("Leave submitted for approval");
      setApplyStartDate("");
      setApplyEndDate("");
      setApplyReason("");
      fetchMyStatus();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to file leave");
    } finally {
      setApplyLoading(false);
    }
  };

  const handleOpenEditProfile = (fac) => {
    setEditingFaculty(fac);
    setEditEmployeeId(fac.employee_id);
    setEditStaffRoom(fac.staff_room);
    setEditDept(fac.department);
  };

  const handleSaveProfileEdit = async (e) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setEditLoading(true);
    try {
      await api.post("/faculty-locator/admin/update-profile", {
        faculty_id: editingFaculty.id,
        employee_id: editEmployeeId,
        staff_room: editStaffRoom,
        department: editDept
      });
      toast.success("Faculty profile updated!");
      setEditingFaculty(null);
      fetchAdminData();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdateLeaveStatus = async (leaveId, statusVal) => {
    try {
      await api.put(`/faculty-locator/admin/leaves/${leaveId}/status`, { status: statusVal });
      toast.success(`Leave application ${statusVal.toLowerCase()}!`);
      fetchAdminData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/faculty-locator/admin/leaves/${leaveId}`);
      toast.success("Leave entry deleted.");
      fetchAdminData();
    } catch {
      toast.error("Failed to delete record");
    }
  };

  const handleAdminAddLeave = async (e) => {
    e.preventDefault();
    if (!adminAddLeaveFacultyId || !adminAddLeaveStartDate || !adminAddLeaveEndDate) {
      toast.error("Please fill in required fields");
      return;
    }
    setAdminAddLeaveLoading(true);
    try {
      await api.post("/faculty-locator/admin/leaves", {
        faculty_id: Number(adminAddLeaveFacultyId),
        leave_type: adminAddLeaveType,
        start_date: adminAddLeaveStartDate,
        end_date: adminAddLeaveEndDate,
        reason: adminAddLeaveReason,
        status: adminAddLeaveStatus
      });
      toast.success("Leave recorded successfully");
      setAdminAddLeaveFacultyId("");
      setAdminAddLeaveStartDate("");
      setAdminAddLeaveEndDate("");
      setAdminAddLeaveReason("");
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to record leave");
    } finally {
      setAdminAddLeaveLoading(false);
    }
  };

  const tabsList = [
    { id: "search", label: "Faculty Directory" },
    ...(user?.role === "faculty" ? [{ id: "my_status", label: "My Status & Leaves" }] : []),
    ...(user?.role === "admin" ? [{ id: "admin", label: "Admin Management" }] : [])
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="locator-container"
    >
      {/* Title Header */}
      <div className="locator-header">
        <div className="locator-title-row">
          <div className="locator-title-icon-box">
            <MapPin className="text-red" size={20} />
          </div>
          <h2 className="locator-title">Faculty Locator</h2>
        </div>
        <p className="locator-subtitle">
          Real-time campus location status, leave tracking, and weekly lecture schedules.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="locator-tabs-navigation">
        <div className="locator-tabs-wrapper">
          {tabsList.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`locator-tab-capsule-btn ${isActive ? "active" : ""}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="locator-panel-content">
        {activeTab === "search" && (
          <div className="locator-search-tab">
            {/* Horizontal Filters Bar */}
            <Card hoverGlow={false} className="locator-filters-card">
              <div className="locator-filters-flex-row">
                {/* Search Text Input */}
                <div className="locator-filter-col search-box">
                  <span className="locator-filter-label">Search Query</span>
                  <div className="locator-input-wrapper">
                    <Search size={14} className="locator-input-icon" />
                    <input
                      type="text"
                      placeholder="Search by name, employee ID, department, subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="locator-native-input"
                    />
                  </div>
                </div>

                {/* Department Select */}
                <div className="locator-filter-col">
                  <span className="locator-filter-label">Department</span>
                  <div className="locator-input-wrapper">
                    <Building size={14} className="locator-input-icon" />
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="locator-native-select"
                    >
                      <option value="">All Departments</option>
                      <option value="CSE">CSE Department</option>
                      <option value="ECE">ECE Department</option>
                      <option value="ME">ME Department</option>
                      <option value="IT">IT Department</option>
                    </select>
                    <ChevronDown size={14} className="locator-select-caret" />
                  </div>
                </div>

                {/* Status Select */}
                <div className="locator-filter-col">
                  <span className="locator-filter-label">Faculty Status</span>
                  <div className="locator-input-wrapper">
                    <User size={14} className="locator-input-icon" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="locator-native-select"
                    >
                      <option value="">All Statuses</option>
                      <option value="Available">Available</option>
                      <option value="Teaching">Teaching</option>
                      <option value="In Staff Room">In Staff Room</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Offline">Offline</option>
                    </select>
                    <ChevronDown size={14} className="locator-select-caret" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Faculties Feed */}
            {searchLoading ? (
              <div className="locator-loading-skeleton">
                <Skeleton variant="card" count={2} />
              </div>
            ) : faculties.length === 0 ? (
              <Card hoverGlow={false} className="locator-empty-card">
                <div className="locator-empty-icon-box">
                  <User size={24} />
                </div>
                <h4 className="locator-empty-title">No Faculty Found</h4>
                <p className="locator-empty-subtitle">
                  Try adjusting your keywords or filtering options to locate college faculty members.
                </p>
              </Card>
            ) : (
              <div className="locator-faculties-feed">
                {faculties.map((fac) => {
                  const initials = fac.name
                    ? fac.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "FS";
                  return (
                    <motion.div
                      key={fac.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card hoverGlow={false} className="locator-faculty-card">
                        <div className="locator-card-main-grid">
                          {/* Profile Column */}
                          <div className="locator-profile-section">
                            <div className="avatar-and-badge">
                              <div className="locator-avatar">{initials}</div>
                              <div className="locator-emp-id-badge">
                                {fac.employee_id || "ENP001"}
                              </div>
                            </div>
                            <div className="locator-profile-details">
                              <div className="locator-status-indicator">
                                <span className={`status-dot ${fac.status?.toLowerCase().replace(/\s+/g, "-")}`} />
                                <span className="status-text">{fac.status || "AVAILABLE"}</span>
                              </div>
                              <h4 className="locator-faculty-name">{fac.name}</h4>
                              <div className="locator-faculty-dept">
                                <Laptop size={13} className="locator-icon-grey" />
                                <span>{fac.department || "CSE"} Department</span>
                              </div>
                            </div>
                          </div>

                          {/* Current Location Column */}
                          <div className="locator-info-column">
                            <span className="column-title">CURRENT LOCATION</span>
                            <div className="column-content">
                              <div className="column-header-row">
                                <MapPin size={16} className="text-red" />
                                <span className="column-bold-text">
                                  {fac.status?.toLowerCase() === "teaching"
                                    ? fac.status_details?.classroom || "Classroom"
                                    : fac.status?.toLowerCase() === "on leave"
                                    ? "On Leave"
                                    : fac.status_details?.staff_room || "Staff Room"}
                                </span>
                              </div>
                              <span className="column-sub-text">
                                {fac.status?.toLowerCase() === "teaching"
                                  ? `${fac.status_details?.department || "CSE"} ${fac.status_details?.year || "I"}-${fac.status_details?.section || "A"}`
                                  : fac.status?.toLowerCase() === "on leave"
                                  ? `Return Date: ${fac.status_details?.return_date || "N/A"}`
                                  : "Block A, Room 101"}
                              </span>
                              <button
                                className="locator-btn-map"
                                onClick={() => toast.success("Opening staff room layout map...")}
                              >
                                <Map size={12} />
                                <span>View on Map</span>
                              </button>
                            </div>
                          </div>

                          {/* Next Scheduled Class Column */}
                          <div className="locator-info-column">
                            <span className="column-title">NEXT SCHEDULED CLASS</span>
                            <div className="column-content">
                              <div className="column-header-row">
                                <Calendar size={16} className="text-red" />
                                <span className="column-bold-text">
                                  {fac.status?.toLowerCase() === "teaching"
                                    ? fac.status_details?.subject || "Subject"
                                    : fac.status_details?.next_class?.subject || "No more classes"}
                                </span>
                              </div>
                              <span className="column-sub-text">
                                {fac.status?.toLowerCase() === "teaching"
                                  ? `Ends At: ${fac.status_details?.class_end_time || "N/A"}`
                                  : fac.status_details?.next_class
                                  ? `Room: ${fac.status_details.next_class.room} • ${fac.status_details.next_class.start_time}`
                                  : "scheduled today"}
                              </span>
                            </div>
                          </div>

                          {/* Weekly Schedule Column */}
                          <div className="locator-info-column weekly-schedule-column">
                            <span className="column-title">WEEKLY SCHEDULE</span>
                            <div className="weekly-schedule-grid">
                              {["MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, dIdx) => {
                                const isToday = new Date().getDay() === (dIdx + 1);
                                return (
                                  <div key={day} className="day-schedule-col">
                                    <span className="day-schedule-lbl">{day}</span>
                                    <div className={`day-schedule-dot ${isToday ? "active-today" : ""}`} />
                                  </div>
                                );
                              })}
                            </div>
                            <a
                              href="#"
                              className="locator-schedule-link"
                              onClick={(e) => {
                                e.preventDefault();
                                toast.success("Loading weekly lecture schedule...");
                              }}
                            >
                              <span>View Schedule</span>
                              <ArrowRight size={12} />
                            </a>
                          </div>
                        </div>

                        {/* Card Bottom Row */}
                        <div className="locator-card-bottom-row">
                          <div className="locator-expertise-section">
                            <BookOpen size={14} className="locator-icon-grey" />
                            <span className="expertise-lbl">COURSE EXPERTISE</span>
                            <div className="expertise-tags-list">
                              {fac.subjects && fac.subjects.length > 0 ? (
                                fac.subjects.map((sub, idx) => (
                                  <span key={idx} className="expertise-tag">
                                    {sub}
                                  </span>
                                ))
                              ) : (
                                <span className="expertise-empty-text">
                                  No subjects registered
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            className="locator-btn-contact"
                            onClick={() =>
                              toast.success(`Contacting ${fac.name} via official mail...`)
                            }
                          >
                            <Mail size={14} />
                            <span>Contact Faculty</span>
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Panel 2: Faculty Self Dashboard */}
        {activeTab === "my_status" && user?.role === "faculty" && (
          <div className="my-status-layout">
            <div className="my-status-left-col">
              {myStatusLoading ? (
                <Skeleton variant="card" />
              ) : myStatusData ? (
                <>
                  <Card className="status-config-card">
                    <h3 className="status-config-title">My Availability Status Override</h3>
                    <div className="status-override-row">
                      <div>
                        <p className="override-lbl">Current dynamic status</p>
                        <div className="current-status-badge">
                          <span className={`override-dot ${myStatusData.current_status?.toLowerCase().replace(/\s+/g, "-")}`} />
                          <span className="override-text">{myStatusData.current_status}</span>
                        </div>
                      </div>
                      <div className="override-actions-group">
                        <Select
                          label="Override Status"
                          options={[
                            { value: "Available", label: "Available" },
                            { value: "In Staff Room", label: "In Staff Room" },
                            { value: "Meeting", label: "In Meeting" },
                            { value: "Offline", label: "Offline" }
                          ]}
                          value={customStatusInput}
                          onChange={(e) => setCustomStatusInput(e.target.value)}
                        />
                        <Button onClick={handleUpdateCustomStatus} className="btn-save-override">
                          Save Update
                        </Button>
                      </div>
                    </div>
                    <p className="override-notice-text">
                      *Note: If you have an active teaching slot in the timetable or an approved leave record, the system will automatically overwrite your status to 'Teaching' or 'On Leave'.
                    </p>
                  </Card>

                  <Card className="status-config-card">
                    <h3 className="status-config-title">My Schedule (Today)</h3>
                    <p className="override-notice-text">
                      Lecture hours scheduled under your profile for today.
                    </p>
                    <div className="today-lectures-list">
                      {myStatusData.schedule_today?.map((s) => (
                        <div key={s.id} className="lecture-item-row">
                          <div>
                            <p className="lecture-subject">{s.subject}</p>
                            <p className="lecture-meta">
                              <span>Room {s.room}</span>
                              <span>•</span>
                              <span>Target: {s.class_details}</span>
                            </p>
                          </div>
                          <span className="lecture-time">
                            {s.start_time} - {s.end_time}
                          </span>
                        </div>
                      ))}
                      {myStatusData.schedule_today?.length === 0 && (
                        <p className="lectures-empty-text">
                          No classes scheduled to teach today.
                        </p>
                      )}
                    </div>
                  </Card>
                </>
              ) : null}

              <Card className="status-config-card">
                <h3 className="status-config-title">Leave Applications History</h3>
                <div className="leaves-table-wrapper">
                  <table className="leaves-data-table">
                    <thead>
                      <tr>
                        <th>Leave Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLeaves.map((l) => (
                        <tr key={l.id}>
                          <td className="bold-td">{l.leave_type}</td>
                          <td>{l.start_date}</td>
                          <td>{l.end_date}</td>
                          <td className="italic-td">{l.reason || "-"}</td>
                          <td>
                            <span className={`status-badge-val ${l.status?.toLowerCase()}`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {myLeaves.length === 0 && (
                        <tr>
                          <td colSpan={5} className="table-empty-td">
                            No leave applications filed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="my-status-right-col">
              <Card className="apply-leave-card">
                <h3 className="apply-leave-title">
                  <Calendar size={18} />
                  <span>Apply Leave</span>
                </h3>
                <form onSubmit={handleApplyLeave} className="apply-leave-form">
                  <Select
                    label="Leave Type"
                    options={[
                      { value: "Casual Leave", label: "Casual Leave" },
                      { value: "Sick Leave", label: "Sick Leave" },
                      { value: "Duty Leave", label: "Duty Leave" },
                      { value: "Privilege Leave", label: "Privilege Leave" }
                    ]}
                    value={applyLeaveType}
                    onChange={(e) => setApplyLeaveType(e.target.value)}
                  />
                  <Input
                    label="Start Date"
                    type="date"
                    value={applyStartDate}
                    onChange={(e) => setApplyStartDate(e.target.value)}
                    required
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={applyEndDate}
                    onChange={(e) => setApplyEndDate(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Reason / Remarks"
                    rows={3}
                    placeholder="Provide details regarding your leave application..."
                    value={applyReason}
                    onChange={(e) => setApplyReason(e.target.value)}
                  />
                  <Button type="submit" loading={applyLoading} className="btn-submit-leave">
                    Submit Application
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}

        {/* Panel 3: Admin Console */}
        {activeTab === "admin" && user?.role === "admin" && (
          <div className="admin-locator-layout">
            <div className="admin-locator-left-col">
              <Card className="status-config-card">
                <div className="admin-section-header">
                  <h3 className="status-config-title">Faculty Profile Directory</h3>
                  <p className="override-notice-text">
                    Manage room allocations, employee identifiers, and departments.
                  </p>
                </div>
                <div className="leaves-table-wrapper">
                  <table className="leaves-data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Emp ID</th>
                        <th>Department</th>
                        <th>Staff Room</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminFaculties.map((f) => (
                        <tr key={f.id}>
                          <td className="bold-td">
                            <p className="fac-bold-name">{f.name}</p>
                            <p className="fac-sub-email">{f.email}</p>
                          </td>
                          <td>{f.employee_id || "Not Set"}</td>
                          <td>{f.department || "Not Set"}</td>
                          <td>{f.staff_room || "Not Set"}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenEditProfile(f)}
                            >
                              <Edit3 size={12} />
                              <span>Configure</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {adminFaculties.length === 0 && (
                        <tr>
                          <td colSpan={5} className="table-empty-td">
                            No faculty records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Configure Faculty Profile Dialog */}
              <AnimatePresence>
                {editingFaculty && (
                  <div className="locator-modal-backdrop">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="locator-modal-card"
                    >
                      <h4 className="modal-title">Configure Profile: {editingFaculty.name}</h4>
                      <form onSubmit={handleSaveProfileEdit} className="apply-leave-form">
                        <Input
                          label="Employee ID"
                          value={editEmployeeId}
                          onChange={(e) => setEditEmployeeId(e.target.value)}
                          required
                        />
                        <Input
                          label="Staff Room Location"
                          value={editStaffRoom}
                          onChange={(e) => setEditStaffRoom(e.target.value)}
                          required
                        />
                        <Select
                          label="Department"
                          options={[
                            { value: "CSE", label: "Computer Science (CSE)" },
                            { value: "ECE", label: "Electronics (ECE)" },
                            { value: "ME", label: "Mechanical (ME)" },
                            { value: "IT", label: "Information Tech (IT)" }
                          ]}
                          value={editDept}
                          onChange={(e) => setEditDept(e.target.value)}
                        />
                        <div className="modal-actions-row">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEditingFaculty(null)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" loading={editLoading}>
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Leave Approvals Dashboard */}
              <Card className="status-config-card">
                <h3 className="status-config-title">Leave Applications Approval Dashboard</h3>
                <div className="leaves-table-wrapper">
                  <table className="leaves-data-table">
                    <thead>
                      <tr>
                        <th>Faculty</th>
                        <th>Leave Details</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLeaves.map((l) => (
                        <tr key={l.id}>
                          <td className="bold-td">
                            <p className="fac-bold-name">{l.faculty_name}</p>
                            <p className="fac-sub-email">{l.faculty_email}</p>
                          </td>
                          <td className="bold-td">
                            <p className="leave-type-val">{l.leave_type}</p>
                            <p className="leave-reason-val">"{l.reason || "No details"}"</p>
                          </td>
                          <td>{l.start_date}</td>
                          <td>{l.end_date}</td>
                          <td>
                            <span className={`status-badge-val ${l.status?.toLowerCase()}`}>
                              {l.status}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions-flex">
                              {l.status === "Pending" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateLeaveStatus(l.id, "Approved")}
                                    className="btn-admin-action approve"
                                    title="Approve Leave"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateLeaveStatus(l.id, "Rejected")}
                                    className="btn-admin-action reject"
                                    title="Reject Leave"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteLeave(l.id)}
                                className="btn-admin-action delete"
                                title="Delete Leave"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {adminLeaves.length === 0 && (
                        <tr>
                          <td colSpan={6} className="table-empty-td">
                            No leave applications recorded in system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="admin-locator-right-col">
              <Card className="apply-leave-card">
                <h3 className="apply-leave-title">
                  <Plus size={18} />
                  <span>Record Manual Leave</span>
                </h3>
                <form onSubmit={handleAdminAddLeave} className="apply-leave-form">
                  <Select
                    label="Select Faculty"
                    options={[
                      { value: "", label: "Choose Faculty..." },
                      ...adminFaculties.map((f) => ({
                        value: String(f.id),
                        label: `${f.name} (${f.employee_id})`
                      }))
                    ]}
                    value={String(adminAddLeaveFacultyId)}
                    onChange={(e) =>
                      setAdminAddLeaveFacultyId(e.target.value ? Number(e.target.value) : "")
                    }
                    required
                  />
                  <Select
                    label="Leave Type"
                    options={[
                      { value: "Casual Leave", label: "Casual Leave" },
                      { value: "Sick Leave", label: "Sick Leave" },
                      { value: "Duty Leave", label: "Duty Leave" },
                      { value: "Privilege Leave", label: "Privilege Leave" }
                    ]}
                    value={adminAddLeaveType}
                    onChange={(e) => setAdminAddLeaveType(e.target.value)}
                  />
                  <Input
                    label="Start Date"
                    type="date"
                    value={adminAddLeaveStartDate}
                    onChange={(e) => setAdminAddLeaveStartDate(e.target.value)}
                    required
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={adminAddLeaveEndDate}
                    onChange={(e) => setAdminAddLeaveEndDate(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Reason / Remarks"
                    rows={3}
                    placeholder="Context for recording leave..."
                    value={adminAddLeaveReason}
                    onChange={(e) => setAdminAddLeaveReason(e.target.value)}
                  />
                  <Select
                    label="Initial Status"
                    options={[
                      { value: "Approved", label: "Approved (Immediate)" },
                      { value: "Pending", label: "Pending Approval" }
                    ]}
                    value={adminAddLeaveStatus}
                    onChange={(e) => setAdminAddLeaveStatus(e.target.value)}
                  />
                  <Button type="submit" loading={adminAddLeaveLoading} className="btn-submit-leave">
                    Record Leave
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
