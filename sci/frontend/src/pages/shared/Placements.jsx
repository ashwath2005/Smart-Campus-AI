import "./Placements.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { Card, Skeleton } from "../../components/ui";
import {
  Briefcase,
  Users,
  Building,
  UserCheck,
  MessageSquare,
  TrendingUp,
  Download,
  Calendar,
  ChevronDown,
  FileText,
  Plus
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export const Placements = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings");

  const fetchPlacementData = async () => {
    try {
      const [jobsRes, appsRes, statsRes] = await Promise.all([
        api.get("/placements"),
        api.get("/placements/my-applications"),
        api.get("/placements/statistics")
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error("Failed to load placement data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacementData();
  }, []);

  const handleDownloadReport = () => {
    const reportData = [
      ["Placement Funnel Statistics 2026"],
      ["Metric", "Value", "Percentage"],
      ["Total Students", "532", "100%"],
      ["Companies Visited", "398", "75%"],
      ["Job & Internship Listings", "239", "45%"],
      ["Applications Received", "138", "26%"],
      ["Offers Made", "96", "18%"]
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      reportData.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `placement_report_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Placement report downloaded!");
  };

  const funnelStages = [
    {
      id: "total_students",
      name: "Total Students",
      subtext: "Total eligible students",
      value: 532,
      label: "Placement Rate",
      percentage: 100,
      icon: Users
    },
    {
      id: "companies_visited",
      name: "Companies Visited",
      subtext: "Companies that visited the campus",
      value: 398,
      label: "Companies Visited",
      percentage: 75,
      icon: Building
    },
    {
      id: "job_listings",
      name: "Job & Internship Listings",
      subtext: "Active job and internship opportunities",
      value: 239,
      label: "Active Listings",
      percentage: 45,
      icon: Briefcase,
      isActive: true // Highlighted in the mockup
    },
    {
      id: "applications_received",
      name: "Applications Received",
      subtext: "Applications submitted by students",
      value: 138,
      label: "Applications",
      percentage: 26,
      icon: UserCheck
    },
    {
      id: "offers_made",
      name: "Offers Made",
      subtext: "Offers extended to students",
      value: 96,
      label: "Offers Mode",
      percentage: 18,
      icon: MessageSquare
    }
  ];

  const hiringDomains = [
    { name: "Computer Science", percentage: 45 },
    { name: "IT Services", percentage: 25 },
    { name: "Core Engineering", percentage: 15 },
    { name: "Consulting", percentage: 15 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="placements-container"
    >
      {/* Top Header Card */}
      <div className="placements-header">
        <div className="placements-title-section">
          <h2 className="placements-title">Placements</h2>
        </div>
        <div className="placements-actions">
          {/* Cycle Selector */}
          <div className="placements-select-wrapper">
            <Calendar size={14} className="placements-action-icon" />
            <select className="placements-cycle-select" defaultValue="2026">
              <option value="2026">Placement Cycle 2026</option>
              <option value="2025">Placement Cycle 2025</option>
            </select>
            <ChevronDown size={14} className="placements-select-chevron" />
          </div>

          {/* Download Report */}
          <button onClick={handleDownloadReport} className="placements-btn-report">
            <Download size={14} className="placements-action-icon" />
            <span>Download Report</span>
            <ChevronDown size={14} className="placements-select-chevron" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="placements-loading">
          <Skeleton variant="card" count={2} />
        </div>
      ) : (
        <>
          {/* Placement Funnel Card */}
          <Card hoverGlow={false} className="placement-funnel-card">
            <div className="funnel-card-header">
              <div className="funnel-header-left">
                <span className="funnel-title-highlight">Placement</span>
                <span className="funnel-title-sub">Funnel</span>
                <p className="funnel-subtitle">Overall progress of students</p>
              </div>
              <div className="funnel-header-right">
                {/* Red Growth Line SVG */}
                <svg width="84" height="48" viewBox="0 0 84 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="32" width="6" height="12" rx="1.5" fill="#1b1c21" />
                  <rect x="22" y="24" width="6" height="20" rx="1.5" fill="#1b1c21" />
                  <rect x="34" y="16" width="6" height="28" rx="1.5" fill="#1b1c21" />
                  <rect x="46" y="8" width="6" height="36" rx="1.5" fill="#1b1c21" />
                  <path d="M6 36L22 22L38 26L74 4" stroke="#E31B23" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M74 4H64M74 4V14" stroke="#E31B23" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Funnel Progress Rows */}
            <div className="funnel-rows-container">
              {funnelStages.map((stage) => {
                const Icon = stage.icon;
                return (
                  <div
                    key={stage.id}
                    className={`funnel-row-item ${stage.isActive ? "active-highlight" : ""}`}
                  >
                    {/* Icon Circle */}
                    <div className="funnel-icon-box">
                      <Icon size={16} />
                    </div>

                    {/* Stage Title and Subtext */}
                    <div className="funnel-stage-details">
                      <span className="funnel-stage-name">{stage.name}</span>
                      <span className="funnel-stage-subtext">{stage.subtext}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="funnel-progress-bar-container">
                      <div
                        className="funnel-progress-fill"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>

                    {/* Metrics Labels */}
                    <div className="funnel-stage-metrics">
                      <span className="funnel-stage-of-total">
                        {stage.percentage}% OF TOTAL
                      </span>
                      <span className="funnel-stage-val-label">
                        {stage.value} <span className="funnel-stage-metric-name">{stage.label}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Lower Grid: Jobs & Domains */}
          <div className="placements-lower-grid">
            {/* Left Pane: Job Listings */}
            <Card hoverGlow={false} className="placements-jobs-card">
              {/* Tab Selector */}
              <div className="jobs-tabs-header">
                <button
                  onClick={() => setActiveTab("listings")}
                  className={`jobs-tab-btn ${activeTab === "listings" ? "active" : ""}`}
                >
                  Job & Internship Listings
                </button>
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`jobs-tab-btn ${activeTab === "applications" ? "active" : ""}`}
                >
                  My Applications ({applications.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "listings" ? (
                jobs.length > 0 ? (
                  <div className="jobs-listings-feed">
                    {/* Renders jobs if populated */}
                  </div>
                ) : (
                  <div className="jobs-empty-state">
                    <div className="jobs-empty-icon-box">
                      <Briefcase size={22} />
                    </div>
                    <p className="jobs-empty-title">
                      No active job or internship listings
                    </p>
                    <p className="jobs-empty-subtitle">
                      New opportunities will appear here when posted by companies.
                    </p>
                    <button className="jobs-empty-btn">
                      <ChevronDown size={14} className="rotate-90" />
                      <span>View Past Listings</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="jobs-empty-state">
                  <div className="jobs-empty-icon-box">
                    <FileText size={22} />
                  </div>
                  <p className="jobs-empty-title">You haven't applied to any roles yet</p>
                  <p className="jobs-empty-subtitle">
                    Once you submit applications, your tracking details will appear here.
                  </p>
                </div>
              )}
            </Card>

            {/* Right Pane: Placement Insights */}
            <Card hoverGlow={false} className="placements-insights-card">
              <div className="insights-card-header">
                <div className="insights-title-box">
                  <TrendingUp size={16} className="text-red" />
                  <h3 className="insights-card-title">Placement Insights</h3>
                </div>
              </div>

              <div className="insights-domains-section">
                <div className="domains-header">
                  <span className="domains-title">Top Hiring Domains</span>
                  <Link to="/companies" className="domains-view-all">
                    View all
                  </Link>
                </div>

                <div className="domains-grid">
                  {hiringDomains.map((domain, idx) => (
                    <div key={idx} className="domain-pill-badge">
                      <span className="domain-name">{domain.name}</span>
                      <span className="domain-pct-badge">{domain.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </motion.div>
  );
};
