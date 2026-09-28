import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import { Card, Button, Badge, Skeleton } from "../../components/ui";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  Grid,
  Building,
  Calendar,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  Filter
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import "./ManualRecordManager.css";

export const ManualRecordManager = () => {
  const [activeEntity, setActiveEntity] = useState("students");
  const [metadata, setMetadata] = useState({
    departments: [],
    classrooms: [],
    faculty: [],
    subjects: [],
    sections: [],
    guardians: []
  });

  // Table State
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [semFilter, setSemFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Timetable Specific State
  const [ttDepartment, setTtDepartment] = useState("");
  const [ttSemester, setTtSemester] = useState(1);
  const [ttSection, setTtSection] = useState("A");
  const [ttDay, setTtDay] = useState("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  // Form State
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [conflictWarning, setConflictWarning] = useState(null);

  // Fetch Metadata for dropdowns
  const fetchMetadata = async () => {
    try {
      const res = await api.get("/admin/management-metadata");
      setMetadata(res.data);
      if (res.data.departments.length > 0 && !ttDepartment) {
        setTtDepartment(res.data.departments[0].code);
      }
    } catch (err) {
      console.error("Failed to load metadata", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Fetch Entity Records
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setConflictWarning(null);
    try {
      if (activeEntity === "students") {
        const params = {
          page,
          limit: pageSize,
          q: searchQuery || undefined,
          department: deptFilter !== "all" ? deptFilter : undefined,
          semester: semFilter !== "all" ? parseInt(semFilter) : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined
        };
        const res = await api.get("/admin/students", { params });
        setItems(res.data.students || []);
        setTotalCount(res.data.total || 0);
      } else if (activeEntity === "faculty") {
        const params = {
          q: searchQuery || undefined,
          department: deptFilter !== "all" ? deptFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined
        };
        const res = await api.get("/admin/faculty", { params });
        setItems(res.data || []);
        setTotalCount(res.data?.length || 0);
      } else if (activeEntity === "guardians") {
        const params = {
          q: searchQuery || undefined
        };
        const res = await api.get("/admin/guardians", { params });
        setItems(res.data || []);
        setTotalCount(res.data?.length || 0);
      } else if (activeEntity === "departments") {
        const res = await api.get("/admin/departments");
        let data = res.data || [];
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          data = data.filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
        }
        setItems(data);
        setTotalCount(data.length);
      } else if (activeEntity === "subjects") {
        const params = {
          q: searchQuery || undefined,
          department_id: deptFilter !== "all" ? parseInt(deptFilter) : undefined,
          semester: semFilter !== "all" ? parseInt(semFilter) : undefined
        };
        const res = await api.get("/admin/subjects", { params });
        setItems(res.data || []);
        setTotalCount(res.data?.length || 0);
      } else if (activeEntity === "sections") {
        const params = {
          department_id: deptFilter !== "all" ? parseInt(deptFilter) : undefined,
          semester: semFilter !== "all" ? parseInt(semFilter) : undefined
        };
        const res = await api.get("/admin/sections", { params });
        setItems(res.data || []);
        setTotalCount(res.data?.length || 0);
      } else if (activeEntity === "classrooms") {
        const res = await api.get("/admin/classrooms");
        let data = res.data || [];
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          data = data.filter(c => c.room_number.toLowerCase().includes(q) || c.building.toLowerCase().includes(q));
        }
        setItems(data);
        setTotalCount(data.length);
      } else if (activeEntity === "timetable") {
        const params = {
          department: ttDepartment || undefined,
          semester: ttSemester ? parseInt(ttSemester) : undefined,
          section: ttSection || undefined,
          day: ttDay !== "all" ? ttDay : undefined
        };
        const res = await api.get("/admin/timetable/entries", { params });
        setItems(res.data || []);
        setTotalCount(res.data?.length || 0);
      }
    } catch (err) {
      toast.error("Failed to load records.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeEntity, page, searchQuery, deptFilter, semFilter, statusFilter, ttDepartment, ttSemester, ttSection, ttDay]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Open Create Modal with default schema
  const openCreateModal = () => {
    setFormErrors({});
    setConflictWarning(null);
    if (activeEntity === "students") {
      setFormData({
        name: "",
        email: "",
        department: metadata.departments[0]?.code || "CSE",
        semester: 1,
        section: "A",
        phone_number: "",
        roll_number: "",
        password: "Campus@123",
        custom_status: "Active",
        is_hostel_resident: false,
        guardian_mode: "new",
        guardian_id: null,
        guardian_name: "",
        guardian_email: "",
        guardian_phone: ""
      });
    } else if (activeEntity === "guardians") {
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        student_roll_numbers_str: "",
        password: "Campus@123"
      });
    } else if (activeEntity === "faculty") {
      setFormData({
        name: "",
        email: "",
        department: metadata.departments[0]?.code || "CSE",
        employee_id: "",
        staff_room: "Staff Room 101",
        max_workload: 18,
        password: "Campus@123",
        custom_status: "Active"
      });
    } else if (activeEntity === "departments") {
      setFormData({
        name: "",
        code: "",
        description: "",
        hod_name: "",
        department_block: "Main Academic Block",
        total_semesters: 8,
        active: 1
      });
    } else if (activeEntity === "subjects") {
      setFormData({
        name: "",
        code: "",
        department_id: metadata.departments[0]?.id || 1,
        semester: 1,
        credits: 3,
        weekly_hours: 4,
        is_lab: false,
        faculty_id: metadata.faculty[0]?.id || null
      });
    } else if (activeEntity === "sections") {
      setFormData({
        department_id: metadata.departments[0]?.id || 1,
        semester: 1,
        section_name: "A",
        student_strength: 60,
        permanent_room_id: metadata.classrooms[0]?.id || null
      });
    } else if (activeEntity === "classrooms") {
      setFormData({
        room_number: "",
        building: "Main Academic Block",
        floor: 1,
        capacity: 60,
        room_type: "THEORY",
        is_lab: false,
        has_projector: true,
        has_smartboard: false,
        has_ac: false,
        has_internet: true,
        is_accessible: true,
        maintenance_status: "active",
        active: true
      });
    } else if (activeEntity === "timetable") {
      setFormData({
        department: ttDepartment || metadata.departments[0]?.code || "CSE",
        semester: ttSemester || 1,
        section: ttSection || "A",
        day: "Monday",
        period: 1,
        start_time: "09:00",
        end_time: "10:00",
        subject: metadata.subjects[0]?.name || "",
        faculty: metadata.faculty[0]?.name || "",
        room: metadata.classrooms[0]?.room_number || ""
      });
    }
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const openEditModal = (record) => {
    setSelectedRecord(record);
    setFormErrors({});
    setConflictWarning(null);
    if (activeEntity === "students") {
      setFormData({
        ...record,
        is_hostel_resident: !!record.guardian_id,
        guardian_mode: record.guardian_id ? "existing" : "new",
        guardian_id: record.guardian_id || null,
        guardian_name: record.guardian_name || "",
        guardian_email: record.guardian_email || "",
        guardian_phone: record.guardian_phone || ""
      });
    } else if (activeEntity === "guardians") {
      setFormData({
        ...record,
        student_roll_numbers_str: (record.wards || []).map(w => w.roll_number).join(", ")
      });
    } else {
      setFormData({ ...record });
    }
    setShowEditModal(true);
  };

  // Handle Form Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setConflictWarning(null);

    try {
      if (showCreateModal) {
        if (activeEntity === "students") {
          await api.post("/admin/students", formData);
          toast.success("Student admission registered successfully!");
        } else if (activeEntity === "guardians") {
          const payload = {
            name: formData.name,
            email: formData.email,
            phone_number: formData.phone_number,
            password: formData.password || "Campus@123",
            student_roll_numbers: formData.student_roll_numbers_str
              ? formData.student_roll_numbers_str.split(",").map(s => s.trim()).filter(Boolean)
              : []
          };
          await api.post("/admin/guardians", payload);
          toast.success("Hostel guardian registered & linked to student wards!");
        } else if (activeEntity === "faculty") {
          await api.post("/admin/faculty", formData);
          toast.success("Faculty member registered successfully!");
        } else if (activeEntity === "departments") {
          await api.post("/admin/departments", formData);
          toast.success("Department created successfully!");
        } else if (activeEntity === "subjects") {
          await api.post("/admin/subjects", formData);
          toast.success("Subject created successfully!");
        } else if (activeEntity === "sections") {
          await api.post("/admin/sections", formData);
          toast.success("Section created successfully!");
        } else if (activeEntity === "classrooms") {
          await api.post("/admin/classrooms", formData);
          toast.success("Classroom created successfully!");
        } else if (activeEntity === "timetable") {
          await api.post("/admin/timetable/entries", formData);
          toast.success("Timetable slot scheduled with 0 conflicts!");
        }
        setShowCreateModal(false);
      } else if (showEditModal) {
        const id = selectedRecord.id;
        if (activeEntity === "students") {
          await api.put(`/admin/students/${id}`, formData);
          toast.success("Student details updated!");
        } else if (activeEntity === "guardians") {
          const payload = {
            name: formData.name,
            email: formData.email,
            phone_number: formData.phone_number,
            student_roll_numbers: formData.student_roll_numbers_str
              ? formData.student_roll_numbers_str.split(",").map(s => s.trim()).filter(Boolean)
              : []
          };
          await api.put(`/admin/guardians/${id}`, payload);
          toast.success("Guardian profile updated!");
        } else if (activeEntity === "faculty") {
          await api.put(`/admin/faculty/${id}`, formData);
          toast.success("Faculty record updated!");
        } else if (activeEntity === "departments") {
          await api.put(`/admin/departments/${id}`, formData);
          toast.success("Department details updated!");
        } else if (activeEntity === "subjects") {
          await api.put(`/admin/subjects/${id}`, formData);
          toast.success("Subject details updated!");
        } else if (activeEntity === "sections") {
          await api.put(`/admin/sections/${id}`, formData);
          toast.success("Section details updated!");
        } else if (activeEntity === "classrooms") {
          await api.put(`/admin/classrooms/${id}`, formData);
          toast.success("Classroom details updated!");
        }
        setShowEditModal(false);
      }
      fetchRecords();
      fetchMetadata();
    } catch (err) {
      if (err.response?.status === 409) {
        // Timetable 3-way conflict detected!
        setConflictWarning(err.response.data.detail);
        toast.error("Timetable Conflict Detected!");
      } else {
        const msg = err.response?.data?.detail || "Operation failed. Please review fields.";
        toast.error(typeof msg === "string" ? msg : "Validation error.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete / Deactivate confirmation
  const confirmDelete = (record, permanent = false) => {
    setRecordToDelete(record);
    setIsPermanentDelete(permanent);
    setShowDeleteModal(true);
  };

  // Execute Delete / Deactivate
  const handleDelete = async () => {
    if (!recordToDelete) return;
    setSubmitting(true);
    try {
      const id = recordToDelete.id;
      if (activeEntity === "students") {
        await api.delete(`/admin/students/${id}?permanent=${isPermanentDelete}`);
        toast.success(isPermanentDelete ? "Student record deleted permanently." : "Student account deactivated.");
      } else if (activeEntity === "guardians") {
        await api.delete(`/admin/guardians/${id}?permanent=${isPermanentDelete}`);
        toast.success(isPermanentDelete ? "Guardian deleted permanently." : "Guardian account deactivated.");
      } else if (activeEntity === "faculty") {
        await api.delete(`/admin/faculty/${id}?permanent=${isPermanentDelete}`);
        toast.success(isPermanentDelete ? "Faculty deleted permanently." : "Faculty account deactivated.");
      } else if (activeEntity === "departments") {
        await api.delete(`/admin/departments/${id}`);
        toast.success("Department deleted.");
      } else if (activeEntity === "subjects") {
        await api.delete(`/admin/subjects/${id}`);
        toast.success("Subject deleted.");
      } else if (activeEntity === "sections") {
        await api.delete(`/admin/sections/${id}`);
        toast.success("Section deleted.");
      } else if (activeEntity === "classrooms") {
        await api.delete(`/admin/classrooms/${id}`);
        toast.success("Classroom deleted.");
      } else if (activeEntity === "timetable") {
        await api.delete(`/admin/timetable/entries/${id}`);
        toast.success("Timetable slot removed.");
      }
      setShowDeleteModal(false);
      fetchRecords();
      fetchMetadata();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete record.");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle soft status (Active <-> Inactive)
  const toggleStatus = async (record) => {
    const newStatus = record.custom_status === "Inactive" ? "Active" : "Inactive";
    try {
      if (activeEntity === "students") {
        await api.put(`/admin/students/${record.id}`, { custom_status: newStatus });
        toast.success(`Student status set to ${newStatus}`);
      } else if (activeEntity === "faculty") {
        await api.put(`/admin/faculty/${record.id}`, { custom_status: newStatus });
        toast.success(`Faculty status set to ${newStatus}`);
      } else if (activeEntity === "guardians") {
        await api.delete(`/admin/guardians/${record.id}?permanent=false`);
        toast.success(`Guardian status set to Inactive`);
      }
      fetchRecords();
    } catch (err) {
      toast.error("Failed to toggle status.");
    }
  };

  const entityTabs = [
    { id: "students", label: "Students", icon: GraduationCap, badge: "Admission" },
    { id: "faculty", label: "Faculty", icon: Users, badge: "Staff" },
    { id: "guardians", label: "Hostel Guardians", icon: ShieldCheck, badge: metadata.guardians?.length || "Hostel" },
    { id: "departments", label: "Departments", icon: School, badge: metadata.departments.length },
    { id: "subjects", label: "Subjects", icon: BookOpen, badge: metadata.subjects.length },
    { id: "sections", label: "Sections", icon: Grid, badge: metadata.sections.length },
    { id: "classrooms", label: "Classrooms", icon: Building, badge: metadata.classrooms.length },
    { id: "timetable", label: "Timetable", icon: Calendar, badge: "Schedule" }
  ];

  return (
    <div className="manual-record-manager">
      {/* Entity Selector Tabs */}
      <div className="entity-nav-scroll-wrapper">
        <div className="entity-nav-tabs">
          {entityTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeEntity === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveEntity(tab.id);
                  setPage(1);
                  setSearchQuery("");
                }}
                className={`entity-nav-pill ${isActive ? "entity-nav-pill-active" : ""}`}
              >
                <div className="entity-pill-icon-box">
                  <TabIcon size={16} />
                </div>
                <span className="entity-pill-label">{tab.label}</span>
                <span className="entity-pill-badge">{tab.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control & Filter Bar */}
      <Card className="manual-controls-card p-4 mb-6">
        <div className="manual-controls-flex">
          {/* Search Bar */}
          {activeEntity !== "timetable" ? (
            <div className="manual-search-wrapper">
              <Search size={15} className="manual-search-icon" />
              <input
                type="text"
                placeholder={`Search ${activeEntity}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="manual-search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="clear-search-btn">
                  <X size={13} />
                </button>
              )}
            </div>
          ) : (
            /* Timetable Specific Quick Filters */
            <div className="timetable-scope-selectors">
              <div className="scope-field">
                <span className="scope-label">Dept:</span>
                <select
                  value={ttDepartment}
                  onChange={(e) => setTtDepartment(e.target.value)}
                  className="scope-select"
                >
                  {metadata.departments.map((d) => (
                    <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>

              <div className="scope-field">
                <span className="scope-label">Sem:</span>
                <select
                  value={ttSemester}
                  onChange={(e) => setTtSemester(parseInt(e.target.value))}
                  className="scope-select"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Sem {s}</option>
                  ))}
                </select>
              </div>

              <div className="scope-field">
                <span className="scope-label">Section:</span>
                <select
                  value={ttSection}
                  onChange={(e) => setTtSection(e.target.value)}
                  className="scope-select"
                >
                  {["A", "B", "C", "D"].map((sec) => (
                    <option key={sec} value={sec}>Sec {sec}</option>
                  ))}
                </select>
              </div>

              <div className="scope-field">
                <span className="scope-label">Day:</span>
                <select
                  value={ttDay}
                  onChange={(e) => setTtDay(e.target.value)}
                  className="scope-select"
                >
                  <option value="all">All Days</option>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Dynamic Filters for other entities */}
          {["students", "faculty", "subjects", "sections"].includes(activeEntity) && (
            <div className="manual-filters-row">
              {["students", "faculty", "subjects", "sections"].includes(activeEntity) && (
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="manual-filter-select"
                >
                  <option value="all">All Departments</option>
                  {metadata.departments.map((d) => (
                    <option key={d.id} value={activeEntity === "students" || activeEntity === "faculty" ? d.code : d.id}>
                      {d.code}
                    </option>
                  ))}
                </select>
              )}

              {["students", "subjects", "sections"].includes(activeEntity) && (
                <select
                  value={semFilter}
                  onChange={(e) => setSemFilter(e.target.value)}
                  className="manual-filter-select"
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              )}

              {["students", "faculty"].includes(activeEntity) && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="manual-filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="manual-action-btns">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecords}
              className="refresh-btn"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="add-new-record-btn"
            >
              <Plus size={14} />
              <span>
                {activeEntity === "students" && "New Admission"}
                {activeEntity === "guardians" && "Add Guardian"}
                {activeEntity === "faculty" && "Add Faculty"}
                {activeEntity === "departments" && "New Department"}
                {activeEntity === "subjects" && "Add Subject"}
                {activeEntity === "sections" && "Add Section"}
                {activeEntity === "classrooms" && "Add Classroom"}
                {activeEntity === "timetable" && "Add Schedule Slot"}
              </span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table Content */}
      <Card className="manual-table-card p-0">
        <div className="manual-table-wrapper">
          {loading ? (
            <div className="table-loading-skeleton p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg bg-slate-800/40" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="empty-table-state py-16 text-center">
              <div className="empty-icon-circle mx-auto mb-3">
                <Search size={24} className="text-slate-500" />
              </div>
              <h4 className="text-base font-bold text-slate-200">No {activeEntity} found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No records match your search criteria. Create a new entry manually or clear filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={openCreateModal}
                className="mt-4"
              >
                <Plus size={13} className="mr-1.5" />
                Add Record Now
              </Button>
            </div>
          ) : (
            <table className="manual-data-table">
              <thead>
                <tr>
                  {activeEntity === "students" && (
                    <>
                      <th>Student Profile</th>
                      <th>Roll Number</th>
                      <th>Department</th>
                      <th>Sem & Sec</th>
                      <th>Contact</th>
                      <th>Hostel Guardian</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </>
                  )}
                  {activeEntity === "guardians" && (
                    <>
                      <th>Guardian Profile</th>
                      <th>Emergency Mobile (SMS OTP)</th>
                      <th>Linked Student Wards</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </>
                  )}
                  {activeEntity === "faculty" && (
                    <>
                      <th>Faculty Profile</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Staff Room</th>
                      <th>Workload</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </>
                  )}
                  {activeEntity === "departments" && (
                    <>
                      <th>Code</th>
                      <th>Department Name</th>
                      <th>HOD In-Charge</th>
                      <th>Block Location</th>
                      <th>Semesters</th>
                      <th>Enrolled Students</th>
                      <th>Faculty</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </>
                  )}
                  {activeEntity === "subjects" && (
                    <>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Credits</th>
                      <th>Hours/Wk</th>
                      <th>Type</th>
                      <th>Assigned Faculty</th>
                      <th className="text-right">Actions</th>
                    </>
                  )}
                  {activeEntity === "sections" && (
                    <>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Section Name</th>
                      <th>Student Strength</th>
                      <th>Permanent Classroom</th>
                      <th className="text-right">Actions</th>
                    </>
                  )}
                  {activeEntity === "classrooms" && (
                    <>
                      <th>Room Number</th>
                      <th>Building & Floor</th>
                      <th>Capacity</th>
                      <th>Room Type</th>
                      <th>Equipped Amenities</th>
                      <th>Maintenance</th>
                      <th className="text-right">Actions</th>
                    </>
                  )}
                  {activeEntity === "timetable" && (
                    <>
                      <th>Day</th>
                      <th>Period & Time</th>
                      <th>Subject</th>
                      <th>Instructor</th>
                      <th>Allocated Room</th>
                      <th>Group Target</th>
                      <th className="text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    {/* Students Row */}
                    {activeEntity === "students" && (
                      <>
                        <td>
                          <div className="record-user-profile">
                            <div className="user-avatar-initials">
                              {row.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="user-name-text block">{row.name}</span>
                              <span className="user-email-text block">{row.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="mono-code-badge font-mono">{row.roll_number}</span>
                        </td>
                        <td>
                          <Badge variant="outline">{row.department || "N/A"}</Badge>
                        </td>
                        <td>
                          <span className="text-xs font-semibold text-slate-300">
                            Sem {row.semester} • Sec {row.section}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-400 font-mono">
                            {row.phone_number || "—"}
                          </span>
                        </td>
                        <td>
                          {row.guardian_name ? (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                                <span className="text-xs font-bold text-slate-200 truncate max-w-[130px]" title={row.guardian_name}>
                                  {row.guardian_name}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {row.guardian_phone || row.guardian_email || "Linked"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Day Scholar / Unlinked</span>
                          )}
                        </td>
                        <td>
                          <Badge variant={row.custom_status === "Active" ? "success" : "danger"}>
                            {row.custom_status || "Active"}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <div className="row-action-btn-group">
                            <button
                              onClick={() => openEditModal(row)}
                              className="action-icon-btn edit-icon-btn"
                              title="Edit Student"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => toggleStatus(row)}
                              className={`action-icon-btn ${row.custom_status === "Active" ? "deactivate-icon-btn" : "activate-icon-btn"}`}
                              title={row.custom_status === "Active" ? "Deactivate" : "Activate"}
                            >
                              <Power size={13} />
                            </button>
                            <button
                              onClick={() => confirmDelete(row, true)}
                              className="action-icon-btn delete-icon-btn"
                              title="Permanent Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {/* Guardians Row */}
                    {activeEntity === "guardians" && (
                      <>
                        <td>
                          <div className="record-user-profile">
                            <div className="user-avatar-initials guardian-avatar-initials">
                              {row.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="user-name-text block">{row.name}</span>
                              <span className="user-email-text block">{row.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                            <Phone size={12} className="text-emerald-400" />
                            {row.phone_number || "—"}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {row.wards && row.wards.length > 0 ? (
                              row.wards.map((w) => (
                                <span key={w.id} className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded text-[11px] text-slate-300">
                                  <GraduationCap size={11} className="text-red-400" />
                                  <span>{w.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({w.roll_number})</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 italic">No student wards linked</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge variant={row.custom_status === "Active" ? "success" : "danger"}>
                            {row.custom_status || "Active"}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <div className="row-action-btn-group">
                            <button
                              onClick={() => openEditModal(row)}
                              className="action-icon-btn edit-icon-btn"
                              title="Edit Guardian"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => toggleStatus(row)}
                              className={`action-icon-btn ${row.custom_status === "Active" ? "deactivate-icon-btn" : "activate-icon-btn"}`}
                              title={row.custom_status === "Active" ? "Deactivate" : "Activate"}
                            >
                              <Power size={13} />
                            </button>
                            <button
                              onClick={() => confirmDelete(row, true)}
                              className="action-icon-btn delete-icon-btn"
                              title="Delete Guardian"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {/* Faculty Row */}
                    {activeEntity === "faculty" && (
                      <>
                        <td>
                          <div className="record-user-profile">
                            <div className="user-avatar-initials faculty-avatar-initials">
                              {row.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="user-name-text block">{row.name}</span>
                              <span className="user-email-text block">{row.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="mono-code-badge font-mono">{row.employee_id}</span>
                        </td>
                        <td>
                          <Badge variant="outline">{row.department || "General"}</Badge>
                        </td>
                        <td>
                          <span className="text-xs text-slate-300 font-medium">
                            {row.staff_room || "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs font-bold text-slate-400">
                            {row.max_workload} hrs/wk
                          </span>
                        </td>
                        <td>
                          <Badge variant={row.custom_status === "Active" ? "success" : "danger"}>
                            {row.custom_status || "Active"}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <div className="row-action-btn-group">
                            <button
                              onClick={() => openEditModal(row)}
                              className="action-icon-btn edit-icon-btn"
                              title="Edit Faculty"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => toggleStatus(row)}
                              className={`action-icon-btn ${row.custom_status === "Active" ? "deactivate-icon-btn" : "activate-icon-btn"}`}
                              title={row.custom_status === "Active" ? "Deactivate" : "Activate"}
                            >
                              <Power size={13} />
                            </button>
                            <button
                              onClick={() => confirmDelete(row, true)}
                              className="action-icon-btn delete-icon-btn"
                              title="Permanent Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {/* Department Row */}
                    {activeEntity === "departments" && (
                      <>
                        <td>
                          <span className="mono-code-badge font-mono font-bold text-red-400">
                            {row.code}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold text-slate-200 block text-xs">{row.name}</span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-xs">{row.description || "—"}</span>
                        </td>
                        <td>
                          <span className="text-xs font-semibold text-slate-300">{row.hod_name || "Unassigned"}</span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-400">{row.department_block || "Main"}</span>
                        </td>
                        <td>
                          <span className="text-xs font-bold text-slate-300">{row.total_semesters} Sems</span>
                        </td>
                        <td>
                          <span className="text-xs font-bold text-emerald-400">{row.student_count} Students</span>
                        </td>
                        <td>
                          <span className="text-xs font-bold text-indigo-400">{row.faculty_count} Faculty</span>
                        </td>
                        <td>
                          <Badge variant={row.active ? "success" : "secondary"}>
                            {row.active ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <div className="row-action-btn-group">
                            <button
                              onClick={() => openEditModal(row)}
                              className="action-icon-btn edit-icon-btn"
                              title="Edit Department"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => confirmDelete(row, true)}
                              className="action-icon-btn delete-icon-btn"
                              title="Delete Department"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {/* Subject Row */}
                    {activeEntity === "subjects" && (
                      <>
                        <td>
                          <span className="mono-code-badge font-mono font-bold text-purple-400">
                            {row.code}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold text-slate-200 block text-xs">{row.name}</span>
                        </td>
                        <td>
                          <Badge variant="outline">{row.department_code || "GEN"}</Badge>
                        </td>
                        <td>
                          <span className="text-xs font-bold text-slate-300">Sem {row.semester}</span>
                        </td>
                        <td>
                          <span className="text-xs font-bold text-amber-400">{row.credits || 3} Credits</span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-400">{row.weekly_hours} hrs</span>
                        </td>
                        <td>
                          <Badge variant={row.is_lab ? "secondary" : "outline"}>
                            {row.is_lab ? "LAB" : "THEORY"}
                          </Badge>
                        </td>
                        <td>
                          <span className="text-xs text-slate-300 font-medium">
                            {row.faculty_name}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="row-action-btn-group">
                            <button
                              onClick={() => openEditModal(row)}
                              className="action-icon-btn edit-icon-btn"
                              title="Edit Subject"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => confirmDelete(row, true)}
                              className="action-icon-btn delete-icon-btn"
                              title="Delete Subject"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {/* Section Row */}
                    {activeEntity === "sections" && (
                      <>
                        <td>
                          <Badge variant="outline">{row.department_code || "GEN"}</Badge>
                        </td>
                        <td>
                          <span className="text-xs font-bold text-slate-300">Semester {row.semester}</span>
                        </td>
                        <td>
                          <span className="mono-code-badge font-mono font-bold text-blue-400">
                            Section {row.section_name}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs font-semibold text-slate-300">
                            {row.student_strength} Max Students
                          </span>
                        </td>
                        <td>
                          <span className="text-xs font-semibold text-emerald-400">
                            Room {row.permanent_room_number}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="row-action-btn-group">
                            <button
                              onClick={() => openEditModal(row)}
                              className="action-icon-btn edit-icon-btn"
                              title="Edit Section"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => confirmDelete(row, true)}
                              className="action-icon-btn delete-icon-btn"
                              title="Delete Section"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {/* Classroom Row */}
                    {activeEntity === "classrooms" && (
                      <>
                        <td>
                          <span className="mono-code-badge font-mono font-bold text-cyan-400">
                            {row.room_number}
                          </span>
                        </td>
                        <td>
                          <span className="font-medium text-slate-200 text-xs block">{row.building}</span>
                          <span className="text-[11px] text-slate-500 block">Floor {row.floor}</span>
                        </td>
                        <td>
                          <span className="text-xs font-bold text-slate-300">{row.capacity} Seats</span>
                        </td>
                        <td>
                          <Badge variant={row.is_lab || row.room_type === "LAB" ? "secondary" : "outline"}>
                            {row.room_type || (row.is_lab ? "LAB" : "THEORY")}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {row.has_projector && <span className="amenity-chip">Projector</span>}
                            {row.has_smartboard && <span className="amenity-chip">Smartboard</span>}
                            {row.has_ac && <span className="amenity-chip">A/C</span>}
                            {row.has_internet && <span className="amenity-chip">WiFi</span>}
                          </div>
                        </td>
                        <td>
                          <Badge variant={row.maintenance_status === "active" ? "success" : "danger"}>
                            {row.maintenance_status?.toUpperCase() || "ACTIVE"}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <div className="row-action-btn-group">
                            <button
                              onClick={() => openEditModal(row)}
                              className="action-icon-btn edit-icon-btn"
                              title="Edit Classroom"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => confirmDelete(row, true)}
                              className="action-icon-btn delete-icon-btn"
                              title="Delete Classroom"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {/* Timetable Row */}
                    {activeEntity === "timetable" && (
                      <>
                        <td>
                          <span className="day-tag-badge">{row.day}</span>
                        </td>
                        <td>
                          <div className="period-time-badge">
                            <Clock size={11} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-200">
                              {row.start_time} - {row.end_time}
                            </span>
                            <span className="text-[10px] text-slate-500">P{row.period}</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-bold text-slate-200 text-xs">{row.subject}</span>
                        </td>
                        <td>
                          <span className="text-xs font-semibold text-slate-300">{row.faculty}</span>
                        </td>
                        <td>
                          <span className="mono-code-badge font-mono text-cyan-400">
                            {row.room}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs font-medium text-slate-400">
                            Sem {row.semester} • Sec {row.section}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="row-action-btn-group">
                            <button
                              onClick={() => confirmDelete(row, true)}
                              className="action-icon-btn delete-icon-btn"
                              title="Remove Slot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* CREATE & EDIT MODAL */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <div
            className="manual-modal-overlay"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="manual-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="flex items-center gap-2">
                  <div className="modal-header-icon-box">
                    {showCreateModal ? <Plus size={16} /> : <Edit2 size={16} />}
                  </div>
                  <div>
                    <h3 className="modal-heading">
                      {showCreateModal ? "Add New" : "Edit"}{" "}
                      {activeEntity === "students" && "Student Profile"}
                      {activeEntity === "guardians" && "Hostel Guardian Profile"}
                      {activeEntity === "faculty" && "Faculty Member"}
                      {activeEntity === "departments" && "Department"}
                      {activeEntity === "subjects" && "Subject"}
                      {activeEntity === "sections" && "Section"}
                      {activeEntity === "classrooms" && "Classroom"}
                      {activeEntity === "timetable" && "Timetable Slot"}
                    </h3>
                    <p className="modal-subheading">
                      Changes directly commit to the institutional database schema.
                    </p>
                  </div>
                </div>
                <button
                  className="modal-close-cross"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Conflict Warning Banner for Timetable */}
              {conflictWarning && (
                <div className="conflict-warning-banner p-3.5 mb-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-200 text-xs block">Schedule Conflict Detected</span>
                    <span className="text-red-300/90 text-xs leading-relaxed mt-0.5 block">{conflictWarning}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="modal-form-body">
                {/* ── STUDENTS FORM ── */}
                {activeEntity === "students" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Student Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="student@campus.com"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Department *</label>
                      <select
                        value={formData.department || ""}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="form-field-input"
                      >
                        {metadata.departments.map((d) => (
                          <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Roll Number (Leave blank to auto-generate)</label>
                      <input
                        type="text"
                        placeholder="e.g. RA26CS1001"
                        value={formData.roll_number || ""}
                        onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                        className="form-field-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Semester</label>
                      <select
                        value={formData.semester || 1}
                        onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                        className="form-field-input"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-field-label">Section</label>
                      <input
                        type="text"
                        placeholder="A"
                        value={formData.section || "A"}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+91 9876543210"
                        value={formData.phone_number || ""}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Status</label>
                      <select
                        value={formData.custom_status || "Active"}
                        onChange={(e) => setFormData({ ...formData, custom_status: e.target.value })}
                        className="form-field-input"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>

                    {/* Hostel Resident & Guardian Authorization Card */}
                    <div className="col-span-2 mt-2 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.is_hostel_resident || false}
                            onChange={(e) => setFormData({ ...formData, is_hostel_resident: e.target.checked })}
                            className="w-4 h-4 rounded text-red-600 bg-slate-950 border-slate-700 focus:ring-red-500"
                          />
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            Hostel Resident (Requires Parent/Guardian Gate Pass Authorization)
                          </span>
                        </label>
                        {formData.is_hostel_resident && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, guardian_mode: "new", guardian_id: null })}
                              className={`px-2 py-0.5 rounded-md transition-all ${formData.guardian_mode !== "existing" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              New Guardian
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, guardian_mode: "existing" })}
                              className={`px-2 py-0.5 rounded-md transition-all ${formData.guardian_mode === "existing" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Existing Guardian
                            </button>
                          </div>
                        )}
                      </div>

                      {formData.is_hostel_resident && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-3">
                          {formData.guardian_mode === "existing" ? (
                            <div>
                              <label className="form-field-label">Select Registered Guardian *</label>
                              <select
                                value={formData.guardian_id || ""}
                                onChange={(e) => {
                                  const gId = parseInt(e.target.value) || null;
                                  const selected = (metadata.guardians || []).find(g => g.id === gId);
                                  setFormData({
                                    ...formData,
                                    guardian_id: gId,
                                    guardian_name: selected?.name || "",
                                    guardian_email: selected?.email || "",
                                    guardian_phone: selected?.phone_number || ""
                                  });
                                }}
                                className="form-field-input"
                              >
                                <option value="">-- Choose Guardian from System --</option>
                                {(metadata.guardians || []).map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.name} ({g.email} • {g.phone_number || "No phone"})
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="form-field-label">Guardian Full Name *</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Robert Doe"
                                  value={formData.guardian_name || ""}
                                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                                  className="form-field-input"
                                />
                              </div>
                              <div>
                                <label className="form-field-label">Guardian Email * (Login)</label>
                                <input
                                  type="email"
                                  placeholder="parent@gmail.com"
                                  value={formData.guardian_email || ""}
                                  onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                                  className="form-field-input"
                                />
                              </div>
                              <div>
                                <label className="form-field-label">Mobile (SMS OTP) *</label>
                                <input
                                  type="text"
                                  placeholder="+91 9876543210"
                                  value={formData.guardian_phone || ""}
                                  onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                                  className="form-field-input"
                                />
                              </div>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-400 leading-normal">
                            ℹ️ A guardian account is provisioned with default password <span className="text-red-400 font-mono font-bold">Campus@123</span>. The guardian receives OTPs and gate pass requests whenever this student applies for an outing or hostel leave.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── GUARDIANS FORM ── */}
                {activeEntity === "guardians" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Guardian Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Sharma"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Guardian Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="guardian@example.com"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Emergency Mobile (SMS OTP) *</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 9876543210"
                        value={formData.phone_number || ""}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Default Portal Password</label>
                      <input
                        type="text"
                        disabled
                        value="Campus@123"
                        className="form-field-input opacity-75 font-mono cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="form-field-label">Link Student Wards (Roll Numbers, comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. RA26CS1001, RA26CS1002"
                        value={formData.student_roll_numbers_str || ""}
                        onChange={(e) => setFormData({ ...formData, student_roll_numbers_str: e.target.value })}
                        className="form-field-input font-mono"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Enter student roll numbers to automatically bind this guardian for gate pass approvals.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── FACULTY FORM ── */}
                {activeEntity === "faculty" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Faculty Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Alan Turing"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Faculty Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="faculty@campus.com"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Department *</label>
                      <select
                        value={formData.department || ""}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="form-field-input"
                      >
                        {metadata.departments.map((d) => (
                          <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Employee ID (Blank to auto-generate)</label>
                      <input
                        type="text"
                        placeholder="FAC26CS101"
                        value={formData.employee_id || ""}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        className="form-field-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Staff Room Cabin</label>
                      <input
                        type="text"
                        placeholder="Cabin 304"
                        value={formData.staff_room || ""}
                        onChange={(e) => setFormData({ ...formData, staff_room: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Max Weekly Hours</label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={formData.max_workload || 18}
                        onChange={(e) => setFormData({ ...formData, max_workload: parseInt(e.target.value) })}
                        className="form-field-input"
                      />
                    </div>
                  </div>
                )}

                {/* ── DEPARTMENTS FORM ── */}
                {activeEntity === "departments" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-field-label">Department Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CSE"
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="form-field-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Department Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Computer Science and Engineering"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">HOD Name</label>
                      <input
                        type="text"
                        placeholder="Dr. Eleanor Vance"
                        value={formData.hod_name || ""}
                        onChange={(e) => setFormData({ ...formData, hod_name: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Block Location</label>
                      <input
                        type="text"
                        placeholder="Tech Block C"
                        value={formData.department_block || ""}
                        onChange={(e) => setFormData({ ...formData, department_block: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="form-field-label">Department Description</label>
                      <textarea
                        rows="2"
                        placeholder="Brief summary of department focus..."
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="form-field-input resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* ── SUBJECTS FORM ── */}
                {activeEntity === "subjects" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-field-label">Subject Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CS101"
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="form-field-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Subject Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Data Structures & Algorithms"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Department *</label>
                      <select
                        value={formData.department_id || ""}
                        onChange={(e) => setFormData({ ...formData, department_id: parseInt(e.target.value) })}
                        className="form-field-input"
                      >
                        {metadata.departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-field-label">Semester</label>
                      <select
                        value={formData.semester || 1}
                        onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                        className="form-field-input"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-field-label">Credits</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={formData.credits || 3}
                        onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Weekly Hours</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.weekly_hours || 4}
                        onChange={(e) => setFormData({ ...formData, weekly_hours: parseInt(e.target.value) })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="form-field-label">Assigned Faculty In-Charge</label>
                      <select
                        value={formData.faculty_id || ""}
                        onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value ? parseInt(e.target.value) : null })}
                        className="form-field-input"
                      >
                        <option value="">-- Unassigned --</option>
                        {metadata.faculty.map((f) => (
                          <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* ── SECTIONS FORM ── */}
                {activeEntity === "sections" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-field-label">Department *</label>
                      <select
                        value={formData.department_id || ""}
                        onChange={(e) => setFormData({ ...formData, department_id: parseInt(e.target.value) })}
                        className="form-field-input"
                      >
                        {metadata.departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-field-label">Semester *</label>
                      <select
                        value={formData.semester || 1}
                        onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                        className="form-field-input"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-field-label">Section Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="A"
                        value={formData.section_name || ""}
                        onChange={(e) => setFormData({ ...formData, section_name: e.target.value.toUpperCase() })}
                        className="form-field-input font-bold"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Student Capacity</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={formData.student_strength || 60}
                        onChange={(e) => setFormData({ ...formData, student_strength: parseInt(e.target.value) })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="form-field-label">Permanent Classroom Allocation</label>
                      <select
                        value={formData.permanent_room_id || ""}
                        onChange={(e) => setFormData({ ...formData, permanent_room_id: e.target.value ? parseInt(e.target.value) : null })}
                        className="form-field-input"
                      >
                        <option value="">-- No Permanent Room --</option>
                        {metadata.classrooms.map((c) => (
                          <option key={c.id} value={c.id}>Room {c.room_number} ({c.building} - {c.capacity} seats)</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* ── CLASSROOMS FORM ── */}
                {activeEntity === "classrooms" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-field-label">Room Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="LH-101"
                        value={formData.room_number || ""}
                        onChange={(e) => setFormData({ ...formData, room_number: e.target.value.toUpperCase() })}
                        className="form-field-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Building *</label>
                      <input
                        type="text"
                        required
                        placeholder="Main Science Block"
                        value={formData.building || ""}
                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Floor</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.floor || 1}
                        onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Capacity (Seats)</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={formData.capacity || 60}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Room Type</label>
                      <select
                        value={formData.room_type || "THEORY"}
                        onChange={(e) => setFormData({ ...formData, room_type: e.target.value, is_lab: e.target.value === "LAB" })}
                        className="form-field-input"
                      >
                        <option value="THEORY">Theory Lecture Hall</option>
                        <option value="LAB">Computer/Science Lab</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-field-label">Maintenance Status</label>
                      <select
                        value={formData.maintenance_status || "active"}
                        onChange={(e) => setFormData({ ...formData, maintenance_status: e.target.value })}
                        className="form-field-input"
                      >
                        <option value="active">Active</option>
                        <option value="maintenance">Under Maintenance</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ── TIMETABLE SLOT FORM (WITH CONFLICT PREVENTION) ── */}
                {activeEntity === "timetable" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-field-label">Day of Week *</label>
                      <select
                        value={formData.day || "Monday"}
                        onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                        className="form-field-input"
                      >
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-field-label">Period Number</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={formData.period || 1}
                        onChange={(e) => setFormData({ ...formData, period: parseInt(e.target.value) })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">Start Time (HH:MM) *</label>
                      <input
                        type="time"
                        required
                        value={formData.start_time || "09:00"}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div>
                      <label className="form-field-label">End Time (HH:MM) *</label>
                      <input
                        type="time"
                        required
                        value={formData.end_time || "10:00"}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="form-field-input"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Subject *</label>
                      <input
                        type="text"
                        required
                        placeholder="Subject name"
                        value={formData.subject || ""}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="form-field-input"
                        list="subject-suggestions"
                      />
                      <datalist id="subject-suggestions">
                        {metadata.subjects.map((s) => (
                          <option key={s.id} value={s.name} />
                        ))}
                      </datalist>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="form-field-label">Instructor / Faculty</label>
                      <input
                        type="text"
                        placeholder="Faculty name"
                        value={formData.faculty || ""}
                        onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                        className="form-field-input"
                        list="faculty-suggestions"
                      />
                      <datalist id="faculty-suggestions">
                        {metadata.faculty.map((f) => (
                          <option key={f.id} value={f.name} />
                        ))}
                      </datalist>
                    </div>
                    <div className="col-span-2">
                      <label className="form-field-label">Allocated Room *</label>
                      <select
                        value={formData.room || ""}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                        className="form-field-input"
                      >
                        {metadata.classrooms.map((c) => (
                          <option key={c.id} value={c.room_number}>
                            Room {c.room_number} ({c.building} - {c.capacity} seats)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="modal-actions-footer mt-6 flex justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submitting}
                    className="submit-record-btn"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin mr-1.5" />
                        Validating & Saving...
                      </>
                    ) : showCreateModal ? (
                      "Save Record"
                    ) : (
                      "Update Changes"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE / DEACTIVATE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && recordToDelete && (
          <div className="manual-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="delete-confirm-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="delete-modal-icon-box mx-auto mb-3">
                <AlertTriangle size={24} className="text-red-500" />
              </div>

              <h4 className="text-base font-bold text-slate-100 text-center">
                {isPermanentDelete ? "Permanently Delete" : "Deactivate Record"}?
              </h4>
              <p className="text-xs text-slate-400 text-center mt-2 leading-relaxed">
                {isPermanentDelete
                  ? `Are you sure you want to permanently delete this ${activeEntity.slice(0, -1)}? This action cannot be reversed.`
                  : `This student/faculty will be marked Inactive. Academic history, attendance, and exam grades will remain safely intact in the database.`}
              </p>

              <div className="delete-modal-actions mt-6 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submitting}
                  className="w-1/2"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="w-1/2 confirm-delete-action-btn"
                >
                  {submitting ? "Processing..." : isPermanentDelete ? "Delete Now" : "Deactivate"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
