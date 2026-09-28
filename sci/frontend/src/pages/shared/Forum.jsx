import "./Forum.css";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Skeleton, Badge, Button, SearchBar, Tabs, Modal, Avatar } from "../../components/ui";
import {
  Pin,
  MessageSquare,
  Plus,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  HelpCircle,
  Hash,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export const Forum = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [courseTags, setCourseTags] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPostsCount, setTotalPostsCount] = useState(0);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCourseTag, setNewCourseTag] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (activeTag !== "all") params.course_tag = activeTag;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/forum/posts", { params });
      const data = res.data;
      setPosts(data.posts || []);
      setTotalPages(data.total_pages || 1);
      if (data.total_count) setTotalPostsCount(data.total_count);
    } catch {
      toast.error("Failed to load forum posts");
    } finally {
      setLoading(false);
    }
  }, [page, activeTag, search]);

  const fetchCourseTags = async () => {
    try {
      const res = await api.get("/forum/posts", { params: { page: 1, per_page: 100 } });
      const allPosts = res.data.posts || [];
      const tags = [...new Set(allPosts.map((p) => p.course_tag))].filter(Boolean);
      setCourseTags(tags);
      if (allPosts.length > 0) setTotalPostsCount(allPosts.length);
    } catch {
    }
  };

  useEffect(() => {
    fetchCourseTags();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleTagChange = (tag) => {
    setActiveTag(tag);
    setPage(1);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim() || !newCourseTag.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setCreating(true);
    try {
      await api.post("/forum/posts", {
        title: newTitle.trim(),
        body: newBody.trim(),
        course_tag: newCourseTag.trim()
      });
      toast.success("Discussion posted successfully!");
      setShowCreateForm(false);
      setNewTitle("");
      setNewBody("");
      setNewCourseTag("");
      setPage(1);
      fetchPosts();
      fetchCourseTags();
    } catch {
      toast.error("Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  const tabs = [
    { id: "all", label: "All Discussions" },
    ...courseTags.map((tag) => ({ id: tag, label: tag }))
  ];

  const pinnedPosts = posts.filter((p) => p.is_pinned);
  const regularPosts = posts.filter((p) => !p.is_pinned);

  // Compute total replies across loaded posts
  const totalRepliesCount = posts.reduce((acc, p) => acc + (p.reply_count || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="forum-page-container"
    >
      {/* Top Header */}
      <div className="forum-header-row">
        <div className="forum-header-titles">
          <h1 className="forum-main-title">Discussion Forum</h1>
          <p className="forum-subtitle">
            Ask questions, share knowledge, and discuss technical topics with your peers
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={16} style={{ marginRight: "6px" }} />
          New Post
        </Button>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="forum-layout-grid">
        {/* Left / Main Column */}
        <div className="forum-main-column">
          {/* Search + Filter */}
          <div className="forum-filter-bar">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search discussions or questions..."
            />
            {courseTags.length > 0 && (
              <Tabs tabs={tabs} activeTab={activeTag} onChange={handleTagChange} />
            )}
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="forum-posts-grid">
              <Skeleton variant="card" count={4} />
            </div>
          ) : posts.length > 0 ? (
            <div className="forum-posts-grid">
              {/* Pinned Posts */}
              {pinnedPosts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => navigate(`/forum/${post.id}`)}
                  className="forum-post-list-card pinned-card"
                >
                  <div className="forum-card-inner">
                    <div className="forum-card-main">
                      <div className="forum-card-pinned-tag">
                        <Pin size={11} />
                        Pinned
                      </div>
                      <h3 className="forum-card-title">{post.title}</h3>
                      <div className="forum-card-meta">
                        <span className="forum-card-author-wrap">
                          <Avatar name={post.author_name} size="xs" />
                          <span>{post.author_name}</span>
                        </span>
                        <span className="forum-card-dot">·</span>
                        <Badge variant="info">{post.course_tag}</Badge>
                        <span className="forum-card-dot">·</span>
                        <span className="forum-card-stat">
                          <MessageSquare size={13} />
                          {post.reply_count || 0}
                        </span>
                        <span className="forum-card-dot">·</span>
                        <span className="forum-card-stat">
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Regular Posts */}
              {regularPosts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (pinnedPosts.length + idx) * 0.03 }}
                  onClick={() => navigate(`/forum/${post.id}`)}
                  className="forum-post-list-card"
                >
                  <div className="forum-card-inner">
                    <div className="forum-card-main">
                      <h3 className="forum-card-title">{post.title}</h3>
                      <div className="forum-card-meta">
                        <span className="forum-card-author-wrap">
                          <Avatar name={post.author_name} size="xs" />
                          <span>{post.author_name}</span>
                        </span>
                        <span className="forum-card-dot">·</span>
                        <Badge variant="info">{post.course_tag}</Badge>
                        <span className="forum-card-dot">·</span>
                        <span className="forum-card-stat">
                          <MessageSquare size={13} />
                          {post.reply_count || 0}
                        </span>
                        <span className="forum-card-dot">·</span>
                        <span className="forum-card-stat">
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="forum-empty-card">
              <div className="forum-empty-icon-wrap">
                <MessageSquare size={24} />
              </div>
              <h4 className="forum-empty-title">No discussions found</h4>
              <p className="forum-empty-desc">
                Be the first to start a conversation or ask a question!
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus size={15} style={{ marginRight: "4px" }} />
                Start New Discussion
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="forum-pagination-row">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <span className="forum-page-indicator">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Right / Sidebar Column */}
        <div className="forum-side-column">
          {/* Community Overview Card */}
          <div className="forum-sidebar-card">
            <div className="forum-sidebar-header">
              <h3 className="forum-sidebar-title">
                <Sparkles size={16} style={{ color: "var(--brand, #F21722)" }} />
                Community Pulse
              </h3>
            </div>
            <div className="forum-stats-row">
              <div className="forum-stat-box">
                <span className="forum-stat-number">{totalPostsCount || posts.length}</span>
                <span className="forum-stat-label">Topics</span>
              </div>
              <div className="forum-stat-box">
                <span className="forum-stat-number">{totalRepliesCount}</span>
                <span className="forum-stat-label">Answers</span>
              </div>
              <div className="forum-stat-box">
                <span className="forum-stat-number">{courseTags.length || 1}</span>
                <span className="forum-stat-label">Tags</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              style={{ width: "100%" }}
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={14} style={{ marginRight: "6px" }} />
              Ask a Question
            </Button>
          </div>

          {/* Categories Card */}
          {courseTags.length > 0 && (
            <div className="forum-sidebar-card">
              <div className="forum-sidebar-header">
                <h3 className="forum-sidebar-title">
                  <Hash size={16} style={{ color: "#60A5FA" }} />
                  Categories
                </h3>
              </div>
              <div className="forum-sidebar-categories">
                <button
                  type="button"
                  onClick={() => handleTagChange("all")}
                  className={`forum-sidebar-category-item ${activeTag === "all" ? "active" : ""}`}
                >
                  <span>All Categories</span>
                  <span>{posts.length}</span>
                </button>
                {courseTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagChange(tag)}
                    className={`forum-sidebar-category-item ${activeTag === tag ? "active" : ""}`}
                  >
                    <span>{tag}</span>
                    <span>
                      {posts.filter((p) => p.course_tag === tag).length || "•"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Discussion Guidelines */}
          <div className="forum-sidebar-card">
            <div className="forum-sidebar-header">
              <h3 className="forum-sidebar-title">
                <HelpCircle size={16} style={{ color: "#FBBF24" }} />
                Forum Guidelines
              </h3>
            </div>
            <div className="forum-guidelines-list">
              <div className="forum-guideline-item">
                <CheckCircle2 size={15} className="forum-guideline-icon" />
                <span>Search existing questions before posting to avoid duplicates.</span>
              </div>
              <div className="forum-guideline-item">
                <CheckCircle2 size={15} className="forum-guideline-icon" />
                <span>Format code snippets using markdown code blocks (```).</span>
              </div>
              <div className="forum-guideline-item">
                <CheckCircle2 size={15} className="forum-guideline-icon" />
                <span>Be constructive, respectful, and helpful to your fellow peers.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Discussion"
        size="lg"
      >
        <form onSubmit={handleCreatePost} className="forum-create-form">
          <div className="forum-form-group">
            <label className="forum-form-label">
              <span>Title</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What is your question or discussion topic?"
              className="forum-modal-input"
              autoFocus
            />
          </div>

          <div className="forum-form-group">
            <label className="forum-form-label">
              <span>Course Tag / Category</span>
            </label>
            <input
              type="text"
              value={newCourseTag}
              onChange={(e) => setNewCourseTag(e.target.value)}
              placeholder="e.g. Academic, CS101, Algorithms..."
              className="forum-modal-input"
            />
            {courseTags.length > 0 && (
              <div className="forum-tag-suggestions">
                <span style={{ fontSize: "0.72rem", color: "#737373" }}>Suggestions:</span>
                {courseTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewCourseTag(tag)}
                    className="forum-tag-suggestion-pill"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="forum-form-group">
            <label className="forum-form-label">
              <span>Description</span>
              <span className="forum-form-hint">Supports Markdown & code blocks</span>
            </label>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Provide context, code snippets, or error details..."
              rows={6}
              className="forum-modal-textarea"
            />
          </div>

          <div className="forum-modal-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={creating || !newTitle.trim() || !newBody.trim() || !newCourseTag.trim()}
            >
              <Plus size={15} style={{ marginRight: "4px" }} />
              {creating ? "Publishing..." : "Create Post"}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
