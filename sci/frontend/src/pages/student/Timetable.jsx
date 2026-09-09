import "./Timetable.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, Skeleton } from "../../components/ui";
import {
  Clock,
  MapPin,
  User as UserIcon,
  Calendar,
  List,
  Grid,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  BarChart2,
  Beaker,
  Book
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export const Timetable = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("daily");
  const [activeDay, setActiveDay] = useState("Monday");
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    const todayName = new Date().toLocaleString("en-US", { weekday: "long" });
    if (days.includes(todayName)) {
      setActiveDay(todayName);
    }
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await api.get("/timetable/my");
      setTimetable(res.data);
    } catch (err) {
      toast.error("Failed to fetch timetable.");
    }
  };

  const fetchNextClass = async () => {
    try {
      const res = await api.get("/timetable/next");
      setNextClass(res.data);
    } catch (err) {
      console.error("Error fetching next class:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTimetable(), fetchNextClass()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!nextClass) return;
    const updateCountdown = () => {
      const now = new Date();
      const [hours, minutes] = nextClass.startTime.split(":");
      const target = new Date();
      target.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("Started");
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${h > 0 ? h + "h " : ""}${m}m ${s}s`);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextClass]);

  const timeToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  };

  const totalMinutes = timetable.reduce((acc, curr) => {
    const duration = timeToMinutes(curr.endTime) - timeToMinutes(curr.startTime);
    return acc + (duration > 0 ? duration : 0);
  }, 0);

  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalLectures = timetable.length;
  const uniqueSubjects = new Set(timetable.map((t) => t.subject)).size;
  
  const labHours = timetable
    .filter((t) => t.subject.toLowerCase().includes("lab") || t.subject.toLowerCase().includes("practical"))
    .reduce((acc, curr) => {
      const duration = timeToMinutes(curr.endTime) - timeToMinutes(curr.startTime);
      return acc + (duration > 0 ? duration : 0);
    }, 0);
  const totalLabHours = (labHours / 60).toFixed(1);

  const dailyClasses = timetable.filter((item) => item.day === activeDay);

  const getDaysInMonth = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const numDays = new Date(y, m + 1, 0).getDate();
    return { firstDay, numDays };
  };

  const renderMonthlyCalendar = () => {
    const { firstDay, numDays } = getDaysInMonth(currentDate);
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysArray = [];
    for (let i = 0; i < startOffset; i++) {
      daysArray.push(null);
    }
    for (let d = 1; d <= numDays; d++) {
      daysArray.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d));
    }
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div className="monthly-container">
        <div className="monthly-header">
          <div className="monthly-title">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </div>
          <div className="monthly-nav">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="monthly-nav-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="monthly-nav-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="monthly-grid">
          {weekdays.map((day) => (
            <div key={day} className="monthly-weekday-label">{day}</div>
          ))}
          {daysArray.map((dateObj, idx) => {
            if (!dateObj) {
              return <div key={`empty-${idx}`} className="monthly-day-cell empty-cell" />;
            }
            const dayName = dateObj.toLocaleString("en-US", { weekday: "long" });
            const dayClasses = timetable.filter((t) => t.day === dayName);
            const isToday =
              dateObj.getDate() === new Date().getDate() &&
              dateObj.getMonth() === new Date().getMonth() &&
              dateObj.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={dateObj.toISOString()}
                className={`monthly-day-cell ${isToday ? "today-cell" : ""}`}
              >
                <span className="monthly-day-num">{dateObj.getDate()}</span>
                {dayClasses.length > 0 && (
                  <div className="monthly-day-events">
                    {dayClasses.slice(0, 2).map((c, cIdx) => (
                      <div key={c.id || cIdx} className="monthly-event-dot">
                        {c.subject}
                      </div>
                    ))}
                    {dayClasses.length > 2 && (
                      <div className="monthly-events-more">
                        +{dayClasses.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="timetable-container"
    >
      {/* Header section */}
      <div className="timetable-header">
        <div>
          <h2 className="timetable-title">
            Good Morning, <span className="text-red">{user ? user.name.split(" ")[0] : "Student"}</span>! 👋
          </h2>
          <p className="timetable-subtitle">
            Here's your academic schedule overview
          </p>
        </div>
        
        {/* View Toggles */}
        <div className="timetable-view-toggles-container">
          <button
            onClick={() => setViewMode("daily")}
            className={`view-toggle-btn ${viewMode === "daily" ? "active-toggle" : ""}`}
          >
            <List size={14} />
            <span>Daily</span>
          </button>
          <button
            onClick={() => setViewMode("weekly")}
            className={`view-toggle-btn ${viewMode === "weekly" ? "active-toggle" : ""}`}
          >
            <Grid size={14} />
            <span>Weekly</span>
          </button>
          <button
            onClick={() => setViewMode("monthly")}
            className={`view-toggle-btn ${viewMode === "monthly" ? "active-toggle" : ""}`}
          >
            <Calendar size={14} />
            <span>Monthly</span>
          </button>
        </div>
      </div>

      {/* Grid for Up Next and Analytics */}
      <div className="timetable-meta-grid">
        {/* Next Class Countdown Card */}
        <Card className="timetable-meta-card next-class-card">
          <span className="meta-card-label">UP NEXT CLASS</span>
          {nextClass ? (
            <div className="next-class-content">
              <h3 className="next-class-title">{nextClass.subjectName}</h3>
              <div className="next-class-detail-row">
                <Clock size={14} />
                <span>{nextClass.startTime} - {nextClass.endTime}</span>
              </div>
              <div className="next-class-detail-row">
                <MapPin size={14} />
                <span>{nextClass.room}</span>
              </div>
              <div className="next-class-instructor-row">
                <div className="next-class-avatar">
                  {nextClass.faculty.split(" ").pop()?.slice(0, 2).toUpperCase() || "FA"}
                </div>
                <div>
                  <div className="next-class-faculty-name">{nextClass.faculty}</div>
                  <div className="next-class-role">Instructor</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="next-class-empty">
              <div className="next-class-empty-icon">
                <Calendar size={20} />
              </div>
              <p className="next-class-empty-title">No more classes</p>
              <p className="next-class-empty-subtitle">scheduled today.</p>
              <p className="next-class-empty-enjoy">Enjoy your free time! 🎉</p>
            </div>
          )}
        </Card>

        {/* Timetable Analytics Grid */}
        <Card className="timetable-meta-card analytics-card">
          <div className="analytics-header">
            <BarChart2 size={16} />
            <span>SCHEDULE ANALYTICS</span>
          </div>
          <div className="analytics-metrics-grid">
            <div className="metric-box">
              <div className="metric-icon-box">
                <Clock size={15} />
              </div>
              <div>
                <span className="metric-label">LECTURE HOURS</span>
                <div className="metric-value">{totalHours} <span className="metric-unit">hrs</span></div>
                <span className="metric-period">This Week</span>
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-icon-box">
                <BookOpen size={15} />
              </div>
              <div>
                <span className="metric-label">LECTURES/WEEK</span>
                <div className="metric-value">{totalLectures}</div>
                <span className="metric-period">Classes</span>
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-icon-box">
                <Beaker size={15} />
              </div>
              <div>
                <span className="metric-label">LAB HOURS</span>
                <div className="metric-value">{totalLabHours} <span className="metric-unit">hrs</span></div>
                <span className="metric-period">This Week</span>
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-icon-box">
                <Book size={15} />
              </div>
              <div>
                <span className="metric-label">SUBJECTS</span>
                <div className="metric-value">{uniqueSubjects}</div>
                <span className="metric-period">Enrolled</span>
              </div>
            </div>
          </div>
          <div className="analytics-eligibility-warning">
            <BookOpen size={13} />
            <span>
              Regular attendance above <span className="text-red">75%</span> is required for semester eligibility.
            </span>
          </div>
        </Card>
      </div>

      {/* Main Timetable View Container */}
      {loading ? (
        <div className="timetable-loading">
          <Skeleton variant="text" count={1} />
          <div className="timetable-loading-cards">
            <Skeleton variant="card" count={3} />
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === "daily" && (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="daily-timetable-container"
            >
              {/* Day Selector Tabs */}
              <div className="timetable-day-selector scrollbar-none">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`timetable-day-tab-btn ${activeDay === day ? "active" : ""}`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Class Cards List */}
              {dailyClasses.length > 0 ? (
                <div className="daily-classes-grid">
                  {dailyClasses.map((item, idx) => (
                    <motion.div
                      key={item.id || idx}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03, type: "spring", stiffness: 380, damping: 26 }}
                    >
                      {(() => {
                        const isLab = ["lab", "practical", "workshop", "seminar"].some(kw => (item.subjectName || "").toLowerCase().includes(kw));
                        return (
                          <Card className={`timetable-class-card ${isLab ? "card-lab" : "card-theory"}`}>
                            <div className="class-card-header">
                              <h3 className="class-card-subject">{item.subjectName}</h3>
                              <span className={`class-card-badge ${isLab ? "badge-lab" : "badge-theory"}`}>
                                {isLab ? "Lab Class" : "Theory Class"}
                              </span>
                            </div>
                            <div className="class-card-details">
                              <div className="class-card-detail-item">
                                <Clock size={14} />
                                <span>{item.startTime} - {item.endTime}</span>
                              </div>
                              <div className="class-card-detail-item">
                                <MapPin size={14} />
                                <span>{item.room || "TBD"} {isLab ? "(Allocated Lab)" : "(Permanent Classroom)"}</span>
                              </div>
                              <div className="class-card-detail-item-footer">
                                <UserIcon size={14} />
                                <span>{item.faculty || "N/A"}</span>
                              </div>
                            </div>
                          </Card>
                        );
                      })()}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="empty-timetable-placeholder">
                  <div className="empty-timetable-icon-wrapper">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="12" y="16" width="40" height="36" rx="8" stroke="#8e9196" strokeWidth="3" />
                      <line x1="12" y1="28" x2="52" y2="28" stroke="#8e9196" strokeWidth="3" />
                      <line x1="22" y1="12" x2="22" y2="18" stroke="#8e9196" strokeWidth="3" strokeLinecap="round" />
                      <line x1="42" y1="12" x2="42" y2="18" stroke="#8e9196" strokeWidth="3" strokeLinecap="round" />
                      
                      <circle cx="46" cy="46" r="11" fill="#090a0c" />
                      <circle cx="46" cy="46" r="9" stroke="#E31B23" strokeWidth="2.5" />
                      <path d="M46 42V46H49" stroke="#E31B23" strokeWidth="2" strokeLinecap="round" />
                      
                      <path d="M6 34L8 32L6 30L4 32L6 34Z" fill="#ff3344" opacity="0.6" />
                      <path d="M56 22L57 21L56 20L55 21L56 22Z" fill="#ff3344" opacity="0.6" />
                    </svg>
                  </div>
                  <h4 className="empty-timetable-title">No classes scheduled for {activeDay}.</h4>
                  <p className="empty-timetable-subtitle">Your timetable will appear here once classes are scheduled.</p>
                </Card>
              )}
            </motion.div>
          )}

          {viewMode === "weekly" && (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="weekly-timetable-grid"
            >
              {days.map((day) => {
                const dayClasses = timetable.filter((item) => item.day === day);
                const isCurrentDay = day === new Date().toLocaleString("en-US", { weekday: "long" });
                return (
                  <Card
                    key={day}
                    className={`weekly-day-column ${isCurrentDay ? "current-day-column" : ""}`}
                  >
                    <div className="weekly-column-header">
                      <h4 className={`weekly-column-title ${isCurrentDay ? "text-blue" : ""}`}>{day}</h4>
                      {isCurrentDay && <span className="weekly-column-indicator" />}
                    </div>
                    {dayClasses.length > 0 ? (
                      <div className="weekly-column-classes">
                        {dayClasses.map((item, cIdx) => {
                          const isLabClass = ["lab", "practical", "workshop", "seminar"].some(kw => (item.subject || "").toLowerCase().includes(kw));
                          return (
                            <div 
                              key={item.id || cIdx} 
                              className={`weekly-class-item ${isLabClass ? "item-lab" : "item-theory"}`}
                            >
                              <div className="weekly-class-subject">
                                {item.subject}
                              </div>
                              <div className="weekly-class-time">
                                <Clock size={10} />
                                <span>{item.startTime}</span>
                              </div>
                              <div className="weekly-class-room">
                                <MapPin size={10} />
                                <span>{item.room} {isLabClass ? "🧪" : "🏫"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="weekly-column-empty">No classes</div>
                    )}
                  </Card>
                );
              })}
            </motion.div>
          )}

          {viewMode === "monthly" && (
            <motion.div
              key="monthly"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderMonthlyCalendar()}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};
