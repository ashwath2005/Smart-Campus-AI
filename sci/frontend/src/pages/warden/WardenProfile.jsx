import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton } from '../../components/ui';
import {
  Shield,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  Edit2,
  X,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import './WardenProfile.css';

export function WardenProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warden/profile');
      if (res.data) {
        setProfile(res.data);
        setEditPhone(res.data.phone_number || '');
        setEditRoom(res.data.staff_room || '');
      }
    } catch (err) {
      console.error('Failed to load warden profile:', err);
      toast.error(err.response?.data?.detail || 'Failed to load Warden profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      await api.put('/warden/profile', {
        phone_number: editPhone,
        staff_room: editRoom
      });
      toast.success('Warden profile updated successfully!');
      setIsEditOpen(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="warden-profile-container">
        <Skeleton variant="card" count={2} />
      </div>
    );
  }

  const data = profile || {
    name: user?.name || 'Chief Hostel Warden',
    email: user?.email || 'warden@campus.com',
    role: 'warden',
    employee_id: 'WAR001',
    designation: 'Chief Hostel Warden',
    department: 'Hostel Administration',
    staff_room: 'Hostel Office Block A',
    hostel_block: 'Block A & Senior Hostels',
    phone_number: '+91 98765 43222',
    status: 'Active',
    created_at: '2026-09-10',
    assigned_responsibilities: [
      'Student Leave & Outpass Authorization',
      'Hostel Night Curfew & Biometric Checkpoint Oversight',
      'Hostel Room Allocation & Resident Welfare',
      'Emergency Escalation & Parent Grievance Coordination'
    ],
    stats: {
      pending_leaves: 0,
      approved_today: 0,
      rejected_today: 0,
      total_requests: 0,
      pending_gate_passes: 0
    }
  };

  return (
    <div className="warden-profile-container">
      {/* Page Header */}
      <div className="wp-header">
        <div className="wp-title-row">
          <div>
            <h1 className="wp-title">Hostel Warden Profile</h1>
            <p className="wp-subtitle">
              Residential campus governance identity, jurisdiction, and authorization credentials.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="wp-badge-status">
              <span className="wp-status-dot" />
              {data.status || 'Active'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Edit2 size={14} />
              <span>Edit Details</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="wp-grid">
        {/* Left Column: Official Identity Card */}
        <div className="wp-card">
          <div className="wp-identity-header">
            <div className="wp-avatar-wrapper">
              <div className="wp-avatar-circle">
                {data.name?.charAt(0) || 'W'}
              </div>
            </div>
            <h2 className="wp-warden-name">{data.name}</h2>
            <p className="wp-warden-designation">{data.designation}</p>
            <span className="wp-tag-pill">ID: {data.employee_id}</span>
          </div>

          <div className="wp-meta-list">
            <div className="wp-meta-item">
              <span className="wp-meta-label">
                <Mail size={15} />
                <span>Email</span>
              </span>
              <span className="wp-meta-value">{data.email}</span>
            </div>

            <div className="wp-meta-item">
              <span className="wp-meta-label">
                <Phone size={15} />
                <span>Contact</span>
              </span>
              <span className="wp-meta-value">{data.phone_number || 'N/A'}</span>
            </div>

            <div className="wp-meta-item">
              <span className="wp-meta-label">
                <Building size={15} />
                <span>Department</span>
              </span>
              <span className="wp-meta-value">{data.department}</span>
            </div>

            <div className="wp-meta-item">
              <span className="wp-meta-label">
                <MapPin size={15} />
                <span>Office Location</span>
              </span>
              <span className="wp-meta-value">{data.staff_room}</span>
            </div>

            <div className="wp-meta-item">
              <span className="wp-meta-label">
                <Shield size={15} />
                <span>Assigned Hostel</span>
              </span>
              <span className="wp-meta-value">{data.hostel_block}</span>
            </div>

            <div className="wp-meta-item">
              <span className="wp-meta-label">
                <Calendar size={15} />
                <span>Appointed On</span>
              </span>
              <span className="wp-meta-value">
                {data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Governance KPIs & Responsibilities */}
        <div className="wp-main-col">
          {/* Quick Metrics Grid */}
          <div className="wp-stats-grid">
            <div className="wp-stat-card alert">
              <span className="wp-stat-title">Pending Leaves</span>
              <span className="wp-stat-num text-[#F21722]">
                {data.stats?.pending_leaves ?? 0}
              </span>
              <span className="wp-stat-sub">Requires action</span>
            </div>

            <div className="wp-stat-card">
              <span className="wp-stat-title">Approved Today</span>
              <span className="wp-stat-num text-emerald-400">
                {data.stats?.approved_today ?? 0}
              </span>
              <span className="wp-stat-sub">Processed leaves</span>
            </div>

            <div className="wp-stat-card">
              <span className="wp-stat-title">Rejected Today</span>
              <span className="wp-stat-num text-rose-400">
                {data.stats?.rejected_today ?? 0}
              </span>
              <span className="wp-stat-sub">Disciplinary action</span>
            </div>

            <div className="wp-stat-card">
              <span className="wp-stat-title">Total Processed</span>
              <span className="wp-stat-num">
                {data.stats?.total_requests ?? 0}
              </span>
              <span className="wp-stat-sub">Historical requests</span>
            </div>
          </div>

          {/* Action CTA Banner */}
          <div className="wp-cta-banner">
            <div className="wp-cta-text">
              <h4>Leave & Outpass Authorization Console</h4>
              <p>
                Review student applications, verify reasons, enforce curfew rules, and submit binding approvals.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/warden/leaves')}
              className="flex items-center gap-2 font-medium"
            >
              <span>Manage Leave Requests</span>
              <ArrowRight size={16} />
            </Button>
          </div>

          {/* Responsibilities & Authority Card */}
          <div className="wp-card">
            <h3 className="wp-section-title">
              <Shield size={18} className="text-[#F21722]" />
              <span>Assigned Governance Mandate</span>
            </h3>

            <div className="wp-duties-list">
              {(data.assigned_responsibilities || []).map((duty, idx) => (
                <div key={idx} className="wp-duty-item">
                  <CheckCircle2 size={16} className="wp-duty-icon" />
                  <p className="wp-duty-text">{duty}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="wp-modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="wp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wp-modal-header">
              <h3 className="wp-modal-title">Edit Warden Information</h3>
              <button
                type="button"
                className="wp-modal-close"
                onClick={() => setIsEditOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="wp-form-group">
                <label className="wp-label">Official Office / Staff Room</label>
                <input
                  type="text"
                  className="wp-input"
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  placeholder="e.g. Hostel Office Block A"
                  required
                />
              </div>

              <div className="wp-form-group">
                <label className="wp-label">Contact Phone Number</label>
                <input
                  type="text"
                  className="wp-input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43222"
                  required
                />
              </div>

              <div className="wp-modal-actions">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                  disabled={saveLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WardenProfile;
