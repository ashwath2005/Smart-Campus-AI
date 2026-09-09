import "./Profile.css";
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card, Button, Input, Avatar } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || "");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name, department, rollNumber });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="profile-container"
    >
      {/* Title Header */}
      <div className="profile-header">
        <h2 className="profile-title">Profile Console</h2>
        <p className="profile-subtitle">
          Manage your personal details, credentials, academic achievements, and system preferences.
        </p>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column - Avatar & Stats */}
        <div className="profile-left-col">
          {/* Avatar details */}
          <Card hoverGlow={false} className="avatar-card">
            <Avatar name={user.name} size="xl" className="avatar-elem" />
            <h3 className="avatar-name">{user.name}</h3>
            <p className="avatar-role">{user.role}</p>
            
            <div className="metadata-list">
              <div className="metadata-row">
                <span className="meta-lbl">Email</span>
                <span className="meta-val">{user.email}</span>
              </div>
              {user.rollNumber && (
                <div className="metadata-row">
                  <span className="meta-lbl">Roll No</span>
                  <span className="meta-val">{user.rollNumber}</span>
                </div>
              )}
              {user.department && (
                <div className="metadata-row">
                  <span className="meta-lbl">Dept</span>
                  <span className="meta-val">{user.department}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Academic Badges & Achievements */}
          <Card hoverGlow={false} className="achievements-card">
            <h3 className="card-section-title">Badges & Milestones</h3>
            <div className="badges-flex-container">
              <span className="achievement-badge badge-blue">
                🏅 Dean's List
              </span>
              <span className="achievement-badge badge-purple">
                🚀 Tech Innovator
              </span>
              <span className="achievement-badge badge-orange">
                ⚡ Scholar Elite
              </span>
            </div>
          </Card>

          {/* Verified Documents */}
          <Card hoverGlow={false} className="documents-card">
            <h3 className="card-section-title">Verified Documents</h3>
            <div className="documents-list-box">
              <div className="doc-row">
                <span className="doc-name">Student_ID_Card.pdf</span>
                <span className="doc-status-badge">VERIFIED</span>
              </div>
              <div className="doc-row">
                <span className="doc-name">Academic_Transcript.pdf</span>
                <span className="doc-status-badge">VERIFIED</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Form, Theme & Activity */}
        <div className="profile-right-col">
          {/* Personal Info Edit Form */}
          <Card hoverGlow={false} className="personal-info-card">
            <h3 className="card-section-title">Personal Information</h3>
            <form onSubmit={handleSave} className="personal-info-form">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
              <Input
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={loading}
              />
              {user.role === "student" && (
                <Input
                  label="Roll Number"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  disabled={loading}
                />
              )}
              <div className="form-submit-box">
                <Button type="submit" loading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Theme Preferences */}
          <Card hoverGlow={false} className="profile-theme-card">
            <h3 className="card-section-title">Interface Theme</h3>
            <p className="theme-card-subtitle">
              Customize how CampusOS looks on your device
            </p>
            <div className="theme-toggle-flex-row">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`theme-toggle-btn ${resolvedTheme === "light" ? "active-light" : "inactive-btn"}`}
              >
                ☀️ Light Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`theme-toggle-btn ${resolvedTheme === "dark" ? "active-dark" : "inactive-btn"}`}
              >
                🌙 Dark Mode
              </button>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card hoverGlow={false} className="profile-activity-card">
            <h3 className="card-section-title">Activity History</h3>
            <div className="activity-timeline-box">
              <div className="timeline-item">
                <span className="dot dot-red" />
                <div className="timeline-details">
                  <p className="timeline-title">Profile Information Updated</p>
                  <p className="timeline-desc">Updated personal settings and department mapping</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="dot dot-green" />
                <div className="timeline-details">
                  <p className="timeline-title">Semester Registration Complete</p>
                  <p className="timeline-desc">Academic registration validated by administrator</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
