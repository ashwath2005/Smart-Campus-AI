import "./AdminCoreHub.css";
import React, { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import { Card, Button, Badge, Modal } from "../../components/ui";
import {
  School,
  Building,
  Layers,
  Users,
  Grid,
  BookOpen,
  Calendar,
  History,
  Search,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  Settings,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export const AdminCoreHub = () => {
  const [activeTab, setActiveTab] = useState("departments");
  const [stats, setStats] = useState({
    departments: 0,
    buildings: 0,
    classrooms: 0,
    laboratories: 0,
    sections: 0,
    subjects: 0,
    academic_years: 0,
    semesters: 0
  });
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Global Search state
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResults, setGlobalResults] = useState([]);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);

  // Table operations
  const [localSearch, setLocalSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal / Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create, edit, view
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Relational lists
  const [departmentsList, setDepartmentsList] = useState([]);
  const [classroomsList, setClassroomsList] = useState([]);
  const [academicYearsList, setAcademicYearsList] = useState([]);
  const [facultiesList, setFacultiesList] = useState([]);

  // File import Ref
  const fileInputRef = useRef(null);

  // Configuration mapping all 8 core hub master modules
  const modulesConfig = {
    departments: {
      label: "Departments",
      description: "Manage academic departments, HOD assignments, and active status.",
      icon: School,
      apiEndpoint: "/core-hub/departments",
      fields: [
        { name: "name", label: "Department Name", type: "text", required: true },
        { name: "code", label: "Department Code", type: "text", required: true, uppercase: true },
        { name: "hod_name", label: "HOD Name", type: "text" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "department_block", label: "Department Block", type: "text" },
        { name: "total_semesters", label: "Total Semesters", type: "number", defaultValue: 8 },
        { name: "active", label: "Status", type: "select", options: [{ value: 1, label: "Active" }, { value: 0, label: "Inactive" }], defaultValue: 1 }
      ],
      columns: [
        { key: "code", label: "Code", sortable: true },
        { key: "name", label: "Name", sortable: true },
        { key: "hod_name", label: "HOD", sortable: true },
        { key: "total_faculty", label: "Faculty", sortable: true },
        { key: "total_students", label: "Students", sortable: true },
        { key: "department_block", label: "Block" },
        { key: "total_semesters", label: "Semesters" },
        {
          key: "active",
          label: "Status",
          render: (val) => (
            <Badge variant={val === 1 ? "success" : "danger"}>
              {val === 1 ? "Active" : "Inactive"}
            </Badge>
          )
        }
      ]
    },
    buildings: {
      label: "Buildings",
      description: "Administer blocks, campus infrastructure, floor counts, and descriptions.",
      icon: Building,
      apiEndpoint: "/core-hub/buildings",
      fields: [
        { name: "name", label: "Building Name", type: "text", required: true },
        { name: "code", label: "Building Code", type: "text", required: true, uppercase: true },
        { name: "floors", label: "Number of Floors", type: "number", required: true, defaultValue: 1 },
        { name: "description", label: "Description", type: "textarea" },
        { name: "status", label: "Status", type: "select", options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }], defaultValue: "Active" }
      ],
      columns: [
        { key: "code", label: "Code", sortable: true },
        { key: "name", label: "Name", sortable: true },
        { key: "floors", label: "Floors", sortable: true },
        { key: "description", label: "Description" },
        {
          key: "status",
          label: "Status",
          render: (val) => <Badge variant={val === "Active" ? "success" : "danger"}>{val}</Badge>
        }
      ]
    },
    classrooms: {
      label: "Classrooms",
      description: "Configure theory rooms, seat capacities, projectors, ACs, and maintenance logs.",
      icon: Layers,
      apiEndpoint: "/core-hub/classrooms",
      fields: [
        { name: "room_number", label: "Room Number", type: "text", required: true },
        { name: "building", label: "Building / Block", type: "text", required: true },
        { name: "floor", label: "Floor", type: "number", required: true },
        { name: "capacity", label: "Capacity", type: "number", required: true },
        { name: "smart_classroom", label: "Smart Classroom", type: "checkbox" },
        { name: "projector_available", label: "Projector Available", type: "checkbox", defaultValue: true },
        { name: "smart_board", label: "Smart Board", type: "checkbox" },
        { name: "air_conditioning", label: "Air Conditioning", type: "checkbox" },
        { name: "current_status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "maintenance", label: "Maintenance" }, { value: "inactive", label: "Inactive" }], defaultValue: "active" }
      ],
      columns: [
        { key: "room_number", label: "Room", sortable: true },
        { key: "building", label: "Building", sortable: true },
        { key: "floor", label: "Floor", sortable: true },
        { key: "capacity", label: "Capacity", sortable: true },
        {
          key: "smart_classroom",
          label: "Type",
          render: (val) => (val ? "Smart Classroom" : "Standard Classroom")
        },
        {
          key: "maintenance_status",
          label: "Status",
          render: (val) => (
            <Badge variant={val === "active" ? "success" : val === "maintenance" ? "warning" : "danger"}>
              {val?.toUpperCase()}
            </Badge>
          )
        }
      ]
    },
    laboratories: {
      label: "Laboratories",
      description: "Manage department computer networks, electronics labs, and custom equipment rooms.",
      icon: Settings,
      apiEndpoint: "/core-hub/laboratories",
      fields: [
        { name: "name", label: "Laboratory Name", type: "text", required: true },
        { name: "code", label: "Laboratory Code (Room No.)", type: "text", required: true, uppercase: true },
        { name: "department_id", label: "Department", type: "departmentSelect" },
        { name: "capacity", label: "Capacity", type: "number", required: true },
        { name: "status", label: "Status", type: "select", options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }], defaultValue: "Active" }
      ],
      columns: [
        { key: "room_number", label: "Room Code", sortable: true },
        {
          key: "department_block",
          label: "Department",
          sortable: true,
          render: (val) => val || "General Academic"
        },
        { key: "capacity", label: "Capacity", sortable: true },
        {
          key: "maintenance_status",
          label: "Status",
          render: (val) => (
            <Badge variant={val === "active" ? "success" : "danger"}>
              {val === "active" ? "Active" : "Inactive"}
            </Badge>
          )
        }
      ]
    },
    sections: {
      label: "Sections",
      description: "Configure batch divisions, advisor allocations, strength, and permanent rooms.",
      icon: Grid,
      apiEndpoint: "/core-hub/sections",
      fields: [
        { name: "department_id", label: "Department", type: "departmentSelect", required: true },
        { name: "semester", label: "Semester", type: "number", required: true },
        { name: "section_name", label: "Section Name", type: "text", required: true, uppercase: true },
        { name: "student_strength", label: "Student Strength", type: "number", required: true, defaultValue: 60 },
        { name: "permanent_room_id", label: "Permanent Classroom", type: "classroomSelect" }
      ],
      columns: [
        {
          key: "department_id",
          label: "Department",
          sortable: true,
          render: (val) => departmentsList.find((d) => d.id === val)?.name || `Dept #${val}`
        },
        { key: "semester", label: "Semester", sortable: true },
        { key: "section_name", label: "Section", sortable: true },
        { key: "student_strength", label: "Strength", sortable: true },
        {
          key: "permanent_room_id",
          label: "Permanent Room",
          render: (val) => classroomsList.find((c) => c.id === val)?.room_number || "Unassigned"
        }
      ]
    },
    subjects: {
      label: "Subjects",
      description: "Register syllabus subject codes, credits, and linked teaching faculties.",
      icon: BookOpen,
      apiEndpoint: "/core-hub/subjects",
      fields: [
        { name: "code", label: "Subject Code", type: "text", required: true, uppercase: true },
        { name: "name", label: "Subject Name", type: "text", required: true },
        { name: "credits", label: "Credits", type: "number", required: true, defaultValue: 3 },
        { name: "department_id", label: "Department", type: "departmentSelect", required: true },
        { name: "semester", label: "Semester", type: "number", required: true },
        { name: "faculty_id", label: "Assigned Faculty", type: "facultySelect" }
      ],
      columns: [
        { key: "code", label: "Code", sortable: true },
        { key: "name", label: "Subject Name", sortable: true },
        {
          key: "department_id",
          label: "Department",
          render: (val) => departmentsList.find((d) => d.id === val)?.code || val
        },
        { key: "semester", label: "Semester", sortable: true },
        {
          key: "faculty_id",
          label: "Assigned Faculty",
          render: (val) => facultiesList.find((f) => f.id === val)?.name || "Unassigned"
        }
      ]
    },
    academic_years: {
      label: "Academic Years",
      description: "Manage global year structures, start/end dates, and select current active term.",
      icon: Calendar,
      apiEndpoint: "/core-hub/academic-years",
      fields: [
        { name: "name", label: "Academic Year Name (e.g. 2025-26)", type: "text", required: true },
        { name: "start_date", label: "Start Date", type: "date" },
        { name: "end_date", label: "End Date", type: "date" },
        { name: "is_current", label: "Current Active Year", type: "checkbox" },
        { name: "status", label: "Status", type: "select", options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }], defaultValue: "Active" }
      ],
      columns: [
        { key: "name", label: "Academic Year", sortable: true },
        { key: "start_date", label: "Start Date", sortable: true },
        { key: "end_date", label: "End Date", sortable: true },
        {
          key: "is_current",
          label: "Current Year",
          render: (val) => (val ? <Badge variant="success">Current Active</Badge> : "No")
        },
        {
          key: "status",
          label: "Status",
          render: (val) => <Badge variant={val === "Active" ? "success" : "danger"}>{val}</Badge>
        }
      ]
    },
    semesters: {
      label: "Semesters",
      description: "Configure Odd/Even semester timelines, linking them to academic year calendars.",
      icon: History,
      apiEndpoint: "/core-hub/semesters",
      fields: [
        { name: "name", label: "Semester Name", type: "text", required: true },
        { name: "academic_year_id", label: "Academic Year", type: "academicYearSelect", required: true },
        { name: "start_date", label: "Start Date", type: "date" },
        { name: "end_date", label: "End Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }], defaultValue: "Active" }
      ],
      columns: [
        { key: "name", label: "Semester Name", sortable: true },
        {
          key: "academic_year_id",
          label: "Academic Year",
          render: (val) => academicYearsList.find((ay) => ay.id === val)?.name || `AY #${val}`
        },
        { key: "start_date", label: "Start Date" },
        { key: "end_date", label: "End Date" },
        {
          key: "status",
          label: "Status",
          render: (val) => <Badge variant={val === "Active" ? "success" : "danger"}>{val}</Badge>
        }
      ]
    },
    students: {
      label: "Students",
      description: "Manage registered student profiles, department enrollments, and semesters.",
      icon: Users,
      apiEndpoint: "/core-hub/students",
      fields: [
        { name: "name", label: "Student Name", type: "text", required: true },
        { name: "email", label: "Email Address", type: "email", required: true },
        { name: "roll_number", label: "Roll Number", type: "text", required: true, uppercase: true },
        { name: "department", label: "Department Code", type: "text" },
        { name: "semester", label: "Semester", type: "number" },
        { name: "section", label: "Section", type: "text" },
        { name: "phone_number", label: "Phone Number", type: "text" }
      ],
      columns: [
        { key: "roll_number", label: "Roll Number", sortable: true },
        { key: "name", label: "Student Name", sortable: true },
        { key: "email", label: "Email" },
        { key: "department", label: "Department" },
        { key: "semester", label: "Semester" },
        { key: "section", label: "Section" },
        { key: "phone_number", label: "Phone" }
      ]
    },
    staff: {
      label: "Staff",
      description: "Manage academic faculty members, staff room locations, and phone directories.",
      icon: Users,
      apiEndpoint: "/core-hub/staff",
      fields: [
        { name: "name", label: "Staff Name", type: "text", required: true },
        { name: "email", label: "Email Address", type: "email", required: true },
        { name: "employee_id", label: "Employee ID", type: "text", required: true, uppercase: true },
        { name: "department", label: "Department Code", type: "text" },
        { name: "staff_room", label: "Staff Room", type: "text" },
        { name: "phone_number", label: "Phone Number", type: "text" }
      ],
      columns: [
        { key: "employee_id", label: "Employee ID", sortable: true },
        { key: "name", label: "Staff Name", sortable: true },
        { key: "email", label: "Email" },
        { key: "department", label: "Department" },
        { key: "staff_room", label: "Staff Room" },
        { key: "phone_number", label: "Phone" }
      ]
    }
  };

  const loadLookups = async () => {
    try {
      const deptRes = await api.get("/core-hub/departments");
      setDepartmentsList(deptRes.data);
    } catch (e) {}

    try {
      const roomRes = await api.get("/core-hub/classrooms");
      setClassroomsList(roomRes.data);
    } catch (e) {}

    try {
      const ayRes = await api.get("/core-hub/academic-years");
      setAcademicYearsList(ayRes.data);
    } catch (e) {}

    try {
      const facRes = await api.get("/admin/faculty");
      setFacultiesList(facRes.data);
    } catch (e) {}
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/core-hub/stats");
      setStats(res.data);
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const config = modulesConfig[activeTab];
      const res = await api.get(config.apiEndpoint);
      setTableData(res.data);
    } catch (err) {
      toast.error(`Failed to load ${activeTab} data.`);
    } finally {
      setLoading(false);
      setSelectedRows([]);
      setLocalSearch("");
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    loadLookups();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (globalQuery.trim().length > 1) {
        try {
          const res = await api.get(`/core-hub/global-search?query=${globalQuery}`);
          setGlobalResults(res.data);
          setShowGlobalDropdown(true);
        } catch (e) {}
      } else {
        setGlobalResults([]);
        setShowGlobalDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [globalQuery]);

  const handleGlobalResultClick = (res) => {
    setGlobalQuery("");
    setShowGlobalDropdown(false);
    let tab = "departments";
    if (res.type === "Department") tab = "departments";
    else if (res.type === "Building") tab = "buildings";
    else if (res.type === "Classroom") tab = "classrooms";
    else if (res.type === "Laboratory") tab = "laboratories";
    else if (res.type === "Section") tab = "sections";
    else if (res.type === "Subject") tab = "subjects";

    setActiveTab(tab);
    const term = res.name.split(" (")[0].replace("Room ", "").replace("Lab ", "");
    setLocalSearch(term);
  };

  const handleToggleRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((r) => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(filteredAndSortedData.map((row) => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const filteredAndSortedData = React.useMemo(() => {
    if (!localSearch) return tableData;
    return tableData.filter((row) => {
      return Object.keys(row).some((key) => {
        const val = row[key];
        return val ? String(val).toLowerCase().includes(localSearch.toLowerCase()) : false;
      });
    });
  }, [tableData, localSearch]);

  const paginatedData = React.useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage) || 1;

  const openFormModal = (mode, item = null) => {
    setFormMode(mode);
    setEditingItem(item);
    
    const config = modulesConfig[activeTab];
    const initialForm = {};
    config.fields.forEach((f) => {
      if (mode === "edit" || mode === "view") {
        initialForm[f.name] = item ? item[f.name] : f.defaultValue || "";
      } else {
        initialForm[f.name] = f.defaultValue !== undefined ? f.defaultValue : "";
      }
    });
    setFormData(initialForm);
    setFormOpen(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    const config = modulesConfig[activeTab];
    
    for (const f of config.fields) {
      if (f.required && (formData[f.name] === undefined || formData[f.name] === "")) {
        toast.error(`"${f.label}" field is required.`);
        return;
      }
    }

    const payload = { ...formData };
    config.fields.forEach((f) => {
      if (f.uppercase && typeof payload[f.name] === "string") {
        payload[f.name] = payload[f.name].toUpperCase();
      }
    });

    const loadId = toast.loading("Saving master record details...");
    try {
      if (formMode === "edit") {
        await api.put(`${config.apiEndpoint}/${editingItem.id}`, payload);
        toast.success("Record updated successfully!", { id: loadId });
      } else {
        await api.post(config.apiEndpoint, payload);
        toast.success("Record created successfully!", { id: loadId });
      }
      setFormOpen(false);
      fetchData();
      fetchStats();
      loadLookups();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to save record.";
      toast.error(msg, { id: loadId });
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this master record?")) return;
    const config = modulesConfig[activeTab];
    try {
      await api.delete(`${config.apiEndpoint}/${id}`);
      toast.success("Deleted successfully.");
      fetchData();
      fetchStats();
      loadLookups();
    } catch (err) {
      toast.error("Failed to delete record.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Are you sure you want to bulk delete ${selectedRows.length} records?`)) return;
    
    const config = modulesConfig[activeTab];
    try {
      await api.post(`${config.apiEndpoint}/bulk-delete`, { ids: selectedRows });
      toast.success("Bulk deleted successfully.");
      setSelectedRows([]);
      fetchData();
      fetchStats();
      loadLookups();
    } catch (e) {
      toast.error("Failed to bulk delete records.");
    }
  };

  const handleBulkStatusUpdate = async (statusVal) => {
    if (selectedRows.length === 0) return;
    const config = modulesConfig[activeTab];
    try {
      await api.post(`${config.apiEndpoint}/bulk-update`, { ids: selectedRows, status: statusVal });
      toast.success("Bulk status updated successfully.");
      setSelectedRows([]);
      fetchData();
    } catch (e) {
      toast.error("Failed to update status.");
    }
  };

  const handleExportData = () => {
    if (tableData.length === 0) {
      toast.error("No data rows available to export.");
      return;
    }
    const config = modulesConfig[activeTab];
    const headers = config.columns.map((c) => c.label);
    const keys = config.columns.map((c) => c.key);
    
    const rows = tableData.map((row) =>
      keys.map((key) => {
        const val = row[key];
        return val !== undefined && val !== null ? `"${String(val).replace(/"/g, '""')}"` : "";
      })
    );

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `core_hub_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV master list exported successfully.");
  };

  const triggerImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv") {
      toast.error("Please upload a standard CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error("CSV file contains no data records.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
      const records = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.replace(/^["']|["']$/g, "").trim());
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = vals[i];
        });
        return obj;
      });

      const config = modulesConfig[activeTab];
      let success = 0;
      let fails = 0;

      const loadId = toast.loading(`Importing ${records.length} records into ${config.label}...`);

      for (const rec of records) {
        try {
          const payload = {};
          config.fields.forEach((f) => {
            const matchKey = Object.keys(rec).find(
              (k) => k.toLowerCase() === f.label.toLowerCase() || k.toLowerCase() === f.name.toLowerCase()
            );
            if (matchKey !== undefined) {
              payload[f.name] = f.type === "number" ? Number(rec[matchKey]) : rec[matchKey];
            } else if (f.defaultValue !== undefined) {
              payload[f.name] = f.defaultValue;
            }
          });
          await api.post(config.apiEndpoint, payload);
          success++;
        } catch (err) {
          fails++;
        }
      }

      toast.success(`Import complete! ${success} success, ${fails} failed.`, { id: loadId });
      fetchData();
      fetchStats();
      loadLookups();
    };
    reader.readAsText(file);
  };

  const activeConfig = modulesConfig[activeTab];
  const ActiveTabIcon = activeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="core-hub-container"
    >
      {/* Page Header */}
      <div className="core-hub-header">
        <h2 className="core-hub-title font-extrabold text-slate-100 text-3xl">Core Hub</h2>
        <p className="core-hub-subtitle text-slate-400 text-xs mt-1">
          Centralized ecosystem administration module managing foundational academic resources.
        </p>
      </div>

      {/* Unified Global Search */}
      <div className="global-search-container" style={{ width: '100%', marginBottom: '24px', position: 'relative' }}>
        <div className="search-bar-input-box" style={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} className="global-search-icon" style={{ position: 'absolute', left: '16px', color: '#94a3b8' }} />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Search across departments, buildings, classrooms, labs, sections, and subjects..."
            className="global-search-input"
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: '44px',
              paddingRight: '40px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '13px',
              fontWeight: '500',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={() => {
              if (globalResults.length > 0) setShowGlobalDropdown(true);
            }}
          />
          {globalQuery && (
            <button className="clear-search-btn" onClick={() => setGlobalQuery("")} style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Floating results list */}
        <AnimatePresence>
          {showGlobalDropdown && globalResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="global-results-dropdown-list absolute w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="dropdown-results-title px-4 py-2 border-b border-white/5 bg-white/[0.01] text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                Matching Core Resources
              </div>
              <div className="max-h-60 overflow-y-auto">
                {globalResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => handleGlobalResultClick(res)}
                    className="result-item-row px-4 py-3 flex justify-between items-center border-b border-white/5 last:border-0 hover:bg-white/[0.02] cursor-pointer"
                  >
                    <span className="result-name text-slate-200 text-sm font-semibold pr-4 truncate">{res.name}</span>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wide">
                      {res.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 10 Stats Cards Grid */}
      <div className="category-selection-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {Object.keys(modulesConfig).map((key) => {
          const cfg = modulesConfig[key];
          const CardIcon = cfg.icon;
          const isActive = activeTab === key;
          const count = stats[key] !== undefined ? stats[key] : 0;

          // Coordinated Aesthetic Themes matching Data Import Center selection cards
          const themeMap = {
            departments: { color: "#ec4899", bg: "rgba(236, 72, 153, 0.1)", border: "rgba(236, 72, 153, 0.25)" },
            buildings: { color: "#06b6d4", bg: "rgba(6, 182, 212, 0.1)", border: "rgba(6, 182, 212, 0.25)" },
            classrooms: { color: "#06b6d4", bg: "rgba(6, 182, 212, 0.1)", border: "rgba(6, 182, 212, 0.25)" },
            laboratories: { color: "#ec4899", bg: "rgba(236, 72, 153, 0.1)", border: "rgba(236, 72, 153, 0.25)" },
            sections: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.25)" },
            subjects: { color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.25)" },
            academic_years: { color: "#f97316", bg: "rgba(249, 115, 22, 0.1)", border: "rgba(249, 115, 22, 0.25)" },
            semesters: { color: "#eab308", bg: "rgba(234, 179, 8, 0.1)", border: "rgba(234, 179, 8, 0.25)" },
            students: { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.25)" },
            staff: { color: "#f43f5e", bg: "rgba(244, 63, 94, 0.1)", border: "rgba(244, 63, 94, 0.25)" }
          };
          const theme = themeMap[key] || { color: "#94a3b8", bg: "rgba(255, 255, 255, 0.05)", border: "rgba(255, 255, 255, 0.1)" };

          return (
            <div
              key={key}
              onClick={() => setActiveTab(key)}
              className={`category-select-card ${isActive ? "category-select-card-active" : ""}`}
              style={{
                background: isActive ? 'rgba(30, 41, 59, 0.4)' : 'rgba(30, 41, 59, 0.2)',
                border: isActive ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: isActive ? '0 4px 20px rgba(239, 68, 68, 0.08)' : 'none',
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div className="category-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={`category-icon-wrapper ${isActive ? "category-icon-wrapper-active" : ""}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isActive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                      color: isActive ? '#ef4444' : '#94a3b8',
                      transition: 'all 0.3s ease',
                      flexShrink: 0
                    }}>
                      <CardIcon size={18} />
                    </div>
                    <span className="category-card-label" style={{ fontSize: '13.5px', fontWeight: '700', color: isActive ? '#ef4444' : '#f1f5f9' }}>{cfg.label}</span>
                  </div>
                  
                  {/* Floating Count Badge */}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: isActive ? '#ffffff' : theme.color,
                    background: isActive ? '#ef4444' : theme.bg,
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${theme.border}`,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    flexShrink: 0
                  }}>
                    {count}
                  </span>
                </div>
                
                {/* Description */}
                <p className="category-card-desc" style={{ fontSize: '11px', color: isActive ? '#94a3b8' : '#64748b', lineHeight: '1.4', margin: 0 }}>
                  {cfg.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Console Workspace Manager */}
      <Card className="core-workspace-card" style={{ background: 'rgba(22, 28, 45, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', boxSizing: 'border-box', width: '100%' }}>
        <div className="workspace-header-bar" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', width: '100%' }}>
          <div className="workspace-header-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
            <div className="active-tab-icon-box" style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexShrink: 0 }}>
              <ActiveTabIcon size={20} className="text-red-500" />
            </div>
            <div className="workspace-title-text-block" style={{ textAlign: 'left' }}>
              <h3 className="workspace-title" style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>{activeConfig.label} Manager</h3>
              <p className="workspace-desc" style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>{activeConfig.description}</p>
            </div>
          </div>

          <div className="workspace-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="primary" size="sm" onClick={() => openFormModal("create")} className="add-new-record-btn">
              <Plus size={14} />
              <span>Add New</span>
            </Button>
            <Button variant="outline" size="sm" onClick={triggerImportClick} className="import-csv-btn">
              <Upload size={13} />
              <span>Import CSV</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".csv"
              style={{ display: "none" }}
            />
            <Button variant="outline" size="sm" onClick={handleExportData} className="export-csv-btn">
              <Download size={13} />
              <span>Export CSV</span>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} className="refresh-btn">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* Local Table Search & Bulk action tools */}
        <div className="table-controls-row" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', width: '100%' }}>
          <div className="local-search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '320px' }}>
            <Search size={14} className="local-search-icon" style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
            <input
              type="text"
              placeholder={`Search ${activeConfig.label.toLowerCase()}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="local-search-input"
              style={{
                width: '100%',
                height: '36px',
                paddingLeft: '36px',
                paddingRight: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: '500',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="bulk-actions-wrapper">
            <AnimatePresence>
              {selectedRows.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bulk-actions-flex"
                >
                  <span className="selected-count-label text-slate-500 text-xs font-semibold mr-2">
                    {selectedRows.length} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate("active")} className="bulk-active-btn text-xs text-slate-300">
                    Set Active
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate("inactive")} className="bulk-inactive-btn text-xs text-slate-300">
                    Set Inactive
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkDelete} className="bulk-delete-btn text-xs text-rose-500 border-rose-500/20 hover:bg-rose-500/10">
                    <Trash2 size={12} className="mr-1 inline" />
                    Delete Selected
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Data Table */}
        <div className="core-table-wrapper" style={{ width: '100%', overflowX: 'auto', minHeight: '250px', boxSizing: 'border-box' }}>
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="animate-spin text-red-500 mx-auto" size={32} />
              <span className="block text-slate-500 text-xs mt-3">Loading master records data...</span>
            </div>
          ) : tableData.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              No master records found. Click "Add New" or import a CSV file to load details.
            </div>
          ) : (
            <table className="core-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th className="checkbox-column" style={{ padding: '12px 16px', width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="table-header-checkbox"
                    />
                  </th>
                  {activeConfig.columns.map((col) => (
                    <th key={col.key} style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {col.label}
                    </th>
                  ))}
                  <th className="actions-column" style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row) => (
                  <tr key={row.id} className="table-data-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                    <td className="checkbox-cell" style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleToggleRow(row.id)}
                        className="row-checkbox"
                      />
                    </td>
                    {activeConfig.columns.map((col) => (
                      <td key={col.key} style={{ padding: '14px 18px', color: '#cbd5e1', fontSize: '13px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {col.render ? col.render(row[col.key], row) : row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : "-"}
                      </td>
                    ))}
                    <td className="actions-cell" style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div className="actions-cell-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="row-action-icon-btn" onClick={() => openFormModal("view", row)} title="View Details">
                          <Eye size={13} />
                        </button>
                        <button className="row-action-icon-btn" onClick={() => openFormModal("edit", row)} title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button className="row-action-icon-btn" onClick={() => handleDeleteItem(row.id)} style={{ color: '#ef4444' }} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination bar */}
        <div className="panel-footer-pagination" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '20px', marginTop: '24px', width: '100%' }}>
          <span className="pagination-info-text" style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
            {filteredAndSortedData.length > 0
              ? `${(currentPage - 1) * itemsPerPage + 1} – ${Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of ${filteredAndSortedData.length}`
              : "0 – 0 of 0"}
          </span>

          <div className="pagination-arrows-list" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
              className="pagination-nav-arrow-btn"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-slate-400 font-semibold px-2" style={{ color: '#94a3b8', fontWeight: '700' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
              className="pagination-nav-arrow-btn"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </Card>

      {/* CRUD Add/Edit/View Form Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "view" ? `View ${activeConfig.label}` : formMode === "edit" ? `Edit ${activeConfig.label}` : `Add New ${activeConfig.label}`}
        size="md"
      >
        <form onSubmit={handleSaveForm} className="core-hub-record-form">
          <div className="modal-scroll-body">
            {activeConfig.fields.map((f) => {
              const isDisabled = formMode === "view";

              return (
                <div key={f.name} className="form-field-block">
                  <label className="form-label-title">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>

                  {f.type === "textarea" ? (
                    <textarea
                      disabled={isDisabled}
                      value={formData[f.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                      className="form-textarea-input"
                      rows={3}
                    />
                  ) : f.type === "select" ? (
                    <select
                      disabled={isDisabled}
                      value={formData[f.name] !== undefined ? formData[f.name] : ""}
                      onChange={(e) => setFormData({ ...formData, [f.name]: f.name === "active" ? Number(e.target.value) : e.target.value })}
                      className="form-select-dropdown"
                    >
                      {f.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <div className="form-checkbox-row">
                      <input
                        type="checkbox"
                        disabled={isDisabled}
                        checked={!!formData[f.name]}
                        onChange={(e) => setFormData({ ...formData, [f.name]: e.target.checked })}
                        className="form-checkbox-control"
                      />
                      <span className="checkbox-text-label">{f.label}</span>
                    </div>
                  ) : f.type === "departmentSelect" ? (
                    <select
                      disabled={isDisabled}
                      value={formData[f.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.name]: Number(e.target.value) })}
                      className="form-select-dropdown"
                    >
                      <option value="">Select Department</option>
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  ) : f.type === "classroomSelect" ? (
                    <select
                      disabled={isDisabled}
                      value={formData[f.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.name]: Number(e.target.value) })}
                      className="form-select-dropdown"
                    >
                      <option value="">Select Classroom</option>
                      {classroomsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          Room {c.room_number} - Block {c.building}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "academicYearSelect" ? (
                    <select
                      disabled={isDisabled}
                      value={formData[f.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.name]: Number(e.target.value) })}
                      className="form-select-dropdown"
                    >
                      <option value="">Select Academic Year</option>
                      {academicYearsList.map((ay) => (
                        <option key={ay.id} value={ay.id}>
                          {ay.name}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "facultySelect" ? (
                    <select
                      disabled={isDisabled}
                      value={formData[f.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.name]: Number(e.target.value) })}
                      className="form-select-dropdown"
                    >
                      <option value="">Select Assigned Faculty</option>
                      {facultiesList.map((fa) => (
                        <option key={fa.id} value={fa.id}>
                          {fa.name} ({fa.employee_id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      disabled={isDisabled}
                      value={formData[f.name] !== undefined ? formData[f.name] : ""}
                      onChange={(e) => setFormData({ ...formData, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                      className="form-text-input"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="form-action-row">
            <Button variant="outline" type="button" onClick={() => setFormOpen(false)}>
              {formMode === "view" ? "Close" : "Cancel"}
            </Button>
            {formMode !== "view" && (
              <Button variant="primary" type="submit" className="confirm-import-action-btn">
                Save Changes
              </Button>
            )}
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
