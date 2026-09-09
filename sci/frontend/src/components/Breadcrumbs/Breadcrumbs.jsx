import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronsUpDown, Hexagon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Breadcrumbs.css';

const ROUTE_LABELS = {
  dashboard: 'Student Dashboard',
  attendance: 'Attendance Analytics',
  timetable: 'Timetable',
  assignments: 'Assignments',
  'study-materials': 'Study Materials',
  'internal-marks': 'Internal Marks',
  results: 'Semester Results',
  'gate-pass': 'Digital Gate Pass',
  'gate-pass-admin': 'Gate Pass Administration',
  'gate-security': 'Gate Security Station',
  'guardian-gate-pass': 'Guardian Verification',
  workflows: 'Student Workflows',
  'sgpa-predictor': 'SGPA Early Warning',
  'academic-calendar': 'Academic Calendar',
  events: 'Campus Events',
  placements: 'Placements & Careers',
  companies: 'Company Profiles',
  notifications: 'Announcements & Alerts',
  'ai-assistant': 'AI Intelligence Copilot',
  profile: 'Profile Console',
  'faculty-locator': 'Faculty Locator',
  faculty: 'Faculty Console',
  hod: 'HOD Console',
  'campus-pulse': 'Campus Pulse 3D',
  admin: 'Admin Console',
  'data-import': 'Data Import Center',
  'core-hub': 'Core Infrastructure Hub',
  'timetable-generator': 'Timetable Generator',
  forum: 'Peer Discussion Forum',
};

const DEMO_ACCOUNTS = [
  {
    role: 'student',
    name: 'Rahul Sharma',
    email: 'student1@campus.com',
    roleLabel: 'Student',
    homeRoute: '/dashboard',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'faculty',
    name: 'Dr. Amit Kumar',
    email: 'faculty1@campus.com',
    roleLabel: 'Faculty',
    homeRoute: '/faculty',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'hod',
    name: 'Dr. Rajesh HOD',
    email: 'hod1@campus.com',
    roleLabel: 'Dept Head',
    homeRoute: '/hod',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'admin',
    name: 'Admin System',
    email: 'admin@campus.com',
    roleLabel: 'Administrator',
    homeRoute: '/admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'security',
    name: 'Gate Security',
    email: 'security1@campus.com',
    roleLabel: 'Campus Security',
    homeRoute: '/gate-security',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'guardian',
    name: 'Parent Guardian',
    email: 'guardian1@campus.com',
    roleLabel: 'Guardian',
    homeRoute: '/guardian-gate-pass',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
  },
];

export const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsSwitcherOpen(false);
      }
    };
    if (isSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSwitcherOpen]);

  if (!user || location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  const pathnames = location.pathname.split('/').filter(Boolean);

  const getHomeRoute = () => {
    switch (user?.role) {
      case 'faculty':
        return '/faculty';
      case 'admin':
        return '/admin';
      case 'hod':
        return '/hod';
      case 'security':
        return '/gate-security';
      case 'guardian':
        return '/guardian-gate-pass';
      default:
        return '/dashboard';
    }
  };

  const handleSwitchAccount = async (account) => {
    if (user?.email === account.email) {
      setIsSwitcherOpen(false);
      return;
    }
    setIsSwitching(true);
    try {
      await login({ email: account.email, password: 'password123' });
      setIsSwitcherOpen(false);
      navigate(account.homeRoute);
    } catch {
      // Error handled by AuthContext toast
    } finally {
      setIsSwitching(false);
    }
  };

  const activeAccount = DEMO_ACCOUNTS.find((a) => a.email === user?.email) || {
    name: user.name || 'User',
    email: user.email || '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  };

  return (
    <nav aria-label="Breadcrumb" className="u-breadcrumbs-bar">
      <div className="u-breadcrumbs-inner">
        {/* 1. Root App Badge (Untitled UI style) */}
        <Link to={getHomeRoute()} className="u-breadcrumbs-root" title="SCME-AWN Smart Campus">
          <div className="u-breadcrumbs-root-icon">
            <Hexagon size={13} className="text-red-500 fill-red-500/20" />
          </div>
          <span className="u-breadcrumbs-root-title">SCME-AWN</span>
        </Link>

        {/* Separator */}
        <ChevronRight size={13} className="u-breadcrumbs-chevron" aria-hidden="true" />

        {/* 2. Interactive User / Workspace Switcher Pill with Popover */}
        <div className="u-breadcrumbs-switcher-container" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className={`u-breadcrumbs-user-pill ${isSwitcherOpen ? 'active' : ''}`}
            aria-expanded={isSwitcherOpen}
            aria-haspopup="true"
            title="Switch user account"
          >
            <img
              src={activeAccount.avatar}
              alt={activeAccount.name}
              className="u-breadcrumbs-user-avatar"
            />
            <span className="u-breadcrumbs-user-name">{user.name || activeAccount.name}</span>
            <ChevronsUpDown size={12} className="u-breadcrumbs-user-caret" />
          </button>

          {/* Untitled UI Account Switcher Popover */}
          {isSwitcherOpen && (
            <div className="u-switcher-popover animate-fade-in" role="dialog">
              <div className="u-switcher-header">
                <span className="u-switcher-header-title">Switch Active Role</span>
                <span className="u-switcher-header-tag">Instant RBAC</span>
              </div>

              <div className="u-switcher-list custom-scrollbar">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isActive = user?.email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={isSwitching}
                      onClick={() => handleSwitchAccount(acc)}
                      className={`u-switcher-item ${isActive ? 'active' : ''}`}
                    >
                      <div className="u-switcher-item-left">
                        <img src={acc.avatar} alt={acc.name} className="u-switcher-item-avatar" />
                        <div className="u-switcher-item-details">
                          <div className="u-switcher-item-name-row">
                            <span className="u-switcher-item-name">{acc.name}</span>
                            <span className={`u-switcher-role-badge ${acc.role}`}>
                              {acc.roleLabel}
                            </span>
                          </div>
                          <span className="u-switcher-item-email">{acc.email}</span>
                        </div>
                      </div>

                      {/* Radio indicator circle */}
                      <div className={`u-switcher-radio ${isActive ? 'selected' : ''}`}>
                        {isActive && <div className="u-switcher-radio-dot" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Route Hierarchy Path */}
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label =
            ROUTE_LABELS[value] || value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

          return (
            <React.Fragment key={to}>
              <ChevronRight size={13} className="u-breadcrumbs-chevron" aria-hidden="true" />
              {isLast ? (
                <span className="u-breadcrumbs-current" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link to={to} className="u-breadcrumbs-segment">
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
