import React, { useState, useEffect, useMemo } from "react";
import api from "../../../api/axios";
import { Skeleton, Modal, Button } from "../../../components/ui";
import {
  Briefcase,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Building,
  Search,
  Sparkles,
  Award,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import "./StudentPlacementsView.css";

export const StudentPlacementsView = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings"); // 'listings' | 'applications'

  // Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Apply modal
  const [applyingJob, setApplyingJob] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const fetchPlacementData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.get("/placements"),
        api.get("/placements/my-applications"),
      ]);
      setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
    } catch (err) {
      toast.error("Failed to load placement opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacementData();
  }, []);

  const handleExternalRegisterClick = async (job) => {
    if (!job.registrationUrl) return;

    try {
      await api.post(`/placements/${job.id}/click-link`);
    } catch {
      // background telemetry
    }

    const url = job.registrationUrl.startsWith("http")
      ? job.registrationUrl
      : `https://${job.registrationUrl}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Opening external registration portal for ${job.companyName || job.company}...`);
  };

  const handleConfirmApply = async () => {
    if (!applyingJob) return;

    setIsApplying(true);
    try {
      const res = await api.post(`/placements/${applyingJob.id}/apply`, {});
      toast.success(
        `Application submitted! AI Resume Score: ${res.data.resume_score || 75}/100`,
        { duration: 5000 }
      );
      setApplyingJob(null);
      // Refresh to update isApplied and applications list
      fetchPlacementData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit application");
    } finally {
      setIsApplying(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const title = job.title?.toLowerCase() || "";
      const company = (job.companyName || job.company || "").toLowerCase();
      const matchSearch = title.includes(searchTerm.toLowerCase()) || company.includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "all" || job.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [jobs, searchTerm, typeFilter]);

  return (
    <div className="student-placements-container">
      {/* Apply Confirmation Modal */}
      {applyingJob && (
        <Modal
          isOpen={!!applyingJob}
          onClose={() => setApplyingJob(null)}
          title={`Apply for ${applyingJob.title}`}
        >
          <div className="p-space-y-4">
            <div className="student-app-review-box" style={{ background: "#16171b" }}>
              <div className="flex items-center gap-3">
                <div className="student-logo-box">
                  <Building size={20} className="text-slate-400" />
                </div>
                <div>
                  <h4 className="student-app-title">{applyingJob.title}</h4>
                  <div className="student-app-sub">
                    {applyingJob.companyName || applyingJob.company} • {applyingJob.package}
                  </div>
                </div>
              </div>
            </div>

            <p className="student-description" style={{ fontSize: 13 }}>
              Your verified academic profile and digital resume will be submitted to the corporate recruitment team for review and automated skill benchmarking.
            </p>

            <div className="student-eligibility-box">
              <span className="eligibility-label">Eligibility Criteria:</span> {applyingJob.eligibility}
            </div>

            <div className="modal-actions-row" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setApplyingJob(null)}
                disabled={isApplying}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmApply}
                loading={isApplying}
              >
                Confirm & Submit Application
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="student-placements-header">
        <h2 className="student-placements-title">
          <Briefcase size={24} className="text-red-500" />
          Campus Placements & Career Portal
        </h2>
        <p className="student-placements-subtitle">
          Explore verified corporate recruitment drives, apply with your student profile, and monitor application status
        </p>
      </div>

      {loading ? (
        <Skeleton variant="card" count={2} />
      ) : (
        <div className="student-placements-body">
          {/* Tab Navigation Bar */}
          <div className="student-tab-bar">
            <button
              onClick={() => setActiveTab("listings")}
              className={`student-tab-btn ${activeTab === "listings" ? "active" : ""}`}
            >
              <Briefcase size={15} />
              <span>Available Opportunities</span>
              <span className="student-tab-count">{jobs.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`student-tab-btn ${activeTab === "applications" ? "active" : ""}`}
            >
              <FileText size={15} />
              <span>My Applications</span>
              <span className="student-tab-count">{applications.length}</span>
            </button>
          </div>

          {activeTab === "listings" ? (
            <>
              {/* Search & Filter Bar */}
              <div className="student-filter-row">
                <div className="student-search-bar">
                  <Search size={14} className="student-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by role or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="student-search-input"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="student-filter-select"
                >
                  <option value="all">All Opportunities</option>
                  <option value="fulltime">Full-Time</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="student-jobs-grid">
                  {filteredJobs.map((job) => {
                    const isClosed = job.status === "closed";
                    const hasExternalLink = job.registrationType === "EXTERNAL" && job.registrationUrl;

                    return (
                      <div key={job.id} className="student-job-card">
                        {/* Card Top */}
                        <div className="student-card-top">
                          <div className="student-card-header-row">
                            <div className="student-company-info">
                              <div className="student-logo-box">
                                {job.companyLogo && !job.companyLogo.includes("placeholder") ? (
                                  <img src={job.companyLogo} alt={job.companyName} className="student-logo-img" />
                                ) : (
                                  <Building size={20} className="text-slate-400" />
                                )}
                              </div>
                              <div>
                                <h3 className="student-role-title">{job.title}</h3>
                                <span className="student-company-name">
                                  {job.companyName || job.company}
                                </span>
                              </div>
                            </div>

                            <span className={`student-status-badge ${isClosed ? "closed" : "open"}`}>
                              {isClosed ? "Closed" : "● Active"}
                            </span>
                          </div>

                          {/* Badges Row */}
                          <div className="student-badges-row">
                            <span className="student-ctc-pill">{job.package}</span>
                            <span className="student-type-pill">
                              {job.type === "internship" ? "Internship" : "Full-Time"}
                            </span>
                          </div>

                          <p className="student-description">
                            {job.description || "No specific job description provided."}
                          </p>

                          <div className="student-eligibility-box">
                            <span className="eligibility-label">Eligibility:</span> {job.eligibility}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="student-card-footer">
                          <span className="student-deadline-text">
                            <Calendar size={12} className="inline mr-1" />
                            Deadline: {job.deadline}
                          </span>

                          {isClosed ? (
                            <button disabled className="student-btn-disabled">
                              Registration Closed
                            </button>
                          ) : hasExternalLink ? (
                            <button
                              onClick={() => handleExternalRegisterClick(job)}
                              className="student-btn-primary"
                            >
                              <span>Apply on External Portal</span>
                              <ExternalLink size={13} />
                            </button>
                          ) : job.isApplied ? (
                            <span className="student-btn-applied">
                              <CheckCircle2 size={13} />
                              <span>Applied</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setApplyingJob(job)}
                              className="student-btn-primary"
                            >
                              <span>Apply Now</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="student-empty-state">
                  <Briefcase size={32} className="text-slate-500" />
                  <p>No active recruitment drives match your search criteria.</p>
                </div>
              )}
            </>
          ) : (
            <div className="student-applications-list">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <div key={app.id} className="student-app-card">
                    <div className="student-app-header">
                      <div>
                        <h4 className="student-app-title">{app.title}</h4>
                        <div className="student-app-sub">
                          {app.company || app.companyName} • Package: {app.package} • Applied on {app.appliedAt?.slice(0, 10)}
                        </div>
                      </div>

                      <span className={`student-app-status-tag ${app.status}`}>
                        {app.status === "selected" ? "Selected / Offered" : app.status}
                      </span>
                    </div>

                    {app.resumeScore && (
                      <div className="student-app-review-box">
                        <div className="student-app-review-header">
                          <span>AI Resume Analysis</span>
                          <span className="text-amber-400 font-bold">{app.resumeScore}/100</span>
                        </div>
                        <p style={{ margin: 0 }}>
                          {app.resumeReview || "Resume evaluated against drive requirements."}
                        </p>
                      </div>
                    )}

                    {(app.interviewStatus || app.offerStatus) && (
                      <div className="student-app-meta-row">
                        {app.interviewStatus && (
                          <span>Interview Status: <strong className="text-slate-200">{app.interviewStatus}</strong></span>
                        )}
                        {app.offerStatus && (
                          <span>Offer Status: <strong className="text-slate-200">{app.offerStatus}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="student-empty-state">
                  <FileText size={32} className="text-slate-500" />
                  <p>You haven't submitted any placement applications yet.</p>
                  <button
                    onClick={() => setActiveTab("listings")}
                    className="student-btn-primary"
                    style={{ marginTop: 8 }}
                  >
                    Browse Available Drives
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
