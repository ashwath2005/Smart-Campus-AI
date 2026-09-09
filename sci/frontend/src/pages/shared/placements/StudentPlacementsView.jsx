import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { Skeleton, Button } from "../../../components/ui";
import {
  Briefcase,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Building
} from "lucide-react";
import toast from "react-hot-toast";
import "./StudentPlacementsView.css";

export const StudentPlacementsView = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings");

  const fetchPlacementData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.get("/placements"),
        api.get("/placements/my-applications")
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
    } catch {
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
      // Background click logging
    }

    window.open(job.registrationUrl, "_blank", "noopener,noreferrer");
    toast.success(`Opening external registration for ${job.companyName}...`);
  };

  return (
    <div className="student-placements-container">
      {/* Header */}
      <div className="student-placements-header">
        <h2 className="student-placements-title">Placements</h2>
        <p className="student-placements-subtitle">
          Explore active recruitment drives, internships, and full-time career opportunities
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
              Active Recruitment Drives ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`student-tab-btn ${activeTab === "applications" ? "active" : ""}`}
            >
              My Applications ({applications.length})
            </button>
          </div>

          {activeTab === "listings" ? (
            jobs.length > 0 ? (
              <div className="student-jobs-grid">
                {jobs.map((job) => {
                  const isClosed = job.status === "closed";
                  const hasExternalLink = job.registrationType === "EXTERNAL" && job.registrationUrl;

                  return (
                    <div key={job.id} className="student-job-card">
                      {/* Card Top */}
                      <div className="student-card-top">
                        <div className="student-card-header-row">
                          <div className="student-company-info">
                            <div className="student-logo-box">
                              <Building size={20} className="text-slate-400" />
                            </div>
                            <div>
                              <h3 className="student-role-title">{job.title}</h3>
                              <span className="student-company-name">{job.companyName}</span>
                            </div>
                          </div>

                          <span className={`student-status-badge ${isClosed ? "closed" : "open"}`}>
                            {isClosed ? "Closed" : "● Active"}
                          </span>
                        </div>

                        {/* Badges Row */}
                        <div className="student-badges-row">
                          <span className="student-ctc-pill">{job.package}</span>
                          <span className="student-type-pill">{job.type}</span>
                        </div>

                        <p className="student-description">
                          {job.description || "No specific details provided."}
                        </p>

                        <div className="student-eligibility-box">
                          <span className="eligibility-label">Eligibility:</span> {job.eligibility}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="student-card-footer">
                        <span className="student-deadline-text">
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
                            <span>Register Now</span>
                            <ExternalLink size={13} />
                          </button>
                        ) : (
                          <button
                            disabled={job.isApplied}
                            onClick={() => toast.success("Internal application submitted!")}
                            className="student-btn-primary"
                          >
                            {job.isApplied ? "Applied" : "Apply Now"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="student-empty-state">
                <p>No active recruitment drives available right now.</p>
              </div>
            )
          ) : (
            <div className="student-applications-list">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <div key={app.id} className="student-app-row">
                    <div>
                      <div className="student-app-title">{app.title}</div>
                      <div className="student-app-sub">{app.company} • Applied on {app.appliedAt}</div>
                    </div>
                    <span className="student-app-status-tag">{app.status}</span>
                  </div>
                ))
              ) : (
                <div className="student-empty-state">
                  <p>You haven't submitted any placement applications yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
