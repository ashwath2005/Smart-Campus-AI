import "./ForumPost.css";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../../api/axios";
import { Skeleton, Badge, Button, Avatar } from "../../components/ui";
import {
  ArrowLeft,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  MessageSquare,
  Send,
  CornerDownRight,
  Clock,
  Share2,
  Sparkles,
  AlertTriangle,
  X,
  BookOpen,
  Code2,
  Layers,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

function getCurrentUser() {
  try {
    const stored = localStorage.getItem("campus_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.user || parsed;
    }
  } catch {
  }
  return null;
}

function buildReplyTree(replies) {
  const map = new Map();
  const roots = [];
  replies.forEach((r) => {
    map.set(r.id, { ...r, children: [] });
  });
  replies.forEach((r) => {
    const node = map.get(r.id);
    if (r.parent_reply_id && map.has(r.parent_reply_id)) {
      map.get(r.parent_reply_id).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export const ForumPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const replyTextareaRef = useRef(null);

  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyingToAuthor, setReplyingToAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyBody, setEditReplyBody] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState(null);

  const currentUser = getCurrentUser();
  const isAuthor = currentUser && post && currentUser.id === post.author_id;
  const isModerator = currentUser && (currentUser.role === "faculty" || currentUser.role === "admin");

  const fetchPost = async () => {
    try {
      const res = await api.get(`/forum/posts/${postId}`);
      setPost(res.data);
    } catch {
      toast.error("Failed to load post");
      navigate("/forum");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      const res = await api.get("/forum/posts", { params: { per_page: 5 } });
      const items = (res.data.posts || []).filter((p) => String(p.id) !== String(postId));
      setRelatedPosts(items.slice(0, 4));
    } catch {
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchRelatedPosts();
    }
  }, [postId]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      const payload = { body: replyBody.trim() };
      if (replyingTo) payload.parent_reply_id = replyingTo;
      await api.post(`/forum/posts/${postId}/replies`, payload);
      toast.success("Reply posted!");
      setReplyBody("");
      setReplyingTo(null);
      setReplyingToAuthor("");
      fetchPost();
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinToggle = async () => {
    try {
      await api.post(`/forum/posts/${postId}/pin`);
      toast.success(post?.is_pinned ? "Post unpinned" : "Post pinned");
      fetchPost();
    } catch {
      toast.error("Failed to update pin status");
    }
  };

  const handleEditPost = () => {
    if (post) {
      setEditTitle(post.title);
      setEditBody(post.body);
      setEditingPost(true);
    }
  };

  const handleSaveEditPost = async () => {
    if (!editTitle.trim() || !editBody.trim()) {
      toast.error("Title and body are required");
      return;
    }
    try {
      await api.put(`/forum/posts/${postId}`, {
        title: editTitle.trim(),
        body: editBody.trim()
      });
      toast.success("Post updated");
      setEditingPost(false);
      fetchPost();
    } catch {
      toast.error("Failed to update post");
    }
  };

  const handleDeletePost = async () => {
    try {
      await api.delete(`/forum/posts/${postId}`);
      toast.success("Post deleted");
      navigate("/forum");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleEditReply = (reply) => {
    setEditingReplyId(reply.id);
    setEditReplyBody(reply.body);
  };

  const handleSaveEditReply = async () => {
    if (!editReplyBody.trim()) return;
    try {
      await api.put(`/forum/replies/${editingReplyId}`, { body: editReplyBody.trim() });
      toast.success("Reply updated");
      setEditingReplyId(null);
      setEditReplyBody("");
      fetchPost();
    } catch {
      toast.error("Failed to update reply");
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await api.delete(`/forum/replies/${replyId}`);
      toast.success("Reply deleted");
      setDeletingReplyId(null);
      fetchPost();
    } catch {
      toast.error("Failed to delete reply");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Discussion link copied to clipboard!");
  };

  const scrollToReply = () => {
    if (replyTextareaRef.current) {
      replyTextareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      replyTextareaRef.current.focus();
    }
  };

  const handleStartReply = (reply) => {
    setReplyingTo(reply.id);
    setReplyingToAuthor(reply.author_name);
    scrollToReply();
  };

  const insertFormatting = (type) => {
    if (!replyTextareaRef.current) return;
    const textarea = replyTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = replyBody.substring(start, end);
    let insertion = "";

    switch (type) {
      case "bold":
        insertion = `**${selected || "bold text"}**`;
        break;
      case "italic":
        insertion = `*${selected || "italic text"}*`;
        break;
      case "code":
        if (selected.includes("\n") || !selected) {
          insertion = `\n\`\`\`cpp\n${selected || "// write code here"}\n\`\`\`\n`;
        } else {
          insertion = `\`${selected}\``;
        }
        break;
      case "quote":
        insertion = `\n> ${selected || "quote"}\n`;
        break;
      default:
        break;
    }

    const updated = replyBody.substring(0, start) + insertion + replyBody.substring(end);
    setReplyBody(updated);
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const canModify = (authorId) => {
    return currentUser && (currentUser.id === authorId || isModerator);
  };

  const ReplyNode = ({ reply, depth = 0 }) => {
    const isEditingThis = editingReplyId === reply.id;
    const isDeletingThis = deletingReplyId === reply.id;
    const isPostAuthor = post && reply.author_id === post.author_id;

    return (
      <div className={depth > 0 ? "forum-nested-tree" : ""}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="forum-reply-card"
        >
          {isEditingThis ? (
            <div className="forum-edit-post-form">
              <label className="forum-form-field-label">Edit Reply</label>
              <textarea
                value={editReplyBody}
                onChange={(e) => setEditReplyBody(e.target.value)}
                rows={3}
                className="forum-textarea"
                autoFocus
              />
              <div className="forum-btn-row">
                <Button size="sm" variant="primary" onClick={handleSaveEditReply}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingReplyId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="forum-reply-header">
                <div className="forum-reply-author-box">
                  <Avatar name={reply.author_name} size="sm" />
                  <span className="forum-reply-author-name">{reply.author_name}</span>
                  {isPostAuthor && (
                    <span className="forum-op-badge" title="Original Poster">
                      Author
                    </span>
                  )}
                  <span className="forum-reply-time">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="forum-markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.body}</ReactMarkdown>
              </div>

              {/* Action Buttons */}
              <div className="forum-reply-actions">
                <button
                  type="button"
                  onClick={() => handleStartReply(reply)}
                  className="forum-reply-btn reply-action"
                >
                  <CornerDownRight size={13} />
                  Reply
                </button>

                {canModify(reply.author_id) && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEditReply(reply)}
                      className="forum-reply-btn edit-action"
                    >
                      <Edit2 size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingReplyId(reply.id)}
                      className="forum-reply-btn delete-action"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* In-place Delete Confirmation */}
              {isDeletingThis && (
                <div className="forum-inline-delete-box">
                  <p className="forum-inline-delete-msg">
                    Permanently delete this reply?
                  </p>
                  <div className="forum-btn-row">
                    <Button size="xs" variant="secondary" onClick={() => setDeletingReplyId(null)}>
                      Cancel
                    </Button>
                    <Button size="xs" variant="danger" onClick={() => handleDeleteReply(reply.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Children replies */}
        {reply.children && reply.children.map((child) => (
          <ReplyNode key={child.id} reply={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="forum-thread-container">
        <Skeleton variant="card" count={2} />
      </div>
    );
  }

  if (!post) return null;

  const replyTree = buildReplyTree(post.replies || []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="forum-thread-container"
    >
      {/* Top Navigation */}
      <div className="forum-nav-bar">
        <button onClick={() => navigate("/forum")} className="forum-back-btn">
          <ArrowLeft size={16} />
          Back to Forum
        </button>

        <div className="forum-nav-badges">
          {post.is_pinned && (
            <span className="forum-pinned-chip">
              <Pin size={12} />
              Pinned
            </span>
          )}
          <Badge variant="info">{post.course_tag}</Badge>
        </div>
      </div>

      {/* Master 2-Column Responsive Layout */}
      <div className="forum-thread-layout">
        {/* Main Column */}
        <div className="forum-thread-main">
          {/* Main Post Card */}
          <div className="forum-main-card">
            {editingPost ? (
              <div className="forum-edit-post-form">
                <div>
                  <label className="forum-form-field-label">Post Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="forum-input-title"
                    placeholder="Question title"
                  />
                </div>
                <div>
                  <label className="forum-form-field-label">Question Description (Markdown supported)</label>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={8}
                    className="forum-textarea"
                    placeholder="Describe your question or problem..."
                  />
                </div>
                <div className="forum-btn-row">
                  <Button size="sm" variant="primary" onClick={handleSaveEditPost}>
                    Save Changes
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingPost(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Header: Author + Meta + Actions */}
                <div className="forum-main-header">
                  <div className="forum-author-group">
                    <Avatar name={post.author_name} size="md" />
                    <div className="forum-author-info">
                      <div className="forum-author-name-row">
                        <span className="forum-author-name">{post.author_name}</span>
                        <span className="forum-op-badge">Author</span>
                      </div>
                      <div className="forum-author-sub">
                        <Clock size={12} />
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="forum-actions-toolbar">
                    {isModerator && (
                      <button
                        onClick={handlePinToggle}
                        className={`forum-icon-btn btn-pin ${post.is_pinned ? "pinned" : ""}`}
                        title={post.is_pinned ? "Unpin post" : "Pin post to top"}
                        aria-label="Pin post"
                      >
                        {post.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                      </button>
                    )}
                    {(isAuthor || isModerator) && (
                      <>
                        <button
                          onClick={handleEditPost}
                          className="forum-icon-btn btn-edit"
                          title="Edit question"
                          aria-label="Edit post"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="forum-icon-btn btn-delete"
                          title="Delete question"
                          aria-label="Delete post"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Question Title */}
                <h1 className="forum-post-title">
                  {post.title}
                </h1>

                {/* Question Body */}
                <div className="forum-markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
                </div>

                {/* Footer */}
                <div className="forum-post-footer">
                  <div className="forum-footer-stats">
                    <span className="forum-footer-stat-item">
                      <MessageSquare size={15} />
                      <span>{post.replies?.length || 0} {post.replies?.length === 1 ? "Reply" : "Replies"}</span>
                    </span>
                  </div>
                  <div className="forum-footer-actions">
                    <button type="button" onClick={handleShare} className="forum-footer-btn">
                      <Share2 size={13} />
                      Share Thread
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Replies Section */}
          <div className="forum-replies-section">
            <div className="forum-replies-header">
              <div className="forum-replies-title">
                <MessageSquare size={18} style={{ color: "var(--brand, #F21722)" }} />
                <span>Discussion & Answers</span>
                <span className="forum-count-badge">
                  {post.replies?.length || 0}
                </span>
              </div>
            </div>

            {replyTree.length > 0 ? (
              <div className="forum-replies-list">
                {replyTree.map((reply) => (
                  <ReplyNode key={reply.id} reply={reply} depth={0} />
                ))}
              </div>
            ) : (
              <div className="forum-empty-card">
                <div className="forum-empty-icon-wrap">
                  <Sparkles size={24} />
                </div>
                <h4 className="forum-empty-title">No replies yet</h4>
                <p className="forum-empty-desc">
                  Be the first to share an answer, solution, or insight to this discussion.
                </p>
              </div>
            )}
          </div>

          {/* Reply Form */}
          <div id="reply-form" className="forum-form-card">
            <form onSubmit={handleReply}>
              <div className="forum-form-header">
                <div className="forum-form-title">
                  {currentUser && <Avatar name={currentUser.name || "User"} size="xs" />}
                  <span>{replyingTo ? "Write your reply" : "Join the discussion"}</span>
                </div>
                <Badge variant="default" size="sm">
                  Markdown
                </Badge>
              </div>

              {replyingTo && (
                <div className="forum-replying-banner">
                  <span>Replying to <strong>@{replyingToAuthor || "user"}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyingToAuthor("");
                    }}
                    className="forum-replying-dismiss"
                    title="Cancel reply targeting"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <textarea
                ref={replyTextareaRef}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write your response... Use ``` for code snippets or format using markdown"
                rows={4}
                className="forum-textarea"
              />

              <div className="forum-editor-toolbar">
                <div className="forum-toolbar-tips">
                  <span>Quick format:</span>
                  <button type="button" onClick={() => insertFormatting("code")} className="forum-format-pill">
                    ```code```
                  </button>
                  <button type="button" onClick={() => insertFormatting("bold")} className="forum-format-pill">
                    **bold**
                  </button>
                  <button type="button" onClick={() => insertFormatting("italic")} className="forum-format-pill">
                    *italic*
                  </button>
                  <button type="button" onClick={() => insertFormatting("quote")} className="forum-format-pill">
                    &gt;quote
                  </button>
                </div>

                <div className="forum-form-actions-right">
                  {replyingTo && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyingToAuthor("");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submitting || !replyBody.trim()}
                  >
                    <Send size={14} style={{ marginRight: "6px" }} />
                    {submitting ? "Posting..." : "Post Reply"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right / Thread Sidebar Column */}
        <div className="forum-thread-side">
          {/* Thread Overview Card */}
          <div className="forum-thread-sidebar-card">
            <div className="forum-thread-sidebar-header">
              <h3 className="forum-thread-sidebar-title">
                <Sparkles size={16} style={{ color: "var(--brand, #F21722)" }} />
                Thread Details
              </h3>
            </div>
            <div className="forum-thread-meta-list">
              <div className="forum-thread-meta-row">
                <span className="forum-thread-meta-label">Status</span>
                <span className="forum-thread-meta-val">
                  <span className="forum-pulse-dot" />
                  Active Discussion
                </span>
              </div>
              <div className="forum-thread-meta-row">
                <span className="forum-thread-meta-label">Category</span>
                <Badge variant="info">{post.course_tag}</Badge>
              </div>
              <div className="forum-thread-meta-row">
                <span className="forum-thread-meta-label">Asked</span>
                <span className="forum-thread-meta-val">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="forum-thread-meta-row">
                <span className="forum-thread-meta-label">Replies</span>
                <span className="forum-thread-meta-val">
                  {post.replies?.length || 0}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              style={{ width: "100%" }}
              onClick={scrollToReply}
            >
              <Send size={14} style={{ marginRight: "6px" }} />
              Write an Answer
            </Button>
          </div>

          {/* Related / Other Discussions Card */}
          {relatedPosts.length > 0 && (
            <div className="forum-thread-sidebar-card">
              <div className="forum-thread-sidebar-header">
                <h3 className="forum-thread-sidebar-title">
                  <Layers size={16} style={{ color: "#60A5FA" }} />
                  Recent Discussions
                </h3>
              </div>
              <div className="forum-related-list">
                {relatedPosts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      navigate(`/forum/${item.id}`);
                    }}
                    className="forum-related-item"
                  >
                    <span className="forum-related-title">{item.title}</span>
                    <div className="forum-related-sub">
                      <span>{item.author_name}</span>
                      <span>·</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                        <MessageSquare size={11} /> {item.reply_count || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formatting Cheat-Sheet */}
          <div className="forum-thread-sidebar-card">
            <div className="forum-thread-sidebar-header">
              <h3 className="forum-thread-sidebar-title">
                <Code2 size={16} style={{ color: "#FBBF24" }} />
                Code & Markdown
              </h3>
            </div>
            <div className="forum-thread-meta-list" style={{ fontSize: "0.75rem", color: "#a3a3a3" }}>
              <div className="forum-thread-meta-row">
                <span>Code Block</span>
                <code style={{ color: "#ff6b72" }}>```cpp ... ```</code>
              </div>
              <div className="forum-thread-meta-row">
                <span>Inline Code</span>
                <code style={{ color: "#ff6b72" }}>`code`</code>
              </div>
              <div className="forum-thread-meta-row">
                <span>Bold Text</span>
                <code style={{ color: "#fbbf24" }}>**bold**</code>
              </div>
              <div className="forum-thread-meta-row">
                <span>Quote</span>
                <code style={{ color: "#60a5fa" }}>&gt; quote</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="forum-modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="forum-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="forum-modal-icon">
                <AlertTriangle size={24} />
              </div>
              <h3 className="forum-modal-title">Delete Discussion Post?</h3>
              <p className="forum-modal-desc">
                This action is permanent and cannot be undone. All replies and discussion threads attached to this post will also be removed.
              </p>
              <div className="forum-modal-actions">
                <Button size="sm" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="danger" onClick={handleDeletePost}>
                  Delete Post
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
