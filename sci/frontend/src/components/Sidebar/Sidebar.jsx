import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  Award,
  Briefcase,
  Bell,
  User,
  X,
  MapPin,
  MessageSquare,
  Sun,
  Moon,
  FolderInput,
  Cpu,
  Sparkles,
  QrCode,
  TrendingUp,
  Activity,
  FileText,
  Hexagon,
  Settings,
  Code2,
  HelpCircle,
  LogOut,
  Radio
} from 'lucide-react';
import './Sidebar.css';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [hoveredLink, setHoveredLink] = useState(null);

  if (!user) return null;

  // 1. Role-based Navigation Links with correct operational targets
  const studentLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', path: '/attendance', icon: Clock },
    { label: 'Timetable', path: '/timetable', icon: Calendar },
    { label: 'Assignments', path: '/assignments', icon: BookOpen },
    { label: 'Gate Pass', path: '/gate-pass', icon: QrCode },
    { label: 'Campus Pulse 3D', path: '/campus-pulse', icon: Activity },
    { label: 'SGPA Predictor', path: '/sgpa-predictor', icon: TrendingUp },
    { label: 'Study Materials', path: '/study-materials', icon: FileText },
    { label: 'AI Intelligence', path: '/ai-assistant', icon: Sparkles },
    { label: 'Events', path: '/events', icon: Award },
    { label: 'Placements', path: '/placements', icon: Briefcase },
    { label: 'Peer Forum', path: '/forum', icon: MessageSquare },
  ];

  const facultyLinks = [
    { label: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
    { label: 'Timetable', path: '/timetable', icon: Calendar },
    { label: 'Attendance', path: '/attendance', icon: Clock },
    { label: 'Assignments', path: '/assignments', icon: BookOpen },
    { label: 'Faculty Locator', path: '/faculty-locator', icon: MapPin },
    { label: 'Campus Pulse 3D', path: '/campus-pulse', icon: Activity },
    { label: 'AI Intelligence', path: '/ai-assistant', icon: Sparkles },
    { label: 'Events', path: '/events', icon: Award },
    { label: 'Peer Forum', path: '/forum', icon: MessageSquare },
  ];

  const adminLinks = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Core Hub', path: '/admin/core-hub', icon: Cpu },
    { label: 'Data Import', path: '/admin/data-import', icon: FolderInput },
    { label: 'Timetable Generator', path: '/admin/timetable-generator', icon: Calendar },
    { label: 'Gate Pass Admin', path: '/gate-pass-admin', icon: QrCode },
    { label: 'Campus Pulse 3D', path: '/campus-pulse', icon: Activity },
    { label: 'Placements', path: '/placements', icon: Briefcase },
    { label: 'Peer Forum', path: '/forum', icon: MessageSquare },
  ];

  const hodLinks = [
    { label: 'Dashboard', path: '/hod', icon: LayoutDashboard },
    { label: 'Faculty Locator', path: '/faculty-locator', icon: MapPin },
    { label: 'Campus Pulse 3D', path: '/campus-pulse', icon: Activity },
    { label: 'Gate Pass Approvals', path: '/gate-pass-admin', icon: QrCode },
    { label: 'Peer Forum', path: '/forum', icon: MessageSquare },
  ];

  const securityLinks = [
    { label: 'Gate Scanner', path: '/gate-security', icon: QrCode },
    { label: 'Campus Pulse 3D', path: '/campus-pulse', icon: Activity },
  ];

  const guardianLinks = [
    { label: 'Guardian Authorization', path: '/guardian-gate-pass', icon: QrCode },
    { label: 'Attendance', path: '/attendance', icon: Clock },
  ];

  const roleNavMap = {
    admin: adminLinks,
    faculty: facultyLinks,
    hod: hodLinks,
    security: securityLinks,
    guardian: guardianLinks,
    student: studentLinks,
  };

  const links = roleNavMap[user.role] || studentLinks;

  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="u-sidebar-backdrop"
          aria-hidden="true"
        />
      )}

      {/* Reference UI Left Navigation Sidebar */}
      <aside className={`u-sidebar-floating ${isOpen ? 'open' : ''}`}>
        <div className="u-sidebar-inner">
          {/* 1. Top Circular Brand Emblem Logo using existing project logo */}
          <div className="u-sidebar-top">
            <NavLink
              to="/"
              className="u-sidebar-brand-btn"
              title="Smart Campus AI Management System"
            >
              <div className="project-brand-logo-container">
                <img src="/logo.png" alt="Smart Campus AI" className="project-brand-logo-img" width="36" height="36" />
              </div>
              <img src="/title.png" alt="SCME-AWN" className="project-brand-title-img" />
            </NavLink>

            {/* Mobile close button (only visible on mobile drawer) */}
            {isOpen && (
              <button
                onClick={onClose}
                className="u-sidebar-mobile-close"
                aria-label="Close sidebar"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* 2. Middle Navigation Item Stack (Icon + Label) */}
          <nav className="u-sidebar-nav-stack custom-scrollbar">
            {links.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.path} className="u-sidebar-item-wrap">
                  <NavLink
                    to={item.path}
                    end={item.path === '/admin' || item.path === '/dashboard' || item.path === '/faculty' || item.path === '/hod'}
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      `ref-sidebar-nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon size={17} className="ref-nav-icon" />
                    <span className="ref-nav-label">{item.label}</span>
                  </NavLink>
                </div>
              );
            })}
          </nav>

          {/* 3. Bottom Controls: Help & getting started + Segmented Theme Switcher */}
          <div className="u-sidebar-footer">
            <button
              type="button"
              onClick={() => {
                handleLinkClick();
                navigate('/forum');
              }}
              className="sidebar-help-btn"
              title="Help & getting started"
            >
              <div className="sidebar-help-left">
                <HelpCircle size={17} className="sidebar-help-icon" />
                <span className="sidebar-help-label">Help & getting started</span>
              </div>
              <span className="sidebar-help-badge">8</span>
            </button>

            {/* Segmented Theme Switcher [ Light | Dark ] */}
            <div className="sidebar-theme-segmented" role="radiogroup" aria-label="Theme switcher">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`sidebar-theme-btn ${resolvedTheme === 'light' ? 'active' : ''}`}
                aria-checked={resolvedTheme === 'light'}
                role="radio"
              >
                <Sun size={14} className="sidebar-theme-icon" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`sidebar-theme-btn ${resolvedTheme === 'dark' ? 'active' : ''}`}
                aria-checked={resolvedTheme === 'dark'}
                role="radio"
              >
                <Moon
                  size={14}
                  fill={resolvedTheme === 'dark' ? "currentColor" : "none"}
                  className="sidebar-theme-icon"
                />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};