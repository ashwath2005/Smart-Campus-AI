import "./AcademicCalendar.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, Skeleton, Badge } from "../../components/ui";
import {
  Calendar as CalendarIcon,
  List,
  Clock,
  Plus,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export const AcademicCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState("month");

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  const viewToggles = [
    { id: "month", label: "Month View", icon: CalendarIcon },
    { id: "list", label: "List View", icon: List },
    { id: "upcoming", label: "Upcoming", icon: Clock }
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/students/academic-calendar?month=${selectedMonth}`);
        setEvents(res.data);
      } catch (err) {
        toast.error("Failed to fetch calendar events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [selectedMonth]);

  const getBadgeVariant = (type) => {
    switch (type) {
      case "exam":
        return "danger";
      case "holiday":
        return "success";
      case "deadline":
        return "warning";
      case "academic":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="calendar-container"
    >
      <div>
        <h2 className="calendar-title">Academic Calendar</h2>
        <p className="calendar-subtitle">
          Keep track of holidays, exams and college timelines
        </p>
      </div>

      {/* Filter and View Toggles Row */}
      <div className="calendar-filter-row">
        {/* Month Selector Dropdown */}
        <div className="calendar-month-selector-wrapper">
          <CalendarIcon size={14} className="calendar-month-icon" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="calendar-month-select"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="calendar-month-chevron" />
        </div>

        {/* View Toggles Pill */}
        <div className="calendar-view-toggles">
          {viewToggles.map((toggle) => {
            const Icon = toggle.icon;
            const isActive = viewMode === toggle.id;
            return (
              <button
                key={toggle.id}
                onClick={() => setViewMode(toggle.id)}
                className={`calendar-toggle-btn ${isActive ? "active" : ""}`}
              >
                <Icon size={14} />
                <span>{toggle.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Content Area */}
      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : events.length > 0 ? (
        <div className="calendar-events-list">
          {events.map((event, idx) => (
            <motion.div
              key={event.id || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="calendar-event-card">
                <div className="event-card-left">
                  <div className="event-icon-box">
                    <CalendarIcon size={18} />
                  </div>
                  <div>
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-description">
                      {event.description || "No additional details available."}
                    </p>
                    <div className="event-metadata">
                      <span>Date: {event.date}</span>
                      {event.semester && (
                        <span>• Semester {event.semester}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="event-card-right">
                  <Badge variant={getBadgeVariant(event.type)}>{event.type}</Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="empty-calendar-card">
          <div className="empty-calendar-icon-wrapper">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="14" y="20" width="44" height="38" rx="6" stroke="#4a4c54" strokeWidth="3" />
              <line x1="14" y1="30" x2="58" y2="30" stroke="#4a4c54" strokeWidth="3" />
              <line x1="24" y1="14" x2="24" y2="22" stroke="#4a4c54" strokeWidth="3" strokeLinecap="round" />
              <line x1="36" y1="14" x2="36" y2="22" stroke="#4a4c54" strokeWidth="3" strokeLinecap="round" />
              <line x1="48" y1="14" x2="48" y2="22" stroke="#4a4c54" strokeWidth="3" strokeLinecap="round" />
              
              <circle cx="48" cy="48" r="10" fill="#090a0c" />
              <circle cx="48" cy="48" r="8" stroke="#8e9196" strokeWidth="2.5" />
              <line x1="48" y1="44" x2="48" y2="49" stroke="#8e9196" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="48" cy="52" r="1.25" fill="#8e9196" />
              
              <path d="M6 34L8 32L6 30L4 32L6 34Z" fill="#ff3344" opacity="0.6" />
              <path d="M66 26L67 25L66 24L65 25L66 26Z" fill="#ff3344" opacity="0.6" />
            </svg>
          </div>
          <h4 className="empty-calendar-title">No events scheduled for this month.</h4>
          <p className="empty-calendar-subtitle">Once events are added, they will appear here.</p>
          <button className="empty-calendar-btn">
            <Plus size={16} />
            <span>Add Event</span>
          </button>
        </Card>
      )}
    </motion.div>
  );
};
