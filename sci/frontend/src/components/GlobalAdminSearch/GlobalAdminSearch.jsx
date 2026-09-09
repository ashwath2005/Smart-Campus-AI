import React, { useState, useEffect, useRef } from "react";
import { Search, X, Users, Landmark, Award, Briefcase, ChevronRight, Loader2 } from "lucide-react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./GlobalAdminSearch.css";

export const GlobalAdminSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/global-search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  const hasResults =
    results &&
    (results.users.length > 0 ||
      results.departments.length > 0 ||
      results.events.length > 0 ||
      results.placements.length > 0);

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="search-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input Header */}
        <div className="search-bar-header">
          <Search size={18} className="search-bar-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search students, faculty, departments, events, placement drives..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-bar-input"
          />
          {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
          <button onClick={onClose} className="search-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Search Results Display Area */}
        <div className="search-results-area">
          {query.trim() && !loading && !hasResults && (
            <div className="search-empty-state">
              <Search size={32} className="text-slate-600 mb-2" />
              <p className="text-sm text-slate-400 font-medium">No campus entities match "{query}"</p>
            </div>
          )}

          {hasResults && (
            <div className="search-results-list">
              {/* Users */}
              {results.users.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-title">
                    <Users size={14} />
                    <span>Students & Faculty</span>
                  </div>
                  {results.users.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelect(u.role === "student" ? "/admin/core-hub" : "/faculty-locator")}
                      className="search-item"
                    >
                      <div>
                        <div className="search-item-name">{u.name}</div>
                        <div className="search-item-meta">{(u.role || "USER").toUpperCase()} • {u.email}</div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Departments */}
              {results.departments.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-title">
                    <Landmark size={14} />
                    <span>Departments</span>
                  </div>
                  {results.departments.map((d) => (
                    <div key={d.id} onClick={() => handleSelect("/admin/core-hub")} className="search-item">
                      <div>
                        <div className="search-item-name">{d.name} ({d.code})</div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Events */}
              {results.events.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-title">
                    <Award size={14} />
                    <span>Campus Events</span>
                  </div>
                  {results.events.map((e) => (
                    <div key={e.id} onClick={() => handleSelect("/events")} className="search-item">
                      <div>
                        <div className="search-item-name">{e.title}</div>
                        <div className="search-item-meta">Date: {e.date}</div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Placement Drives */}
              {results.placements.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-title">
                    <Briefcase size={14} />
                    <span>Placement Drives</span>
                  </div>
                  {results.placements.map((p) => (
                    <div key={p.id} onClick={() => handleSelect("/placements")} className="search-item">
                      <div>
                        <div className="search-item-name">{p.title}</div>
                        <div className="search-item-meta">Type: {p.type}</div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="search-hints font-medium text-xs text-slate-500 p-4">
              <span>Quick hints: Try searching for </span>
              <span className="text-red-400 font-semibold cursor-pointer" onClick={() => setQuery("CSE")}>"CSE"</span>,{" "}
              <span className="text-red-400 font-semibold cursor-pointer" onClick={() => setQuery("Software")}>"Software"</span>, or{" "}
              <span className="text-red-400 font-semibold cursor-pointer" onClick={() => setQuery("Tech")}>"Tech"</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
