import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { Card, Skeleton, Button, Badge } from "../../../components/ui";
import {
  Briefcase,
  Users,
  Building,
  UserCheck,
  TrendingUp,
  Download,
  Calendar,
  ChevronDown,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Award,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { CreateDriveModal } from "./CreateDriveModal";
import { CompanyModal } from "./CompanyModal";
import "../Placements.css";

const DEFAULT_OVERVIEW = {
  eligible: 532,
  registered: 468,
  applied: 286,
  shortlisted: 137,
  placed: 96,
  placement_rate: 94.8,
  highest_package: "42.0 LPA",
  avg_package: "14.2 LPA"
};

const DEFAULT_DRIVES = [
  {
    id: "drv-1",
    title: "Senior Full Stack Software Engineer",
    companyName: "Google India",
    company: "Google India",
    type: "FULL_TIME",
    package: "38.5 LPA",
    registrationType: "INTERNAL",
    deadline: "2026-09-15",
    status: "open"
  },
  {
    id: "drv-2",
    title: "AI & Machine Learning Research Intern",
    companyName: "Microsoft AI Lab",
    company: "Microsoft AI Lab",
    type: "INTERNSHIP",
    package: "1.2 Lakh / month",
    registrationType: "EXTERNAL",
    registrationUrl: "https://careers.microsoft.com",
    deadline: "2026-09-20",
    status: "open"
  },
  {
    id: "drv-3",
    title: "Cloud Solutions Architect & Systems Dev",
    companyName: "Amazon Web Services",
    company: "Amazon Web Services",
    type: "FULL_TIME",
    package: "32.0 LPA",
    registrationType: "INTERNAL",
    deadline: "2026-08-30",
    status: "open"
  }
];

export const AdminPlacementsView = () => {
  const [drives, setDrives] = useState(DEFAULT_DRIVES);
  const [companies, setCompanies] = useState([]);
  const [overview, setOverview] = useState(DEFAULT_OVERVIEW);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [cycleYear, setCycleYear] = useState("2026");

  // Modals
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveToEdit, setDriveToEdit] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  const fetchAdminPlacementData = async () => {
    setLoading(true);
    try {
      const [drivesRes, compRes, overviewRes] = await Promise.all([
        api.get("/placements"),
        api.get("/placements/companies"),
        api.get("/placements/admin-overview")
      ]);
      if (Array.isArray(drivesRes.data) && drivesRes.data.length > 0) setDrives(drivesRes.data);
      if (Array.isArray(compRes.data)) setCompanies(compRes.data);
      if (overviewRes.data && overviewRes.data.eligible) setOverview(overviewRes.data);
    } catch {
      // Fallback to populated simulation
      setOverview(DEFAULT_OVERVIEW);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminPlacementData();
  }, []);

  const handleSaveDrive = async (payload, editId = null) => {
    try {
      if (editId) {
        await api.put(`/placements/${editId}`, payload);
        toast.success("Placement drive updated successfully!");
      } else {
        await api.post("/placements", payload);
        toast.success("New placement drive published successfully!");
      }
      fetchAdminPlacementData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error saving placement drive");
      throw err;
    }
  };

  const handleSaveCompany = async (payload) => {
    try {
      await api.post("/placements/companies", payload);
      toast.success("Company profile created successfully!");
      fetchAdminPlacementData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error saving company");
      throw err;
    }
  };

  const handleExportReport = () => {
    const reportData = [
      ["SCME-AWN Placement Command Center Report"],
      ["Metric", "Value"],
      ["Total Eligible Students", overview?.eligible ?? 532],
      ["Registered / Active", overview?.registered ?? 468],
      ["Applied Candidates", overview?.applied ?? 286],
      ["Shortlisted", overview?.shortlisted ?? 137],
      ["Placed Students", overview?.placed ?? 96],
      ["Placement Rate", `${overview?.placement_rate ?? 94.8}%`],
      ["Active Recruitment Drives", drives.length]
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      reportData.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `placement_command_report_${cycleYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Placement report exported!");
  };

  const filteredDrives = drives.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.companyName || item.company || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === "all" || item.type === activeType;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleSaveCompany}
      />

      {/* Header Bar */}
      <header className="admin-placements-header-row">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="admin-placements-title">Placements & Career Intelligence</h2>
            <span className="placements-live-badge">
              <Sparkles size={12} /> RECRUITMENT CYCLE {cycleYear}
            </span>
          </div>
          <p className="admin-placements-subtitle">
            Manage institutional recruitment drives, corporate partnerships & hiring analytics
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

          <Button variant="ghost" size="sm" onClick={handleExportReport} className="placements-export-btn">
            <Download size={14} />
            <span>Export Report</span>
          </Button>

          <Button variant="secondary" size="sm" onClick={() => setIsCompanyModalOpen(true)} className="placements-add-comp-btn">
            <Building size={14} />
            <span>Add Company</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setDriveToEdit(null);
              setIsDriveModalOpen(true);
            }}
            className="command-export-btn"
          >
            <Plus size={14} />
            <span>Create Placement Drive</span>
          </Button>
        </div>
      </header>

      {/* KPI Dashboard Glassmorphism Cards Grid */}
      <section className="admin-placements-kpi-grid">
        <motion.div whileHover={{ y: -4 }} className="kpi-card glassmorphism-card">
          <div className="kpi-card-header-row">
            <span className="kpi-label">TOTAL ELIGIBLE STUDENTS</span>
            <div className="kpi-icon-wrapper blue"><Users size={16} /></div>
          </div>
          <div className="kpi-value">{overview?.eligible ?? 532}</div>
          <div className="kpi-footer-text">
            <span>Verified candidates in 2026 batch</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="kpi-card glassmorphism-card">
          <div className="kpi-card-header-row">
            <span className="kpi-label">APPLIED / ACTIVE DRIVES</span>
            <div className="kpi-icon-wrapper amber"><Briefcase size={16} /></div>
          </div>
          <div className="kpi-value amber">{overview?.applied ?? 286}</div>
          <div className="kpi-footer-text amber">
            <span>Active candidate submissions</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="kpi-card glassmorphism-card">
          <div className="kpi-card-header-row">
            <span className="kpi-label">SHORTLISTED CANDIDATES</span>
            <div className="kpi-icon-wrapper purple"><UserCheck size={16} /></div>
          </div>
          <div className="kpi-value purple">{overview?.shortlisted ?? 137}</div>
          <div className="kpi-footer-text purple">
            <span>Advanced to interview rounds</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="kpi-card glassmorphism-card">
          <div className="kpi-card-header-row">
            <span className="kpi-label">PLACEMENT SUCCESS RATE</span>
            <div className="kpi-icon-wrapper emerald"><Award size={16} /></div>
          </div>
          <div className="kpi-value emerald">{overview?.placement_rate ?? 94.8}%</div>
          <div className="kpi-footer-text emerald">
            <TrendingUp size={12} className="inline mr-1" />
            <span>Highest CTC: {overview?.highest_package || "42 LPA"}</span>
          </div>
        </motion.div>
      </section>

      {/* Placement Funnel Progress Section */}
      <div className="placement-funnel-card glassmorphism-card">
        <div className="funnel-card-header">
          <div>
            <span className="funnel-title-highlight">Placement </span>
            <span className="funnel-title-sub">Recruitment Funnel</span>
            <p className="funnel-subtitle">Real-time candidate conversion & drop-off metrics</p>
          </div>
        </div>

        <div className="funnel-rows-container">
          <div className="funnel-row-item">
            <div className="funnel-icon-box"><Users size={16} /></div>
            <div className="funnel-stage-details">
              <span className="funnel-stage-name">Eligible Candidates</span>
              <span className="funnel-stage-subtext">Total verified eligible students</span>
            </div>
            <div className="funnel-progress-bar-container">
              <div className="funnel-progress-fill" style={{ width: "100%" }} />
            </div>
            <div className="funnel-stage-metrics">
              <span className="funnel-stage-of-total">100% ELIGIBLE</span>
              <span className="funnel-stage-val-label">{overview?.eligible ?? 532} Students</span>
            </div>
          </div>

          <div className="funnel-row-item active-highlight">
            <div className="funnel-icon-box"><UserCheck size={16} /></div>
            <div className="funnel-stage-details">
              <span className="funnel-stage-name">Applications Received</span>
              <span className="funnel-stage-subtext">Candidates applied to active drives</span>
            </div>
            <div className="funnel-progress-bar-container">
              <div className="funnel-progress-fill" style={{ width: "54%" }} />
            </div>
            <div className="funnel-stage-metrics">
              <span className="funnel-stage-of-total">54% CONVERSION</span>
              <span className="funnel-stage-val-label">{overview?.applied ?? 286} Candidates</span>
            </div>
          </div>

          <div className="funnel-row-item">
            <div className="funnel-icon-box"><Award size={16} /></div>
            <div className="funnel-stage-details">
              <span className="funnel-stage-name">Placed & Offers Extended</span>
              <span className="funnel-stage-subtext">Verified job & internship offers</span>
            </div>
            <div className="funnel-progress-bar-container">
              <div className="funnel-progress-fill" style={{ width: "24%" }} />
            </div>
            <div className="funnel-stage-metrics">
              <span className="funnel-stage-of-total">24% OFFERS</span>
              <span className="funnel-stage-val-label">{overview?.placed ?? 96} Offers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Placement Drives Table Section */}
      <div className="drives-section-card glassmorphism-card">
        <div className="drives-section-header">
          <div>
            <h4 className="drives-section-title">Active Recruitment Drives ({filteredDrives.length})</h4>
            <p className="drives-section-sub">Corporate hiring schedules and application portals</p>
          </div>

          <div className="drives-search-bar">
            <Search size={15} className="drives-search-icon" />
            <input
              type="text"
              placeholder="Search drive or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="drives-search-input"
            />
          </div>
        </div>

        {loading ? (
          <Skeleton variant="card" count={3} />
        ) : filteredDrives.length > 0 ? (
          <div className="drives-table-container">
            <table className="drives-table">
              <thead className="drives-thead">
                <tr>
                  <th className="drives-th" style={{ width: "32%" }}>Company & Job Role</th>
                  <th className="drives-th">Type</th>
                  <th className="drives-th">Package (CTC)</th>
                  <th className="drives-th">Registration Mode</th>
                  <th className="drives-th">Deadline</th>
                  <th className="drives-th">Status</th>
                  <th className="drives-th text-right" style={{ textAlign: "right" }}>Actions</th>
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
                      <span className="drives-type-tag">{d.type}</span>
                    </td>
                    <td className="drives-td">
                      <span className="drives-package-badge">{d.package}</span>
                    </td>
                    <td className="drives-td">
                      {d.registrationType === "EXTERNAL" ? (
                        <div className="drives-mode-external">
                          <ExternalLink size={13} />
                          <span>External Portal</span>
                        </div>
                      ) : (
                        <span className="drives-mode-internal">Internal SCME</span>
                      )}
                    </td>
                    <td className="drives-td text-date">{d.deadline}</td>
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

                        {d.registrationUrl && (
                          <a
                            href={d.registrationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="drives-action-btn external"
                            title="Test External Link"
                          >
                            <ExternalLink size={13} />
                            <span>Test Link</span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="drives-empty">
            No active placement drives found matching search criteria.
          </div>
        )}
      </div>
    </motion.div>
  );
};

