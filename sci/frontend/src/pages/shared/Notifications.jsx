import "./Notifications.css";
import React, { useState, useMemo, useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { Card, Skeleton } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import {
  Bell,
  Check,
  Search,
  Volume2,
  ChevronDown,
  RotateCcw,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Notifications = () => {
  const { user } = useAuth();
  const location = useLocation();
  const {
    notifications,
    loading: loadingNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const initialTab = location.pathname === "/announcements" ? "notices" : "alerts";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (location.pathname === "/announcements") {
      setActiveTab("notices");
    } else if (location.pathname === "/notifications") {
      setActiveTab("alerts");
    }
  }, [location.pathname]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [readStatusFilter, setReadStatusFilter] = useState("all");
  
  const [announcements, setAnnouncements] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [targetDept, setTargetDept] = useState("all");
  const [isEmergency, setIsEmergency] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const [genRes, emerRes] = await Promise.all([
        api.get("/announcements"),
        api.get("/announcements/emergency")
      ]);
      setAnnouncements(genRes.data);
      setEmergencies(emerRes.data);
    } catch {
      toast.error("Failed to load noticeboard");
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    try {
      await api.post("/announcements", {
        title: annTitle,
        content: annContent,
        target_role: targetRole,
        target_dept: targetDept,
        is_emergency: isEmergency
      });
      toast.success("Announcement posted successfully!");
      setAnnTitle("");
      setAnnContent("");
      setTargetRole("all");
      setTargetDept("all");
      setIsEmergency(false);
      setShowAddForm(false);
      fetchAnnouncements();
    } catch {
      toast.error("Failed to post announcement");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPriority("all");
    setReadStatusFilter("all");
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesPriority =
        selectedPriority === "all" ||
        item.priority.toLowerCase() === selectedPriority.toLowerCase();
      const matchesReadStatus =
        readStatusFilter === "all" ||
        (readStatusFilter === "unread" && !item.is_read) ||
        (readStatusFilter === "read" && item.is_read);
      return matchesSearch && matchesCategory && matchesPriority && matchesReadStatus;
    });
  }, [notifications, searchQuery, selectedCategory, selectedPriority, readStatusFilter]);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "academic", label: "Academic" },
    { value: "assignment", label: "Assignments" },
    { value: "attendance", label: "Attendance" },
    { value: "event", label: "Events" },
    { value: "placement", label: "Placements" },
    { value: "announcement", label: "Announcements" },
    { value: "emergency", label: "Emergency Alerts" }
  ];

  const priorities = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "emergency", label: "Emergency" }
  ];

  const readStatusOptions = [
    { value: "all", label: "All Read Status" },
    { value: "unread", label: "Unread Only" },
    { value: "read", label: "Read Only" }
  ];

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const isFacultyOrAdmin = user?.role === "faculty" || user?.role === "admin";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="notifications-container"
    >
      {/* Header section */}
      <div className="notifications-header">
        <div className="header-title-row">
          <Bell className="notification-bell-icon text-red" />
          <h2 className="notifications-title">Announcements & Alerts</h2>
        </div>
        <p className="notifications-subtitle">
          Stay updated with real-time academic notices, event alerts, and personal inbox notifications.
        </p>
      </div>

      {/* Tabs Pill switcher */}
      <div className="notifications-tabs-navigation">
        <div className="notifications-tabs-wrapper">
          <button
            onClick={() => setActiveTab("alerts")}
            className={`notifications-tab-capsule ${activeTab === "alerts" ? "active" : ""}`}
          >
            <span>Inbox & Alerts</span>
            {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab("notices")}
            className={`notifications-tab-capsule ${activeTab === "notices" ? "active" : ""}`}
          >
            <span>Campus Notice Board</span>
            {emergencies.length > 0 && (
              <span className="tab-badge warning-badge">{emergencies.length}</span>
            )}
          </button>
        </div>

        {activeTab === "alerts" ? (
          unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-mark-all-read">
              <Check size={14} />
              <span>Mark All as Read</span>
            </button>
          )
        ) : (
          isFacultyOrAdmin && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-mark-all-read"
            >
              <Plus size={14} />
              <span>{showAddForm ? "Cancel Notice" : "Post Notice"}</span>
            </button>
          )
        )}
      </div>

      {/* Conditional Content Rendering */}
      <AnimatePresence mode="wait">
        {activeTab === "alerts" ? (
          <motion.div
            key="alerts-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="tab-panel-container"
          >
            {/* Filter and Search Bar Card */}
            <Card hoverGlow={false} className="filters-card-bar">
              <div className="filters-flex-row">
                {/* Search Text Input */}
                <div className="filter-item-input search-box">
                  <span className="filter-input-label">Search Notifications</span>
                  <div className="input-search-field-wrapper">
                    <Search size={14} className="field-search-icon" />
                    <input
                      type="text"
                      placeholder="Search title or content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-field-input-box"
                    />
                  </div>
                </div>

                {/* Category Selector */}
                <div className="filter-item-input">
                  <span className="filter-input-label">Category</span>
                  <div className="select-dropdown-wrapper">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="filter-select-box"
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="select-caret-icon" />
                  </div>
                </div>

                {/* Priority Selector */}
                <div className="filter-item-input">
                  <span className="filter-input-label">Priority</span>
                  <div className="select-dropdown-wrapper">
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="filter-select-box"
                    >
                      {priorities.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="select-caret-icon" />
                  </div>
                </div>

                {/* Read Status Selector */}
                <div className="filter-item-input">
                  <span className="filter-input-label">Status</span>
                  <div className="select-dropdown-wrapper">
                    <select
                      value={readStatusFilter}
                      onChange={(e) => setReadStatusFilter(e.target.value)}
                      className="filter-select-box"
                    >
                      {readStatusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="select-caret-icon" />
                  </div>
                </div>

                {/* Reset Filters button */}
                <button onClick={handleResetFilters} className="btn-reset-filters">
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              </div>
            </Card>

            {/* Alerts Feed */}
            {loadingNotifications ? (
              <Skeleton variant="card" count={3} />
            ) : filteredNotifications.length > 0 ? (
              <div className="alerts-feed-list">
                {filteredNotifications.map((item, idx) => (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card
                      className={`alert-item-card ${!item.is_read ? "unread-alert" : ""}`}
                    >
                      <div className="alert-content-left">
                        <div className="alert-badge-dot" />
                        <div>
                          <h3 className="alert-card-title">{item.title}</h3>
                          <p className="alert-card-message">{item.message}</p>
                          <span className="alert-card-date">
                            {item.created_at ? item.created_at.split("T")[0] : ""}
                          </span>
                        </div>
                      </div>
                      <div className="alert-actions-right">
                        {!item.is_read && (
                          <button
                            onClick={() => markAsRead(item.id)}
                            className="btn-alert-mark-read"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(item.id)}
                          className="btn-alert-delete"
                        >
                          Dismiss
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card hoverGlow={false} className="empty-notifications-card">
                <div className="empty-notifications-icon-wrapper">
                  <svg width="84" height="84" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="42" cy="42" r="32" stroke="#e31b23" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3" />
                    <circle cx="42" cy="42" r="24" stroke="#e31b23" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                    <circle cx="42" cy="42" r="16" fill="rgba(227, 27, 35, 0.08)" />
                    
                    <path d="M42 26C38.6863 26 36 28.6863 36 32V38L33 42V44H51V42L48 38V32C48 28.6863 45.3137 26 42 26Z" fill="#e31b23" />
                    <path d="M39 48C39 49.6569 40.3431 51 42 51C43.6569 51 45 49.6569 45 48" stroke="#e31b23" strokeWidth="2.5" strokeLinecap="round" />
                    
                    <path d="M12 28L14 26L12 24L10 26L12 28Z" fill="#ff3344" opacity="0.6" />
                    <path d="M72 54L73 53L72 52L71 53L72 54Z" fill="#ff3344" opacity="0.6" />
                  </svg>
                </div>
                <h4 className="empty-notif-title">No Notifications Found</h4>
                <p className="empty-notif-subtitle">
                  You're all caught up! Try adjusting your search query, filters, or category selections.
                </p>
                <button onClick={handleResetFilters} className="empty-notif-btn">
                  <span>Clear All Filters</span>
                </button>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="notices-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="tab-panel-container"
          >
            {/* Notice Board contents */}
            {announcements.length > 0 ? (
              <div className="noticeboard-feed">
                {announcements.map((ann, idx) => (
                  <Card key={ann.id || idx} className="noticeboard-item-card">
                    <h4 className="notice-title">{ann.title}</h4>
                    <p className="notice-content">{ann.content}</p>
                    <div className="notice-meta-row">
                      <span>Posted by: {ann.postedBy}</span>
                      <span>{ann.createdAt ? ann.createdAt.split(" ")[0] : ""}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card hoverGlow={false} className="empty-notifications-card">
                <div className="empty-notifications-icon-wrapper">
                  <Volume2 size={36} className="text-red" />
                </div>
                <h4 className="empty-notif-title">Notice board is empty</h4>
                <p className="empty-notif-subtitle">
                  There are currently no active campus circulars or general noticeboard postings.
                </p>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
