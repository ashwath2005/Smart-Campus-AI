import "./StudyMaterials.css";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, Skeleton } from "../../components/ui";
import {
  Search,
  FileText,
  SlidersHorizontal,
  MonitorPlay,
  FileEdit,
  Plus,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const typesConfig = [
    { id: "all", label: "All", icon: SlidersHorizontal },
    { id: "pdf", label: "PDF", icon: FileText },
    { id: "slides", label: "Slides", icon: MonitorPlay },
    { id: "notes", label: "Notes", icon: FileEdit }
  ];

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await api.get("/study-materials");
        setMaterials(res.data);
      } catch (err) {
        toast.error("Failed to fetch study materials");
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const filteredMaterials = materials.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === "all" || item.type.toLowerCase() === activeType;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="study-materials-container"
    >
      <div>
        <h2 className="study-materials-title">Study Materials</h2>
        <p className="study-materials-subtitle">
          Access course lectures, notes, slides and visual guides
        </p>
      </div>

      {/* Filters & Search Row */}
      <div className="materials-filter-row">
        {/* Search Bar */}
        <div className="materials-search-container">
          <Search size={16} className="materials-search-icon" />
          <input
            type="text"
            placeholder="Search materials or subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="materials-search-input"
          />
        </div>

        {/* Filter Capsule Group */}
        <div className="materials-capsule-group">
          {typesConfig.map((type) => {
            const Icon = type.icon;
            const isActive = activeType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`materials-capsule-btn ${isActive ? "active" : ""}`}
              >
                <Icon size={14} />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort By Row */}
      <div className="materials-sort-row">
        <div className="materials-sort-select-wrapper">
          <span className="sort-label">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="materials-sort-select"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
          <ChevronDown size={14} className="sort-chevron" />
        </div>
        <div className="materials-count-label">
          {filteredMaterials.length} materials found
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="materials-loading">
          <Skeleton variant="card" count={3} />
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="materials-grid">
          {filteredMaterials.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className="material-card">
                {/* Content of material when populated */}
                <div className="material-card-content">
                  <div className="material-header-row">
                    <span className="material-subject">{item.subject}</span>
                    <span className="material-type-tag">{item.type}</span>
                  </div>
                  <h3 className="material-title">{item.title}</h3>
                  <p className="material-desc">{item.description}</p>
                </div>
                <div className="material-footer-row">
                  <span className="material-author">By: {item.uploadedBy}</span>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="material-open-link"
                  >
                    Open Material
                  </a>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card hoverGlow={false} className="empty-materials-card">
          <div className="empty-materials-icon-wrapper">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="12" y="22" width="48" height="34" rx="6" stroke="#4a4c54" strokeWidth="3" />
              <path d="M12 32H60" stroke="#4a4c54" strokeWidth="3" />
              <path d="M12 26C12 23.7909 13.7909 22 16 22H28L34 28H56C58.2091 28 60 29.7909 60 32" stroke="#4a4c54" strokeWidth="3" />
              
              {/* Red document popping out of the folder */}
              <rect x="28" y="10" width="22" height="26" rx="4" fill="#E31B23" />
              <line x1="33" y1="16" x2="45" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="33" y1="21" x2="45" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="33" y1="26" x2="41" y2="26" stroke="white" strokeWidth="2" strokeLinecap="round" />
              
              <path d="M6 38L8 36L6 34L4 36L6 38Z" fill="#ff3344" opacity="0.6" />
              <path d="M66 26L67 25L66 24L65 25L66 26Z" fill="#ff3344" opacity="0.6" />
            </svg>
          </div>
          <h3 className="empty-materials-title">No study materials found</h3>
          <p className="empty-materials-subtitle">
            Materials will appear here when they are uploaded by your faculty.
          </p>
          <button className="empty-materials-btn">
            <Plus size={16} />
            <span>Upload Material</span>
          </button>
        </Card>
      )}
    </motion.div>
  );
};
