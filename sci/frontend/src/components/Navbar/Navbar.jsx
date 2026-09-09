import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User as UserIcon, Settings, LogOut, ChevronDown, Search, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { Avatar, Dropdown } from '../ui';
import './Navbar.css';

export const Navbar = ({ isSidebarOpen, onMenuToggle, onOpenCmdPalette }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notification popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  if (!user) return null;

  const dropdownItems = [
    {
      label: 'My Profile',
      onClick: () => navigate('/profile'),
      icon: <UserIcon size={14} />,
    },
    {
      label: 'Settings',
      onClick: () => navigate('/profile'),
      icon: <Settings size={14} />,
    },
    {
      label: 'Log Out',
      onClick: () => {
        logout();
        navigate('/login');
      },
      icon: <LogOut size={14} />,
      danger: true,
    },
  ];

  const recentNotifications = (notifications || []).slice(0, 5);

  return (
    <header className="navbar-header">
      {/* Left side: Mobile menu toggle button */}
      <div className="navbar-left">
        <button
          onClick={onMenuToggle}
          className="navbar-toggle-btn"
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Center/Right Actions - Matching Reference: Search pill, Create button, Bell, Chat, Avatar */}
      <div className="navbar-right">
        {/* Reference Pill Search Container */}
        <div className="ref-search-pill-container" onClick={onOpenCmdPalette}>
          <Search size={15} className="ref-search-icon" />
          <span className="ref-search-placeholder">Search anything...</span>
        </div>

        {/* Reference Dark Pill Create Button */}
        <button
          className="ref-create-btn"
          onClick={() => navigate('/assignments')}
          title="Create task, pass, or submission"
        >
          Create
        </button>

        {/* Circular Icon Button 1: Notifications with Badge Popover */}
        <div className="navbar-notif-wrapper" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="ref-circle-icon-btn"
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="ref-circle-badge" />
            )}
          </button>

          {/* Quick Notifications Popover */}
          {isNotifOpen && (
            <div className="navbar-notif-popover">
              <div className="navbar-notif-header">
                <div className="navbar-notif-title-row">
                  <span className="navbar-notif-title">Recent Alerts</span>
                  {unreadCount > 0 && (
                    <span className="navbar-notif-count-pill">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="navbar-notif-mark-read"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="navbar-notif-list custom-scrollbar">
                {recentNotifications.length === 0 ? (
                  <div className="navbar-notif-empty">
                    <CheckCircle2 size={24} className="text-slate-500" />
                    <p>You're all caught up!</p>
                  </div>
                ) : (
                  recentNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) markAsRead(n.id);
                        setIsNotifOpen(false);
                        navigate('/notifications');
                      }}
                      className={`navbar-notif-item ${!n.is_read ? 'navbar-notif-item-unread' : ''}`}
                    >
                      <div className="navbar-notif-item-content">
                        <div className="navbar-notif-item-title-row">
                          <span className="navbar-notif-item-title">{n.title}</span>
                          {!n.is_read && <span className="navbar-notif-dot" />}
                        </div>
                        <p className="navbar-notif-item-msg">{n.message}</p>
                        <div className="navbar-notif-item-meta">
                          <span>{n.category || 'General'}</span>
                          {n.priority === 'high' || n.priority === 'emergency' ? (
                            <span className="navbar-notif-priority-urgent">High</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="navbar-notif-footer">
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    navigate('/notifications');
                  }}
                  className="navbar-notif-view-all"
                >
                  View all announcements & alerts
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Circular Icon Button 2: Chat / Forum */}
        <button
          className="ref-circle-icon-btn"
          onClick={() => navigate('/forum')}
          title="Peer Discussion Forum"
        >
          <MessageSquare size={17} />
        </button>

        {/* Circular Profile Avatar with Dropdown using user's actual identity */}
        <Dropdown
          align="right"
          trigger={
            <div className="ref-avatar-trigger" title={`${user.name} (${user.role})`}>
              <div className="ref-header-user-avatar">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"}
                  alt={user?.name || "User"}
                  className="ref-header-avatar"
                />
              </div>
            </div>
          }
          items={dropdownItems}
        />
      </div>
    </header>
  );
};

