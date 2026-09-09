import "./AdminDataImport.css";
import { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import { Card, Button, Badge, Skeleton } from "../../components/ui";
import {
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  History,
  X,
  Users,
  ArrowDownToLine,
  RefreshCw,
  BookOpen,
  Building,
  School,
  Grid,
  FileText,
  AlertCircle,
  FileArchive,
  GraduationCap,
  Calendar,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export const AdminDataImport = () => {
  const [selectedCategory, setSelectedCategory] = useState("all_in_one");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadPhase, setUploadPhase] = useState("idle"); // idle, uploading, validating
  const [rawReport, setRawReport] = useState(null);
  
  // History Filters and Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const itemsPerPage = 6;
  const fileInputRef = useRef(null);

  const categories = [
    { id: "all_in_one", label: "All-in-One Bulk", icon: FileArchive, desc: "Import entire schema (Departments, Classrooms, Faculty, Students, Sections, Subjects, Timetable) via a single excel file.", colorClass: "text-indigo-400", bgClass: "rgba(99, 102, 241, 0.1)" },
    { id: "student", label: "Student Import", icon: GraduationCap, desc: "Provision student profiles, assign departments, semesters, and sections in bulk.", colorClass: "text-emerald-400", bgClass: "rgba(16, 185, 129, 0.1)" },
    { id: "faculty", label: "Faculty Import", icon: Users, desc: "Bulk import faculty profiles, credentials, designations, and teaching capabilities.", colorClass: "text-orange-400", bgClass: "rgba(249, 115, 22, 0.1)" },
    { id: "department", label: "Department Import", icon: School, desc: "Create or update academic departments, HOD assignments, and semester counts.", colorClass: "text-pink-400", bgClass: "rgba(236, 72, 153, 0.1)" },
    { id: "classroom", label: "Classroom Import", icon: Building, desc: "Upload room numbers, capacities, buildings, floors, and classroom types.", colorClass: "text-cyan-400", bgClass: "rgba(6, 182, 212, 0.1)" },
    { id: "subject", label: "Subject Import", icon: BookOpen, desc: "Bulk import subjects, course codes, weekly hour requirements, and credits.", colorClass: "text-purple-400", bgClass: "rgba(139, 92, 246, 0.1)" },
    { id: "section", label: "Section Import", icon: Grid, desc: "Configure class sections, intake capacities, and permanent classroom linkages.", colorClass: "text-blue-400", bgClass: "rgba(59, 130, 246, 0.1)" },
    { id: "timetable", label: "Timetable Import", icon: FileText, desc: "Import timetable slot entries and schedule period structures.", colorClass: "text-red-400", bgClass: "rgba(239, 68, 68, 0.1)" },
  ];

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/timetable/import/history");
      setHistory(res.data);
    } catch (err) {
      toast.error("Failed to load import history logs.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (file) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls"].includes(ext)) {
      toast.error("Please upload an Excel spreadsheet (.xlsx, .xls).");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setRawReport(null);
    setUploadPhase("uploading");

    try {
      let res;
      if (selectedCategory === "student") {
        res = await api.post("/admin/students/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else if (selectedCategory === "faculty") {
        res = await api.post("/admin/faculty-import/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        // Generic templates
        formData.append("template_type", selectedCategory);
        res = await api.post("/timetable/import/preview", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setRawReport(res.data);
      setUploadPhase("idle");
      toast.success("Excel file parsed and validated successfully!");
    } catch (err) {
      setUploadPhase("idle");
      const msg = err.response?.data?.detail || "Failed to validate Excel file.";
      toast.error(msg);
    }
  };

  const downloadTemplate = async () => {
    try {
      let res;
      let filename = `${selectedCategory}_template.xlsx`;

      if (selectedCategory === "student") {
        res = await api.get("/admin/students/template", { responseType: "blob" });
        filename = "student_import_template.xlsx";
      } else if (selectedCategory === "faculty") {
        res = await api.get("/admin/faculty-import/template", { responseType: "blob" });
        filename = "faculty_import_template.xlsx";
      } else {
        res = await api.get(`/timetable/templates/download/${selectedCategory}`, { responseType: "blob" });
      }

      const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(`${selectedCategory.toUpperCase()} template downloaded.`);
    } catch (err) {
      toast.error("Failed to download template.");
    }
  };

  const getNormalizedReport = () => {
    if (!rawReport) return null;

    if (selectedCategory === "student" || selectedCategory === "faculty") {
      const normalizedErrors = (rawReport.errors || []).map((err) => ({
        row_idx: err.row,
        error_message: err.error
      }));
      const total = rawReport.valid_count + normalizedErrors.length;
      const score = total > 0 ? Math.round((rawReport.valid_count / total) * 100) : 0;

      return {
        filename: rawReport.filename,
        valid_count: rawReport.valid_count,
        invalid_count: rawReport.error_count,
        valid_records: rawReport.valid_records,
        invalid_records: normalizedErrors,
        quality_score: score,
        is_all_in_one: false
      };
    }

    return {
      ...rawReport,
      is_all_in_one: selectedCategory === "all_in_one"
    };
  };

  const handleConfirmImport = async () => {
    const report = getNormalizedReport();
    if (!report) return;

    if (report.valid_count === 0) {
      toast.error("No valid records to import.");
      return;
    }

    setIsImporting(true);
    const loadId = toast.loading("Executing bulk import & establishing data links...");
    try {
      if (selectedCategory === "student") {
        await api.post("/admin/students/import", {
          filename: report.filename,
          students: report.valid_records
        });
      } else if (selectedCategory === "faculty") {
        await api.post("/admin/faculty-import/import", {
          filename: report.filename,
          faculties: report.valid_records
        });
      } else {
        // Generic or All-in-one
        let payload = {};
        if (report.is_all_in_one) {
          const categoriesMap = {};
          Object.keys(report.categories).forEach((key) => {
            categoriesMap[key] = report.categories[key].valid_records;
          });
          payload = {
            template_type: "all_in_one",
            categories: categoriesMap
          };
        } else {
          payload = {
            template_type: selectedCategory,
            valid_records: report.valid_records
          };
        }
        await api.post("/timetable/import/execute", payload);
      }

      toast.success("Data imported successfully!", { id: loadId });
      setSuccessInfo({
        category: selectedCategory,
        validCount: report.valid_count,
        invalidCount: report.invalid_count,
        isAllInOne: report.is_all_in_one,
        categories: report.categories
      });
      setRawReport(null);
      fetchHistory();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to complete import.";
      toast.error(msg, { id: loadId });
    } finally {
      setIsImporting(false);
    }
  };

  const getCategoryConfig = (type) => {
    const matching = categories.find((c) => c.id === type);
    if (matching) return { ...matching, label: matching.label.replace(" Import", "").replace(" Bulk", "") };

    // Fallbacks
    if (type === "all_in_one") return { icon: FileArchive, label: "All-in-One", colorClass: "text-indigo-400", bgClass: "rgba(99, 102, 241, 0.1)" };
    if (type === "student") return { icon: GraduationCap, label: "Student", colorClass: "text-emerald-400", bgClass: "rgba(16, 185, 129, 0.1)" };
    if (type === "faculty") return { icon: Users, label: "Faculty", colorClass: "text-orange-400", bgClass: "rgba(249, 115, 22, 0.1)" };
    if (type === "timetable") return { icon: FileText, label: "Timetable", colorClass: "text-red-400", bgClass: "rgba(239, 68, 68, 0.1)" };
    if (type === "subject") return { icon: BookOpen, label: "Subject", colorClass: "text-purple-400", bgClass: "rgba(139, 92, 246, 0.1)" };
    if (type === "section") return { icon: Grid, label: "Section", colorClass: "text-blue-400", bgClass: "rgba(59, 130, 246, 0.1)" };
    if (type === "department") return { icon: School, label: "Department", colorClass: "text-pink-400", bgClass: "rgba(236, 72, 153, 0.1)" };
    if (type === "classroom") return { icon: Building, label: "Classroom", colorClass: "text-cyan-400", bgClass: "rgba(6, 182, 212, 0.1)" };

    return { icon: FileText, label: type, colorClass: "text-slate-400", bgClass: "rgba(255, 255, 255, 0.1)" };
  };

  const handleExportLog = () => {
    if (history.length === 0) {
      toast.error("No import history logs to export.");
      return;
    }
    const headers = ["ID", "Category", "File Name", "Total Records", "Successful Imports", "Failed Imports", "Status", "Date"];
    const rows = history.map((h) => [
      h.id,
      h.import_type,
      `"${h.filename}"`,
      h.total_records,
      h.successful_imports,
      h.failed_imports,
      h.status,
      h.created_at ? new Date(h.created_at).toLocaleString() : "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "import_transaction_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully!");
  };

  // Filter Transactions
  const filteredHistory = history.filter((h) => {
    const matchesSearch =
      h.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.import_type?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (timeFilter === "all") return true;

    const logDate = h.created_at ? new Date(h.created_at + (h.created_at.endsWith("Z") ? "" : "Z")) : new Date(0);
    const now = new Date();
    const diffTime = Math.abs(now - logDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (timeFilter === "today") return diffDays <= 1;
    if (timeFilter === "week") return diffDays <= 7;
    if (timeFilter === "month") return diffDays <= 30;

    return true;
  });

  // Paginate List
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const report = getNormalizedReport();
  const ActiveIcon = categories.find((c) => c.id === selectedCategory)?.icon || Database;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="data-import-container"
    >
      {/* Header Title Section */}
      <div className="import-header-section">
        <div>
          <h2 className="import-header-title">Data Import Center</h2>
          <p className="import-header-subtitle">
            Provision, validate, and map master academic records in a single interface.
          </p>
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="download-template-btn">
            <ArrowDownToLine size={14} className="download-template-icon" />
            <span>Download Template</span>
          </Button>
        </div>
      </div>

      {/* Categories Selector grid */}
      <div className="category-selection-grid">
        {categories.map((cat) => {
          const CatIcon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setRawReport(null);
              }}
              className={`category-select-card ${isActive ? "category-select-card-active" : ""}`}
            >
              <div className="category-card-header">
                <div className={`category-icon-wrapper ${isActive ? "category-icon-wrapper-active" : ""}`}>
                  <CatIcon size={20} />
                </div>
                <span className="category-card-label">{cat.label}</span>
              </div>
              <p className="category-card-desc">{cat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Workspace Panel */}
      <div className="workspace-layout-single mb-8">
        <Card className="workspace-main-card p-6">
          <div className="workspace-card-title-bar">
            <div className="flex items-center gap-2">
              <ActiveIcon size={18} className="text-red-500" />
              <h3 className="workspace-title text-lg font-bold">
                {categories.find((c) => c.id === selectedCategory)?.label} Console
              </h3>
            </div>
          </div>
          <p className="workspace-card-desc-long text-slate-400 mb-6 text-xs">
            Download the {selectedCategory.replace("_", " ")} template, load details offline, and upload it back. The AI-backed engine resolves references and checks constraints.
          </p>

          {/* Drag and Drop */}
          {uploadPhase === "idle" && !report && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`drag-upload-dropzone ${isDragActive ? "drag-upload-dropzone-active" : ""}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                style={{ display: "none" }}
              />
              <UploadCloud size={38} className="dropzone-cloud-icon mb-3" />
              <span className="dropzone-primary-text block text-sm font-semibold text-slate-200 mb-1">
                Drag & Drop excel file here or click to browse
              </span>
              <span className="dropzone-secondary-text block text-slate-500 text-xs">
                Supports spreadsheet formats (.xlsx, .xls) up to 10MB
              </span>
            </div>
          )}

          {/* Uploading Phase Screen */}
          {uploadPhase !== "idle" && (
            <div className="upload-loader-view py-12 text-center">
              <RefreshCw className="animate-spin text-red-500 mx-auto mb-4" size={36} />
              <span className="block text-slate-200 text-sm font-bold">Parsing and Validating File Data...</span>
              <span className="block text-slate-500 text-xs mt-1">Running cell constraint and link integrity checks.</span>
            </div>
          )}

          {/* Report Viewer */}
          <AnimatePresence>
            {report && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="report-viewer-section mt-4"
              >
                {/* Validation Quality Score */}
                <div className="quality-score-header flex justify-between items-center mb-5 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                  <span className="text-xs font-bold text-slate-400">AI Validation Quality Score</span>
                  <Badge variant={report.quality_score > 80 ? "success" : "warning"}>
                    {report.quality_score}% Match Quality
                  </Badge>
                </div>

                {/* If All-in-One report, display sheet summaries */}
                {report.is_all_in_one ? (
                  <div className="mb-5">
                    <span className="block text-xs font-bold text-slate-400 mb-2">Workbook Category Summary</span>
                    <div className="overflow-x-auto border border-white/5 rounded-lg">
                      <table className="all-in-one-summary-table w-100 text-left text-xs">
                        <thead>
                          <tr className="bg-white/[0.02] border-b border-white/5 text-slate-400">
                            <th className="p-3">Sheet Category</th>
                            <th className="p-3 text-center">Valid Rows</th>
                            <th className="p-3 text-center">Errors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(report.categories).map((cat) => {
                            const catData = report.categories[cat];
                            return (
                              <tr key={cat} className="border-b border-white/[0.03] text-slate-300">
                                <td className="p-3 font-semibold capitalize">{cat === "faculty" ? "Faculty" : `${cat}s`}</td>
                                <td className="p-3 text-center text-emerald-400 font-bold">{catData.valid_count || 0}</td>
                                <td className={`p-3 text-center font-bold ${catData.invalid_count > 0 ? "text-rose-400" : "text-slate-500"}`}>
                                  {catData.invalid_count || 0}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* All-in-One error listing preview */}
                    {Object.keys(report.categories).some((cat) => report.categories[cat].invalid_records?.length > 0) && (
                      <div className="error-log-card mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
                        <span className="block text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Errors Log Preview
                        </span>
                        <div className="max-h-36 overflow-y-auto">
                          {Object.keys(report.categories).map((cat) => {
                            const catData = report.categories[cat];
                            if (!catData.invalid_records || catData.invalid_records.length === 0) return null;
                            return (
                              <div key={cat} className="mb-2">
                                <span className="block text-[10px] text-red-400 font-bold uppercase">{cat === "faculty" ? "Faculty" : `${cat}s`}:</span>
                                {catData.invalid_records.slice(0, 3).map((r, i) => (
                                  <div key={i} className="text-[10px] text-red-300/80 pl-2">
                                    Row {r.row_idx}: {r.error_message}
                                  </div>
                                ))}
                                {catData.invalid_records.length > 3 && (
                                  <span className="text-[9px] text-slate-500 italic pl-2">...and {catData.invalid_records.length - 3} more</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Single template report
                  <>
                    <div className="single-stats-grid grid grid-cols-2 gap-3 mb-4">
                      <div className="stat-pill p-3 bg-white/[0.01] border border-white/5 rounded-lg text-center">
                        <span className="block text-[10px] text-slate-500 uppercase font-semibold">Valid Records</span>
                        <span className="block text-xl font-extrabold text-emerald-400 mt-1">{report.valid_count}</span>
                      </div>
                      <div className="stat-pill p-3 bg-white/[0.01] border border-white/5 rounded-lg text-center">
                        <span className="block text-[10px] text-slate-500 uppercase font-semibold">Errors Detected</span>
                        <span className="block text-xl font-extrabold text-red-400 mt-1">{report.invalid_count}</span>
                      </div>
                    </div>

                    {/* Single error list */}
                    {report.invalid_records.length > 0 && (
                      <div className="error-log-card p-3 bg-red-950/20 border border-red-900/30 rounded-lg mb-4">
                        <span className="block text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                          <AlertCircle size={12} />
                          Validation Errors
                        </span>
                        <div className="max-h-32 overflow-y-auto">
                          {report.invalid_records.map((r, i) => (
                            <div key={i} className="text-[11px] text-red-300/80 py-1 border-b border-white/[0.02] last:border-0">
                              Row {r.row_idx}: {r.error_message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Suggestions Box */}
                {report.suggestions && report.suggestions.length > 0 && (
                  <div className="suggestions-card p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg mb-5 text-[11px] text-blue-300">
                    <span className="font-bold flex items-center gap-1 mb-1">
                      <Sparkles size={12} className="text-blue-400" />
                      Applied AI Resolution Logic:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {report.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1 confirm-import-action-btn"
                    onClick={handleConfirmImport}
                    disabled={report.valid_count === 0 || isImporting}
                  >
                    {isImporting ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <RefreshCw className="animate-spin" size={14} />
                        <span>Importing Academic Data...</span>
                      </div>
                    ) : (
                      "Confirm & Commit Valid Data"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setRawReport(null)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Redesigned Import Transaction Log Panel (Full Width) */}
      <Card className="redesigned-history-panel p-8">
        <div className="panel-header-section" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div className="panel-history-icon-box">
            <History size={22} className="text-red-500" />
          </div>
          <div className="panel-header-titles">
            <h3 className="panel-title-text">Import Transaction Log</h3>
            <p className="panel-desc-text">
              Audit history of academic data provisionings, runtime validation status, and user uploads.
            </p>
          </div>
        </div>

        {/* Filters and Search Bar row */}
        <div className="filter-controls-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', alignItems: 'center', width: '100%' }}>
          <div className="dropdown-filter-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 'auto', minWidth: '170px' }}>
            <Calendar size={14} className="dropdown-calendar-icon" />
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="time-select-dropdown"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <ChevronDown size={14} className="dropdown-chevron-icon" />
          </div>

          <div className="search-bar-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by file name, type..."
              className="search-text-input"
            />
          </div>
        </div>

        {/* Transactions List */}
        <div className="transactions-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loadingHistory ? (
            <div className="py-16 text-center">
              <RefreshCw className="animate-spin text-red-500 mx-auto" size={32} />
              <span className="block text-slate-500 text-xs mt-2">Loading audit history...</span>
            </div>
          ) : paginatedHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-600 text-xs">
              No matching import transactions found.
            </div>
          ) : (
            paginatedHistory.map((h) => {
              const cfg = getCategoryConfig(h.import_type);
              const LogIcon = cfg.icon;
              const hasErrors = h.failed_imports > 0 || h.status === "failed";
              const errorCount = h.failed_imports || 0;

              return (
                <div key={h.id} className="transaction-log-card" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)', background: 'rgba(255, 255, 255, 0.01)', gap: '16px', position: 'relative', overflow: 'hidden', width: '100%' }}>
                  {/* Left Side: Category Icon & Title Details */}
                  <div className="transaction-log-left" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', flex: 1, minWidth: '250px' }}>
                    <div
                      className="log-item-icon-circle"
                      style={{
                        background: cfg.bgClass || "rgba(255, 255, 255, 0.05)",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        flexShrink: 0
                      }}
                    >
                      <LogIcon size={18} className={cfg.colorClass} />
                    </div>
                    <div className="log-item-details" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0, flexGrow: 1 }}>
                      <span className={`log-item-category-label ${cfg.colorClass}`} style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', display: 'block' }}>
                        {cfg.label} Import
                      </span>
                      <h4 className="transaction-filename" title={h.filename} style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                        {h.filename}
                      </h4>
                      <div className="transaction-stats-text" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        <span className="stats-loaded" style={{ color: '#cbd5e1', fontWeight: 550 }}>
                          {h.successful_imports} / {h.total_records} loaded
                        </span>
                        <span className="stats-dot">•</span>
                        {hasErrors ? (
                          <span className="stats-errors" style={{ color: '#f43f5e', fontWeight: 700 }}>{errorCount} error{errorCount !== 1 ? "s" : ""}</span>
                        ) : (
                          <span className="stats-no-errors" style={{ color: '#10b981', fontWeight: 700 }}>No errors</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Status Badge, Timestamp & Action */}
                  <div className="transaction-log-right" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="status-time-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <Badge variant={h.status === "completed" ? "success" : "danger"}>
                        {h.status === "completed" ? "COMPLETED" : "FAILED"}
                      </Badge>
                      <div className="transaction-timestamp" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                        <Calendar size={10} className="timestamp-calendar-icon" style={{ display: 'flex', alignItems: 'center' }} />
                        <span>{h.created_at ? new Date(h.created_at + (h.created_at.endsWith("Z") ? "" : "Z")).toLocaleString() : "N/A"}</span>
                      </div>
                    </div>

                    <button
                      className="log-details-view-action-btn"
                      onClick={() => {
                        setSelectedLog(h);
                        setShowDetailModal(true);
                      }}
                      title="View transaction details"
                      style={{
                        width: '34px',
                        height: '34px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        padding: 0,
                        outline: 'none'
                      }}
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions / Pagination Row */}
        <div className="panel-footer-pagination" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '20px', marginTop: '24px', width: '100%' }}>
          <Button variant="outline" size="sm" onClick={handleExportLog} className="export-log-csv-btn">
            <Download size={13} className="export-log-download-icon" />
            <span>Export Log</span>
          </Button>

          <div className="pagination-right-section" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
            <span className="pagination-info-text" style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
              {filteredHistory.length > 0
                ? `${(currentPage - 1) * itemsPerPage + 1} – ${Math.min(currentPage * itemsPerPage, filteredHistory.length)} of ${filteredHistory.length}`
                : "0 – 0 of 0"}
            </span>

            <div className="pagination-arrows-list" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                className="pagination-nav-arrow-btn"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  Math.abs(pageNum - currentPage) <= 1
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`pagination-num-btn ${currentPage === pageNum ? "pagination-num-btn-active" : ""}`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === 2 ||
                  pageNum === totalPages - 1
                ) {
                  return <span key={pageNum} className="text-slate-600 text-xs px-1">...</span>;
                }
                return null;
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                className="pagination-nav-arrow-btn"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Log Detail Viewer Modal */}
      {showDetailModal && selectedLog && (
        <div className="log-detail-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="log-detail-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-section">
              <h3 className="modal-title font-extrabold text-slate-100 text-base">Import Transaction Details</h3>
              <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body-section">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs text-left">
                <div>
                  <span className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-0.5">Category</span>
                  <span className="text-slate-200 font-bold capitalize">{selectedLog.import_type?.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-0.5">File Name</span>
                  <span className="text-slate-200 font-semibold break-all">{selectedLog.filename}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-0.5">Imported Records</span>
                  <span className="text-emerald-400 font-bold">{selectedLog.successful_imports} / {selectedLog.total_records} loaded</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-0.5">Date & Time</span>
                  <span className="text-slate-300 font-semibold">{selectedLog.created_at ? new Date(selectedLog.created_at + (selectedLog.created_at.endsWith("Z") ? "" : "Z")).toLocaleString() : "N/A"}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-0.5">Status</span>
                  <Badge variant={selectedLog.status === "completed" ? "success" : "danger"}>
                    {selectedLog.status === "completed" ? "COMPLETED" : "FAILED"}
                  </Badge>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-0.5">Runtime Speed</span>
                  <span className="text-slate-300 font-semibold">{selectedLog.processing_time_ms} ms</span>
                </div>
              </div>
              
              {selectedLog.failed_records_log && (
                <div className="modal-error-section p-3.5 bg-red-950/20 border border-red-900/30 rounded-xl text-left font-mono">
                  <span className="block text-xs font-bold text-red-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    Failed Rows & Errors:
                  </span>
                  <pre className="text-[10px] text-red-300/80 overflow-y-auto whitespace-pre-wrap max-h-48 scrollbar-none font-mono">
                    {selectedLog.failed_records_log}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Summary Modal */}
      {successInfo && (
        <div className="log-detail-modal-overlay" onClick={() => setSuccessInfo(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="log-detail-modal-content text-center p-8"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', borderRadius: '16px', background: '#0d111b', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={32} />
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-100 mb-1">Import Successful!</h3>
            <p className="text-[11px] text-slate-400 mb-5">
              Your academic data has been successfully parsed, validated, and saved.
            </p>
            
            <div className="bg-white/[0.01] border border-white/5 rounded-lg p-3.5 mb-5 text-left text-xs text-slate-300 space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold capitalize">{successInfo.category.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Successful Records:</span>
                <span className="text-emerald-400 font-bold">{successInfo.validCount} rows</span>
              </div>
              {successInfo.invalidCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Skipped (Errors):</span>
                  <span className="text-rose-400 font-bold">{successInfo.invalidCount} rows</span>
                </div>
              )}
            </div>

            <Button variant="primary" className="w-full confirm-import-action-btn" onClick={() => setSuccessInfo(null)}>
              Done
            </Button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
