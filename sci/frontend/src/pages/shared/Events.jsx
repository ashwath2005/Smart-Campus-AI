import "./Events.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, Skeleton, Badge, Button } from "../../components/ui";
import { Calendar, MapPin, Users, X, Clock, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Add Event Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newVenue, setNewVenue] = useState("Campus Auditorium");
  const [newType, setNewType] = useState("technical");
  const [editEventId, setEditEventId] = useState(null);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/events/");
      setEvents(res.data);
    } catch {
      toast.error("Failed to load events list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (id) => {
    try {
      await api.post(`/events/${id}/register`);
      toast.success("Successfully registered for the event!");
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to register");
    }
  };

  const handleAddClick = () => {
    setNewTitle("");
    setNewDescription("");
    setNewDate("");
    setNewVenue("Campus Auditorium");
    setNewType("technical");
    setEditEventId(null);
    setShowAddModal(true);
  };

  const handleEditClick = (event) => {
    setNewTitle(event.title);
    setNewDescription(event.description || "");
    setNewDate(event.event_date);
    setNewVenue(event.venue || "Campus Auditorium");
    setNewType(event.type || "technical");
    setEditEventId(event.id);
    setShowAddModal(true);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDate) {
      toast.error("Title and Date are required");
      return;
    }
    
    const payload = {
      title: newTitle,
      description: newDescription,
      event_date: newDate,
      venue: newVenue,
      type: newType,
    };

    try {
      if (editEventId) {
        await api.put(`/events/${editEventId}`, payload);
        toast.success("Event updated successfully!");
      } else {
        await api.post("/events/", payload);
        toast.success("Event created successfully!");
      }
      setShowAddModal(false);
      setNewTitle("");
      setNewDescription("");
      setNewDate("");
      setNewVenue("Campus Auditorium");
      setNewType("technical");
      setEditEventId(null);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save event");
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success("Event deleted successfully!");
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete event");
    }
  };

  const parseEventDate = (dateStr) => {
    if (!dateStr) return { month: "EVENT", day: "--", year: "" };
    try {
      const dateObj = new Date(dateStr);
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return {
        month: months[dateObj.getMonth()],
        day: dateObj.getDate().toString().padStart(2, "0"),
        year: dateObj.getFullYear()
      };
    } catch {
      return { month: "EVENT", day: "--", year: "" };
    }
  };

  // Filter Logic
  const filteredEvents = events.filter((e) => {
    if (activeCategory === "all") return true;
    return e.type?.toLowerCase() === activeCategory.toLowerCase();
  });

  const categories = ["all", "technical", "cultural", "sports", "seminar"];
  const featuredEvent = filteredEvents[0];
  const gridEvents = filteredEvents.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="events-container"
    >
      {/* Title Header */}
      <div className="events-header">
        <div>
          <h2 className="events-title">Campus Events</h2>
          <p className="events-subtitle">
            Discover coding contests, cultural programs, sports activities and technical seminars
          </p>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="events-filter-container">
        <div className="events-filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              <span className="filter-tab-text">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </span>
              {activeCategory === cat && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="active-tab-underline"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        {(user?.role === "admin" || user?.role === "hod") && (
          <Button variant="primary" icon={<Plus size={15} />} onClick={handleAddClick}>
            Add Event
          </Button>
        )}
      </div>

      {loading ? (
        <div className="events-loading-pane">
          <Skeleton variant="card" count={3} />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="events-layout-stack">
          {/* Spotlight Featured Card */}
          {featuredEvent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="featured-hero-container"
            >
              <Card className="featured-hero-card">
                <div className="featured-grid-split">
                  {/* Left Column */}
                  <div className="featured-left-info">
                    <div className="featured-badge-row">
                      <span className="featured-spotlight-tag">Spotlight</span>
                      <Badge variant={featuredEvent.type === "technical" ? "info" : "warning"}>
                        {featuredEvent.type}
                      </Badge>
                    </div>
                    <h3 className="featured-hero-title">{featuredEvent.title}</h3>
                    <p className="featured-hero-desc">
                      {featuredEvent.description || "Join us for this exciting highlight event of the campus semester."}
                    </p>
                    <div className="featured-meta-pillbox">
                      <div className="featured-meta-pill">
                        <MapPin size={13} className="meta-icon" />
                        <span>{featuredEvent.venue}</span>
                      </div>
                      <div className="featured-meta-pill">
                        <Clock size={13} className="meta-icon" />
                        <span>Date: {featuredEvent.event_date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="featured-right-action">
                    {/* Big Calendar Badge */}
                    <div className="calendar-sheet-badge hero-calendar">
                      <span className="calendar-sheet-month">
                        {parseEventDate(featuredEvent.event_date).month}
                      </span>
                      <span className="calendar-sheet-day">
                        {parseEventDate(featuredEvent.event_date).day}
                      </span>
                    </div>

                    <div className="featured-attendance-box">
                      <div className="attendance-label-row">
                        <span>Participants Capacity</span>
                        <span className="attendance-digits">
                          {featuredEvent.registeredCount} / {featuredEvent.maxParticipants}
                        </span>
                      </div>
                      
                      {/* Slim progress bar */}
                      <div className="capacity-progress-container">
                        <div 
                          className="capacity-progress-bar" 
                          style={{ width: `${Math.min(100, (featuredEvent.registeredCount / featuredEvent.maxParticipants) * 100)}%` }} 
                        />
                      </div>

                      {/* Overlapping circular avatars */}
                      <div className="attendees-avatar-pile">
                        <div className="attendee-avatar" style={{ backgroundColor: "#dc2626" }}>JD</div>
                        <div className="attendee-avatar" style={{ backgroundColor: "#2563eb", marginLeft: "-8px" }}>AM</div>
                        <div className="attendee-avatar" style={{ backgroundColor: "#16a34a", marginLeft: "-8px" }}>SR</div>
                        {featuredEvent.registeredCount > 3 && (
                          <div className="attendee-avatar-plus" style={{ marginLeft: "-8px" }}>
                            +{featuredEvent.registeredCount - 3}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="featured-btn-box">
                      {user?.role === "admin" || user?.role === "hod" ? (
                        <div className="admin-actions-box" style={{ display: "flex", gap: "10px", width: "100%" }}>
                          <Button
                            size="md"
                            variant="secondary"
                            onClick={() => handleEditClick(featuredEvent)}
                            style={{ flex: 1 }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="md"
                            variant="danger"
                            onClick={() => handleDeleteEvent(featuredEvent.id)}
                            style={{ flex: 1 }}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : featuredEvent.registered ? (
                        <div className="registration-status-box">
                          <Badge variant="success">Registered</Badge>
                          <span className="checkin-label">QR Check-in ready</span>
                        </div>
                      ) : (
                        <Button
                          size="md"
                          variant="primary"
                          onClick={() => handleRegister(featuredEvent.id)}
                          disabled={featuredEvent.registeredCount >= featuredEvent.maxParticipants}
                          style={{ width: "100%" }}
                        >
                          {featuredEvent.registeredCount >= featuredEvent.maxParticipants ? "Full" : "Register Now"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Grid of Other Events */}
          {gridEvents.length > 0 && (
            <div className="events-cards-grid">
              {gridEvents.map((event, idx) => {
                const { month, day } = parseEventDate(event.event_date);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="event-card-wrapper"
                  >
                    <Card className="event-item-card">
                      {/* Top Info Bar */}
                      <div className="event-card-top-header">
                        {/* Calendar Badge Left */}
                        <div className="calendar-sheet-badge">
                          <span className="calendar-sheet-month">{month}</span>
                          <span className="calendar-sheet-day">{day}</span>
                        </div>
                        {/* Title details Right */}
                        <div className="event-header-details">
                          <div className="event-type-badge-row">
                            <Badge variant={event.type === "technical" ? "info" : "warning"}>
                              {event.type}
                            </Badge>
                          </div>
                          <h4 className="event-item-title">{event.title}</h4>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="event-item-desc">
                        {event.description || "Join us for this exciting campus activity."}
                      </p>

                      {/* Location and Metadata */}
                      <div className="card-event-meta-box">
                        <div className="card-meta-line">
                          <MapPin size={12} className="meta-icon" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="card-meta-line">
                          <Users size={12} className="meta-icon" />
                          <span>{event.registeredCount} / {event.maxParticipants} registered</span>
                        </div>
                        
                        {/* Slim capacity bar */}
                        <div className="capacity-progress-container" style={{ marginTop: "6px" }}>
                          <div 
                            className="capacity-progress-bar" 
                            style={{ width: `${Math.min(100, (event.registeredCount / event.maxParticipants) * 100)}%` }} 
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="event-card-bottom" style={{ marginTop: "auto" }}>
                        {user?.role === "admin" || user?.role === "hod" ? (
                          <div className="admin-actions-box" style={{ display: "flex", gap: "10px", width: "100%" }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleEditClick(event)}
                              style={{ flex: 1 }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteEvent(event.id)}
                              style={{ flex: 1 }}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : event.registered ? (
                          <div className="registration-status-box">
                            <Badge variant="success">Registered</Badge>
                            <span className="checkin-label">QR Check-in ready</span>
                          </div>
                        ) : (
                          <div className="register-btn-box">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleRegister(event.id)}
                              disabled={event.registeredCount >= event.maxParticipants}
                            >
                              {event.registeredCount >= event.maxParticipants ? "Full" : "Register"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <Card hoverGlow={false} className="events-empty-card">
          No events scheduled.
        </Card>
      )}

      {/* Slide-out Sheet Drawer */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="drawer-backdrop"
              onClick={() => setShowAddModal(false)}
            />
            {/* Drawer container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="drawer-sheet"
            >
              <div className="drawer-header">
                <h3 className="drawer-title">
                  {editEventId ? "Edit Event" : "Create Event"}
                </h3>
                <button className="drawer-close-btn" onClick={() => setShowAddModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="drawer-form-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="drawer-input-label">Event Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. CodeStorm Hackathon"
                    required
                    className="drawer-text-input"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="drawer-input-label">Description</label>
                  <textarea 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Provide details about registration, rules, guidelines..."
                    rows={4}
                    className="drawer-textarea-input"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="drawer-input-label">Event Date</label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="drawer-text-input"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="drawer-input-label">Venue Location</label>
                  <input 
                    type="text" 
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. Campus Auditorium, Hall-C"
                    required
                    className="drawer-text-input"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="drawer-input-label">Event Category</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    required
                    className="drawer-select-input"
                  >
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="seminar">Seminar</option>
                  </select>
                </div>

                <div className="drawer-action-row">
                  <Button variant="secondary" onClick={() => setShowAddModal(false)} type="button">
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    {editEventId ? "Save Changes" : "Publish Event"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
