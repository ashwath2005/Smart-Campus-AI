import React, { useState, useEffect, useMemo } from "react";
import api from "../../../api/axios";
import { Skeleton, Button } from "../../../components/ui";
import {
  Briefcase,
  Users,
  Building,
  UserCheck,
  TrendingUp,
  Download,
  Calendar,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  Filter,
  RefreshCw,
  Award,
  ChevronRight,
  Eye
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { CreateDriveModal } from "./CreateDriveModal";
import { CompanyModal } from "./CompanyModal";
import "./AdminPlacementsView.css";

export const AdminPlacementsView = () => {
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("drives"); // 'drives' | 'applications' | 'companies' | 'funnel'

  // Drives filter
  const [driveSearch, setDriveSearch] = useState("");
  const [driveTypeFilter, setDriveTypeFilter] = useState("all");
  const [driveStatusFilter, setDriveStatusFilter] = useState("all");

  // Applications filter
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [appDriveFilter, setAppDriveFilter] = useState("all");

  // Cycle
  const [cycleYear, setCycleYear] = useState("2026");

  // Modals
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveToEdit, setDriveToEdit] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [drivesRes, compRes, overviewRes, appsRes] = await Promise.all([
        api.get("/placements"),
        api.get("/placements/companies"),
        api.get("/placements/admin-overview"),
        api.get("/placements/applications/all"),
      ]);

      setDrives(Array.isArray(drivesRes.data) ? drivesRes.data : []);
      setCompanies(Array.isArray(compRes.data) ? compRes.data : []);
      setOverview(overviewRes.data || null);
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
    } catch (err) {
      toast.error("Failed to load placement management data from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Drive operations
  const handleSaveDrive = async (payload, editId = null) => {
    try {
      if (editId) {
        await api.put(`/placements/${editId}`, payload);
        toast.success("Placement drive updated successfully!");
      } else {
        await api.post("/placements", payload);
        toast.success("New placement drive published successfully!");
      }
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error saving placement drive");
      throw err;
    }
  };

  const handleDeleteDrive = async (driveId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will also remove any linked applications.`)) {
      return;
    }
    try {
      await api.delete(`/placements/${driveId}`);
      toast.success("Placement drive deleted successfully");
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete placement drive");
    }
  };

  // Company operations
  const handleSaveCompany = async (payload, editId = null) => {
    try {
      if (editId) {
        await api.put(`/placements/companies/${editId}`, payload);
        toast.success("Company profile updated successfully!");
      } else {
        await api.post("/placements/companies", payload);
        toast.success("Company profile created successfully!");
      }
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error saving company");
      throw err;
    }
  };

  const handleDeleteCompany = async (companyId, name) => {
    if (!window.confirm(`Are you sure you want to delete corporate partner "${name}"?`)) {
      return;
    }
    try {
      await api.delete(`/placements/companies/${companyId}`);
      toast.success("Company deleted successfully");
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete company");
    }
  };

  // Application status updates
  const handleUpdateAppStatus = async (appId, newStatus) => {
    try {
      await api.put(`/placements/applications/${appId}/status`, {
        status: newStatus,
        interview_status: newStatus === "shortlisted" ? "Round 1 Scheduled" : undefined,
        offer_status: newStatus === "selected" ? "Offer Released" : undefined,
      });
      toast.success(`Application marked as '${newStatus.toUpperCase()}'`);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update application status");
    }
  };

  // Export CSV Report with real data
  const handleExportReport = () => {
    const reportData = [
      ["CAMPUS PLACEMENT COMMAND REPORT", `Cycle ${cycleYear}`],
      ["Generated At", new Date().toLocaleString()],
      [],
      ["PLACEMENT METRICS", "COUNT"],
      ["Total Eligible Students", overview?.eligible ?? 0],
      ["Total Active Drives", drives.length],
      ["Total Applications", applications.length],
      ["Shortlisted Candidates", overview?.shortlisted ?? 0],
      ["Placed / Offers Extended", overview?.placed ?? 0],
      ["Placement Rate", `${overview?.placement_rate ?? 0}%`],
      ["Highest Package", overview?.highest_package ?? "0 LPA"],
      ["Average Package", overview?.avg_package ?? "0 LPA"],
      [],
      ["ACTIVE PLACEMENT DRIVES"],
      ["ID", "Role Title", "Company", "Type", "Package", "Deadline", "Registration Mode", "Applicants", "Status"],
      ...drives.map((d) => [
        d.id,
        d.title,
        d.companyName || d.company,
        d.type,
        d.package,
        d.deadline,
        d.registrationType,
        d.applicantCount ?? 0,
        d.status,
      ]),
      [],
      ["STUDENT APPLICATIONS"],
      ["App ID", "Student Name", "Roll Number", "Department", "Company", "Job Title", "Resume Score", "Status", "Applied At"],
      ...applications.map((a) => [
        a.id,
        a.studentName,
        a.studentRollNumber,
        a.studentDepartment,
        a.companyName,
        a.placementTitle,
        a.resumeScore ?? "N/A",
        a.status,
        a.appliedAt,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      reportData.map((row) => row.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `placement_command_report_${cycleYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Placement report downloaded successfully!");
  };

  // Filtered drives
  const filteredDrives = useMemo(() => {
    return drives.filter((d) => {
      const matchSearch =
        d.title.toLowerCase().includes(driveSearch.toLowerCase()) ||
        (d.companyName || d.company || "").toLowerCase().includes(driveSearch.toLowerCase());
      const matchType = driveTypeFilter === "all" || d.type === driveTypeFilter;
      const matchStatus = driveStatusFilter === "all" || d.status === driveStatusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [drives, driveSearch, driveTypeFilter, driveStatusFilter]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch =
        a.studentName.toLowerCase().includes(appSearch.toLowerCase()) ||
        a.studentRollNumber.toLowerCase().includes(appSearch.toLowerCase()) ||
        a.companyName.toLowerCase().includes(appSearch.toLowerCase()) ||
        a.placementTitle.toLowerCase().includes(appSearch.toLowerCase());
      const matchStatus = appStatusFilter === "all" || a.status === appStatusFilter;
      const matchDrive = appDriveFilter === "all" || String(a.placementId) === String(appDriveFilter);
      return matchSearch && matchStatus && matchDrive;
    });
  }, [applications, appSearch, appStatusFilter, appDriveFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="admin-placements-command-view"
    >
      {/* Modals */}
      <CreateDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => {
          setIsDriveModalOpen(false);
          setDriveToEdit(null);
        }}
        onSave={handleSaveDrive}
        companies={companies}
        driveToEdit={driveToEdit}
      />

      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => {
          setIsCompanyModalOpen(false);
          setCompanyToEdit(null);
        }}
        onSave={handleSaveCompany}
        companyToEdit={companyToEdit}
      />

      {/* Header Bar */}
      <header className="admin-placements-header-row">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="admin-placements-title">
              <Briefcase size={24} className="text-red-500" />
              Placement Command Center
            </h2>
            <span className="placements-live-badge">
              <Sparkles size={12} /> CYCLE {cycleYear}
            </span>
          </div>
          <p className="admin-placements-subtitle">
            Administer recruitment drives, verify student applications, manage corporate partners & placement analytics
          </p>
        </div>

        <div className="admin-placements-controls">
          <div className="placements-select-wrapper">
            <Calendar size={14} className="placements-action-icon" />
            <select
              value={cycleYear}
              onChange={(e) => setCycleYear(e.target.value)}
              className="placements-cycle-select"
            >
              <option value="2026">Placement Cycle 2026</option>
              <option value="2025">Placement Cycle 2025</option>
            </select>
          </div>

          <button onClick={handleExportReport} className="placements-export-btn drives-action-btn">
            <Download size={14} />
            <span>Export Report</span>
          </button>

          <button
            onClick={() => {
              setCompanyToEdit(null);
              setIsCompanyModalOpen(true);
            }}
            className="placements-add-comp-btn drives-action-btn"
          >
            <Building size={14} />
            <span>Add Company</span>
          </button>

          <button
            onClick={() => {
              setDriveToEdit(null);
              setIsDriveModalOpen(true);
            }}
            className="command-export-btn"
          >
            <Plus size={14} />
            <span>Create Drive</span>
          </button>
        </div>
      </header>

      {/* Real-time KPI Cards Grid */}
      <section className="admin-placements-kpi-grid">
        <motion.div whileHover={{ y: -2 }} className="kpi-card">
          <div className="kpi-card-header-row">
            <span className="kpi-label">Eligible Students</span>
            <div className="kpi-icon-wrapper blue"><Users size={16} /></div>
          </div>
          <div className="kpi-value">{overview?.eligible ?? 0}</div>
          <div className="kpi-footer-text">Registered student pool</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="kpi-card">
          <div className="kpi-card-header-row">
            <span className="kpi-label">Active Drives</span>
            <div className="kpi-icon-wrapper amber"><Briefcase size={16} /></div>
          </div>
          <div className="kpi-value amber">{drives.length}</div>
          <div className="kpi-footer-text">
            Across {companies.length} corporate partners
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="kpi-card">
          <div className="kpi-card-header-row">
            <span className="kpi-label">Applications Received</span>
            <div className="kpi-icon-wrapper purple"><UserCheck size={16} /></div>
          </div>
          <div className="kpi-value purple">{applications.length}</div>
          <div className="kpi-footer-text">
            {overview?.shortlisted ?? 0} shortlisted for interviews
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="kpi-card">
          <div className="kpi-card-header-row">
            <span className="kpi-label">Placement Success Rate</span>
            <div className="kpi-icon-wrapper emerald"><Award size={16} /></div>
          </div>
          <div className="kpi-value emerald">{overview?.placement_rate ?? 0}%</div>
          <div className="kpi-footer-text emerald">
            Highest: {overview?.highest_package || "0 LPA"}
          </div>
        </motion.div>
      </section>

      {/* Tab Navigation */}
      <nav className="admin-tabs-nav">
        <button
          onClick={() => setActiveTab("drives")}
          className={`admin-tab-btn ${activeTab === "drives" ? "active" : ""}`}
        >
          <Briefcase size={15} />
          <span>Placement Drives</span>
          <span className="admin-tab-count">{drives.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("applications")}
          className={`admin-tab-btn ${activeTab === "applications" ? "active" : ""}`}
        >
          <UserCheck size={15} />
          <span>Student Applications</span>
          <span className="admin-tab-count">{applications.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("companies")}
          className={`admin-tab-btn ${activeTab === "companies" ? "active" : ""}`}
        >
          <Building size={15} />
          <span>Corporate Partners</span>
          <span className="admin-tab-count">{companies.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("funnel")}
          className={`admin-tab-btn ${activeTab === "funnel" ? "active" : ""}`}
        >
          <TrendingUp size={15} />
          <span>Recruitment Funnel</span>
        </button>
      </nav>

      {/* Main Tab Content */}
      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : (
        <>
          {/* TAB 1: PLACEMENT DRIVES */}
          {activeTab === "drives" && (
            <div className="drives-section-card glassmorphism-card">
              <div className="drives-section-header">
                <div>
                  <h4 className="drives-section-title">Institutional Recruitment Drives ({filteredDrives.length})</h4>
                  <p className="drives-section-sub">Corporate hiring listings, requirements, packages and application dead-lines</p>
                </div>

                <div className="drives-filter-bar">
                  <div className="drives-search-bar">
                    <Search size={14} className="drives-search-icon" />
                    <input
                      type="text"
                      placeholder="Search role or company..."
                      value={driveSearch}
                      onChange={(e) => setDriveSearch(e.target.value)}
                      className="drives-search-input"
                    />
                  </div>

                  <select
                    value={driveTypeFilter}
                    onChange={(e) => setDriveTypeFilter(e.target.value)}
                    className="drives-filter-select"
                  >
                    <option value="all">All Types</option>
                    <option value="fulltime">Full-Time</option>
                    <option value="internship">Internship</option>
                  </select>

                  <select
                    value={driveStatusFilter}
                    onChange={(e) => setDriveStatusFilter(e.target.value)}
                    className="drives-filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {filteredDrives.length > 0 ? (
                <div className="drives-table-container">
                  <table className="drives-table">
                    <thead className="drives-thead">
                      <tr>
                        <th className="drives-th" style={{ width: "30%" }}>Role & Company</th>
                        <th className="drives-th">Type</th>
                        <th className="drives-th">Package (CTC)</th>
                        <th className="drives-th">Portal Mode</th>
                        <th className="drives-th">Deadline</th>
                        <th className="drives-th">Applicants</th>
                        <th className="drives-th">Status</th>
                        <th className="drives-th" style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrives.map((d) => (
                        <tr key={d.id} className="drives-tr">
                          <td className="drives-td">
                            <div className="drives-company-name">{d.title}</div>
                            <div className="drives-company-sub">{d.companyName || d.company}</div>
                          </td>
                          <td className="drives-td">
                            <span className="drives-type-tag">
                              {d.type === "internship" ? "Internship" : "Full-Time"}
                            </span>
                          </td>
                          <td className="drives-td">
                            <span className="drives-package-badge">{d.package}</span>
                          </td>
                          <td className="drives-td">
                            {d.registrationType === "EXTERNAL" ? (
                              <div className="drives-mode-external">
                                <ExternalLink size={13} />
                                <span>External</span>
                              </div>
                            ) : (
                              <span className="drives-mode-internal">Internal SCME</span>
                            )}
                          </td>
                          <td className="drives-td text-date">{d.deadline}</td>
                          <td className="drives-td">
                            <button
                              onClick={() => {
                                setAppDriveFilter(String(d.id));
                                setActiveTab("applications");
                              }}
                              className="drives-action-btn"
                              title="View applicants for this drive"
                            >
                              <Users size={12} />
                              <span>{d.applicantCount ?? 0}</span>
                            </button>
                          </td>
                          <td className="drives-td">
                            <span className={`drives-status-badge ${d.status === "open" ? "status-open" : "status-closed"}`}>
                              {d.status === "open" ? "● Open" : "Closed"}
                            </span>
                          </td>
                          <td className="drives-td" style={{ textAlign: "right" }}>
                            <div className="drives-actions-group">
                              <button
                                onClick={() => {
                                  setDriveToEdit(d);
                                  setIsDriveModalOpen(true);
                                }}
                                className="drives-action-btn"
                                title="Edit Drive"
                              >
                                <Edit size={13} />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => handleDeleteDrive(d.id, d.title)}
                                className="drives-action-btn delete"
                                title="Delete Drive"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="drives-empty">
                  <div className="empty-icon-circle"><Briefcase size={22} /></div>
                  <p>No placement drives match your filters.</p>
                  <button
                    onClick={() => {
                      setDriveToEdit(null);
                      setIsDriveModalOpen(true);
                    }}
                    className="command-export-btn"
                    style={{ marginTop: 8 }}
                  >
                    <Plus size={14} /> Create New Drive
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STUDENT APPLICATIONS */}
          {activeTab === "applications" && (
            <div className="drives-section-card glassmorphism-card">
              <div className="drives-section-header">
                <div>
                  <h4 className="drives-section-title">Student Applications ({filteredApplications.length})</h4>
                  <p className="drives-section-sub">Review candidate submissions, AI resume scores, and update shortlisting status</p>
                </div>

                <div className="drives-filter-bar">
                  <div className="drives-search-bar">
                    <Search size={14} className="drives-search-icon" />
                    <input
                      type="text"
                      placeholder="Search student, roll no, company..."
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      className="drives-search-input"
                    />
                  </div>

                  <select
                    value={appDriveFilter}
                    onChange={(e) => setAppDriveFilter(e.target.value)}
                    className="drives-filter-select"
                  >
                    <option value="all">All Drives</option>
                    {drives.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.title} ({d.companyName || d.company})
                      </option>
                    ))}
                  </select>

                  <select
                    value={appStatusFilter}
                    onChange={(e) => setAppStatusFilter(e.target.value)}
                    className="drives-filter-select"
                  >
                    <option value="all">All Statuses</option>
                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="selected">Selected / Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {filteredApplications.length > 0 ? (
                <div className="drives-table-container">
                  <table className="drives-table">
                    <thead className="drives-thead">
                      <tr>
                        <th className="drives-th" style={{ width: "26%" }}>Candidate</th>
                        <th className="drives-th" style={{ width: "24%" }}>Role & Company</th>
                        <th className="drives-th">Applied On</th>
                        <th className="drives-th">AI Score</th>
                        <th className="drives-th">Status</th>
                        <th className="drives-th" style={{ textAlign: "right" }}>Update Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((app) => {
                        const score = app.resumeScore ?? 75;
                        const scoreClass = score >= 80 ? "high" : score >= 60 ? "mid" : "low";

                        return (
                          <tr key={app.id} className="drives-tr">
                            <td className="drives-td">
                              <div className="candidate-info-cell">
                                <div className="candidate-name">{app.studentName}</div>
                                <div className="candidate-meta">
                                  {app.studentRollNumber} • {app.studentDepartment}
                                </div>
                                <div className="candidate-meta text-xs text-slate-400">
                                  {app.studentEmail}
                                </div>
                              </div>
                            </td>
                            <td className="drives-td">
                              <div className="drives-company-name">{app.placementTitle}</div>
                              <div className="drives-company-sub">{app.companyName} ({app.package})</div>
                            </td>
                            <td className="drives-td text-date">{app.appliedAt?.slice(0, 10) || "N/A"}</td>
                            <td className="drives-td">
                              <span className={`candidate-score-badge ${scoreClass}`} title={app.resumeReview || "Resume score"}>
                                <Sparkles size={11} /> {score}/100
                              </span>
                            </td>
                            <td className="drives-td">
                              <span className={`app-status-badge ${app.status}`}>
                                {app.status === "selected" ? "Selected (Offer)" : app.status}
                              </span>
                            </td>
                            <td className="drives-td" style={{ textAlign: "right" }}>
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                                className="status-select"
                              >
                                <option value="applied">Applied</option>
                                <option value="shortlisted">Shortlist</option>
                                <option value="selected">Select (Offer)</option>
                                <option value="rejected">Reject</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="drives-empty">
                  <div className="empty-icon-circle"><UserCheck size={22} /></div>
                  <p>No student applications found matching criteria.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CORPORATE PARTNERS */}
          {activeTab === "companies" && (
            <div className="drives-section-card glassmorphism-card">
              <div className="drives-section-header">
                <div>
                  <h4 className="drives-section-title">Recruiting Corporate Partners ({companies.length})</h4>
                  <p className="drives-section-sub">Corporate enterprise partners registered for on-campus & off-campus hiring</p>
                </div>

                <button
                  onClick={() => {
                    setCompanyToEdit(null);
                    setIsCompanyModalOpen(true);
                  }}
                  className="command-export-btn"
                >
                  <Plus size={14} /> Add Company Profile
                </button>
              </div>

              {companies.length > 0 ? (
                <div className="companies-grid">
                  {companies.map((c) => (
                    <div key={c.id} className="company-card">
                      <div>
                        <div className="company-card-top">
                          <div className="company-logo-box">
                            {c.logo && !c.logo.includes("placeholder") ? (
                              <img src={c.logo} alt={c.name} className="company-logo-img" />
                            ) : (
                              <Building size={22} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="company-card-title">{c.name}</h3>
                            <span className="company-card-industry">{c.industry || "Technology"}</span>
                          </div>
                        </div>

                        <p className="company-card-desc" style={{ marginTop: 12 }}>
                          {c.description || "Leading recruitment partner offering graduate and internship programs."}
                        </p>
                      </div>

                      <div className="company-card-footer">
                        <span className="company-drives-tag">
                          {c.drivesCount ?? 0} Drives Posted
                        </span>

                        <div className="drives-actions-group">
                          {c.website && (
                            <a
                              href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="drives-action-btn"
                              title="Visit Website"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}

                          <button
                            onClick={() => {
                              setCompanyToEdit(c);
                              setIsCompanyModalOpen(true);
                            }}
                            className="drives-action-btn"
                            title="Edit Company"
                          >
                            <Edit size={12} />
                          </button>

                          <button
                            onClick={() => handleDeleteCompany(c.id, c.name)}
                            className="drives-action-btn delete"
                            title="Delete Company"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="drives-empty">
                  <div className="empty-icon-circle"><Building size={22} /></div>
                  <p>No corporate partner companies registered yet.</p>
                  <button
                    onClick={() => {
                      setCompanyToEdit(null);
                      setIsCompanyModalOpen(true);
                    }}
                    className="command-export-btn"
                    style={{ marginTop: 8 }}
                  >
                    <Plus size={14} /> Add First Company
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECRUITMENT FUNNEL & ANALYTICS */}
          {activeTab === "funnel" && (
            <div className="placement-funnel-card glassmorphism-card">
              <div className="funnel-card-header">
                <div>
                  <span className="funnel-title-highlight">Recruitment </span>
                  <span className="funnel-title-sub">Funnel & Conversion</span>
                  <p className="funnel-subtitle">
                    Real-time student progress tracking from eligible pool to confirmed job offers
                  </p>
                </div>
              </div>

              <div className="funnel-rows-container">
                <div className="funnel-row-item">
                  <div className="funnel-icon-box"><Users size={16} /></div>
                  <div className="funnel-stage-details">
                    <span className="funnel-stage-name">Total Eligible Students</span>
                    <span className="funnel-stage-subtext">Verified candidate base</span>
                  </div>
                  <div className="funnel-progress-bar-container">
                    <div className="funnel-progress-fill" style={{ width: "100%" }} />
                  </div>
                  <div className="funnel-stage-metrics">
                    <span className="funnel-stage-of-total">100% POOL</span>
                    <span className="funnel-stage-val-label">{overview?.eligible ?? 0} Students</span>
                  </div>
                </div>

                <div className="funnel-row-item active-highlight">
                  <div className="funnel-icon-box"><UserCheck size={16} /></div>
                  <div className="funnel-stage-details">
                    <span className="funnel-stage-name">Applications Received</span>
                    <span className="funnel-stage-subtext">Applied across active drives</span>
                  </div>
                  <div className="funnel-progress-bar-container">
                    <div
                      className="funnel-progress-fill"
                      style={{
                        width: `${overview?.eligible ? Math.min(100, Math.round((applications.length / overview.eligible) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="funnel-stage-metrics">
                    <span className="funnel-stage-of-total">
                      {overview?.eligible ? Math.round((applications.length / overview.eligible) * 100) : 0}% ENGAGED
                    </span>
                    <span className="funnel-stage-val-label">{applications.length} Submissions</span>
                  </div>
                </div>

                <div className="funnel-row-item">
                  <div className="funnel-icon-box"><Briefcase size={16} /></div>
                  <div className="funnel-stage-details">
                    <span className="funnel-stage-name">Shortlisted Candidates</span>
                    <span className="funnel-stage-subtext">Selected for interview rounds</span>
                  </div>
                  <div className="funnel-progress-bar-container">
                    <div
                      className="funnel-progress-fill"
                      style={{
                        width: `${applications.length ? Math.min(100, Math.round(((overview?.shortlisted || 0) / applications.length) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="funnel-stage-metrics">
                    <span className="funnel-stage-of-total">
                      {applications.length ? Math.round(((overview?.shortlisted || 0) / applications.length) * 100) : 0}% SHORTLIST
                    </span>
                    <span className="funnel-stage-val-label">{overview?.shortlisted ?? 0} Candidates</span>
                  </div>
                </div>

                <div className="funnel-row-item">
                  <div className="funnel-icon-box"><Award size={16} /></div>
                  <div className="funnel-stage-details">
                    <span className="funnel-stage-name">Placed & Offers Extended</span>
                    <span className="funnel-stage-subtext">Confirmed hiring offers</span>
                  </div>
                  <div className="funnel-progress-bar-container">
                    <div
                      className="funnel-progress-fill"
                      style={{ width: `${Math.min(100, overview?.placement_rate || 0)}%` }}
                    />
                  </div>
                  <div className="funnel-stage-metrics">
                    <span className="funnel-stage-of-total">{overview?.placement_rate ?? 0}% PLACED</span>
                    <span className="funnel-stage-val-label">{overview?.placed ?? 0} Offers</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};
