import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Search,
  LayoutDashboard,
  Clock,
  Calendar,
  BookOpen,
  Award,
  GraduationCap,
  QrCode,
  TrendingUp,
  FileSpreadsheet,
  Activity,
  Sparkles,
  Briefcase,
  MessageSquare,
  Bell,
  User,
  MapPin,
  FolderInput,
  Cpu,
  Sun,
  Moon,
  LogOut,
  CornerDownLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CommandPalette.css';

export const CommandPalette = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items based on role
  const items = useMemo(() => {
    if (!user) return [];

    const role = user.role;
    const baseItems = [];

    // --- Student Items ---
    if (role === 'student') {
      baseItems.push(
        { id: 'nav-dash', category: 'Navigation', label: 'Dashboard', desc: 'Overview & Today’s classes', path: '/dashboard', icon: LayoutDashboard },
        { id: 'nav-att', category: 'Navigation', label: 'Attendance Analytics', desc: 'Subject-wise percentage & logs', path: '/attendance', icon: Clock },
        { id: 'nav-tt', category: 'Navigation', label: 'Academic Timetable', desc: 'Weekly schedule & countdown', path: '/timetable', icon: Calendar },
        { id: 'nav-ass', category: 'Navigation', label: 'Assignments & Coursework', desc: 'Submissions & deadlines', path: '/assignments', icon: BookOpen },
        { id: 'nav-marks', category: 'Navigation', label: 'Internal Marks (CAT 1-3)', desc: 'Continuous assessments & breakdown', path: '/internal-marks', icon: Award },
        { id: 'nav-results', category: 'Navigation', label: 'Semester Results & GPA', desc: 'Grade sheets, SGPA & CGPA', path: '/results', icon: GraduationCap },
        { id: 'nav-gp', category: 'Navigation', label: 'Digital Gate Pass', desc: 'Request leave, pass QR verification', path: '/gate-pass', icon: QrCode },
        { id: 'nav-sgpa', category: 'Navigation', label: 'SGPA Early-Warning Predictor', desc: 'AI forecast & risk intervention', path: '/sgpa-predictor', icon: TrendingUp },
        { id: 'nav-notes', category: 'Navigation', label: 'Study Materials & Notes', desc: 'Lecture PDFs, slides & documents', path: '/study-materials', icon: FileSpreadsheet },
        { id: 'nav-pulse', category: 'Navigation', label: 'Campus Pulse 3D Digital Twin', desc: 'Live crowd density & WebGL twin', path: '/campus-pulse', icon: Activity },
        { id: 'nav-ai', category: 'Navigation', label: 'AI Intelligence Copilot', desc: 'Adaptive study roadmap & quiz solver', path: '/ai-assistant', icon: Sparkles },
        { id: 'nav-events', category: 'Navigation', label: 'Campus Events & Workshops', desc: 'Browse & register for events', path: '/events', icon: Award },
        { id: 'nav-placements', category: 'Navigation', label: 'Placements & Career Drives', desc: 'Recruitment drives & applications', path: '/placements', icon: Briefcase },
        { id: 'nav-forum', category: 'Navigation', label: 'Peer Discussion Forum', desc: 'Community queries & course threads', path: '/forum', icon: MessageSquare },
        { id: 'nav-notif', category: 'Navigation', label: 'Notifications & Noticeboard', desc: 'Campus broadcasts & alerts', path: '/notifications', icon: Bell },
        { id: 'nav-profile', category: 'Navigation', label: 'Student Profile & Badges', desc: 'Academic credentials & settings', path: '/profile', icon: User }
      );
    }

    // --- Faculty Items ---
    if (role === 'faculty') {
      baseItems.push(
        { id: 'fac-dash', category: 'Navigation', label: 'Faculty Console', desc: 'Workload & lecture schedule', path: '/faculty', icon: LayoutDashboard },
        { id: 'fac-tt', category: 'Navigation', label: 'Teaching Schedule', desc: 'Department timetable', path: '/timetable', icon: Calendar },
        { id: 'fac-att', category: 'Navigation', label: 'Mark Class Attendance', desc: 'Daily attendance roster', path: '/attendance', icon: Clock },
        { id: 'fac-ass', category: 'Navigation', label: 'Coursework Assignments', desc: 'Publish & evaluate submissions', path: '/assignments', icon: BookOpen },
        { id: 'fac-loc', category: 'Navigation', label: 'Faculty Locator & Status', desc: 'Availability & cabin allocation', path: '/faculty-locator', icon: MapPin },
        { id: 'fac-pulse', category: 'Navigation', label: 'Campus Pulse 3D Twin', desc: 'Facilities & density monitoring', path: '/campus-pulse', icon: Activity },
        { id: 'fac-ai', category: 'Navigation', label: 'AI Intelligence Hub', desc: 'Question bank & analytics', path: '/ai-assistant', icon: Sparkles },
        { id: 'fac-events', category: 'Navigation', label: 'Campus Events', desc: 'Academic seminars & workshops', path: '/events', icon: Award },
        { id: 'fac-forum', category: 'Navigation', label: 'Discussion Forum', desc: 'Student threads & pinned posts', path: '/forum', icon: MessageSquare }
      );
    }

    // --- Admin Items ---
    if (role === 'admin') {
      baseItems.push(
        { id: 'adm-dash', category: 'Navigation', label: 'Admin Command Center', desc: 'Campus metrics & system health', path: '/admin', icon: LayoutDashboard },
        { id: 'adm-core', category: 'Navigation', label: 'Core Master Hub', desc: '8 modules: depts, rooms, subjects', path: '/admin/core-hub', icon: Cpu },
        { id: 'adm-import', category: 'Navigation', label: 'Data Import Center', desc: 'Bulk CSV/Excel ingestion', path: '/admin/data-import', icon: FolderInput },
        { id: 'adm-tt-gen', category: 'Navigation', label: 'AI Timetable Generator', desc: 'Constraint satisfaction solver', path: '/admin/timetable-generator', icon: Calendar },
        { id: 'adm-gp', category: 'Navigation', label: 'Gate Pass Governance', desc: 'Policy rules & audit logs', path: '/gate-pass-admin', icon: QrCode },
        { id: 'adm-pulse', category: 'Navigation', label: 'Campus Pulse 3D Digital Twin', desc: 'Real-time spatial intelligence', path: '/campus-pulse', icon: Activity },
        { id: 'adm-placements', category: 'Navigation', label: 'Placements Center', desc: 'Recruiting companies & drives', path: '/placements', icon: Briefcase }
      );
    }

    // --- HOD Items ---
    if (role === 'hod') {
      baseItems.push(
        { id: 'hod-dash', category: 'Navigation', label: 'Department Console', desc: 'Leave & OD workflow reviews', path: '/hod', icon: LayoutDashboard },
        { id: 'hod-loc', category: 'Navigation', label: 'Faculty Locator', desc: 'Staff availability & status', path: '/faculty-locator', icon: MapPin },
        { id: 'hod-pulse', category: 'Navigation', label: 'Campus Pulse 3D', desc: 'Department block density', path: '/campus-pulse', icon: Activity }
      );
    }

    // --- Security Items ---
    if (role === 'security') {
      baseItems.push(
        { id: 'sec-gate', category: 'Navigation', label: 'Gate Security Mobility Station', desc: 'Scan & verify student outpasses', path: '/gate-security', icon: QrCode },
        { id: 'sec-pulse', category: 'Navigation', label: 'Campus Pulse 3D', desc: 'Perimeter & spatial monitoring', path: '/campus-pulse', icon: Activity }
      );
    }

    // --- Guardian Items ---
    if (role === 'guardian') {
      baseItems.push(
        { id: 'grd-gate', category: 'Navigation', label: 'Ward Leave Authorization', desc: 'OTP verification for gate pass', path: '/guardian-gate-pass', icon: QrCode }
      );
    }

    // --- Universal Quick Actions ---
    const quickActions = [
      {
        id: 'act-theme',
        category: 'Quick Actions',
        label: resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        desc: 'Toggle application color scheme',
        action: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
        icon: resolvedTheme === 'dark' ? Sun : Moon,
      },
      {
        id: 'act-ai-copilot',
        category: 'Quick Actions',
        label: 'Ask AI Copilot',
        desc: 'Open conversational campus assistant',
        path: '/ai-assistant',
        icon: Sparkles,
      },
      {
        id: 'act-logout',
        category: 'Quick Actions',
        label: 'Log Out of Smart Campus',
        desc: 'Terminate current authentication session',
        action: () => {
          logout();
          navigate('/login');
        },
        icon: LogOut,
        isDanger: true,
      }
    ];

    return [...baseItems, ...quickActions];
  }, [user, resolvedTheme, setTheme, logout, navigate]);

  // Filter items according to search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        (item.desc && item.desc.toLowerCase().includes(lower)) ||
        (item.category && item.category.toLowerCase().includes(lower))
    );
  }, [items, query]);

  // Handle execution of selected item
  const handleSelect = (item) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // Keyboard navigation inside list
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="cmd-palette-backdrop" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -20 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="cmd-palette-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Search Input */}
          <div className="cmd-palette-search-box">
            <Search size={18} className="cmd-palette-search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search features, navigation, AI tools, or type a command..."
              className="cmd-palette-input"
            />
            {query && (
              <button onClick={() => setQuery('')} className="cmd-palette-clear-btn">
                <X size={14} />
              </button>
            )}
            <kbd className="cmd-palette-esc-badge">ESC</kbd>
          </div>

          {/* Results List */}
          <div className="cmd-palette-list custom-scrollbar" ref={listRef}>
            {filteredItems.length === 0 ? (
              <div className="cmd-palette-empty">
                <p className="cmd-palette-empty-title">No matching campus commands</p>
                <p className="cmd-palette-empty-desc">Try searching for "Attendance", "Gate Pass", "SGPA", or "Timetable"</p>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`cmd-palette-item ${isSelected ? 'cmd-palette-item-selected' : ''} ${
                      item.isDanger ? 'cmd-palette-item-danger' : ''
                    }`}
                  >
                    <div className="cmd-palette-item-icon-wrapper">
                      <Icon size={16} />
                    </div>
                    <div className="cmd-palette-item-info">
                      <div className="cmd-palette-item-top">
                        <span className="cmd-palette-item-label">{item.label}</span>
                        {item.category && (
                          <span className="cmd-palette-item-cat">{item.category}</span>
                        )}
                      </div>
                      {item.desc && (
                        <span className="cmd-palette-item-desc">{item.desc}</span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="cmd-palette-item-enter">
                        <span>Select</span>
                        <CornerDownLeft size={12} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="cmd-palette-footer">
            <div className="cmd-palette-footer-left">
              <span>Navigate <kbd>↑</kbd> <kbd>↓</kbd></span>
              <span>Open <kbd>↵</kbd></span>
              <span>Dismiss <kbd>esc</kbd></span>
            </div>
            <div className="cmd-palette-footer-right">
              <span className="cmd-palette-badge-tag">Smart Campus AI</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
