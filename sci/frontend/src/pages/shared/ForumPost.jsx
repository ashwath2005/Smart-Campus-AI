import "./ForumPost.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../../api/axios";
import { Card, Skeleton, Badge, Button } from "../../components/ui";
import { ArrowLeft, Pin, PinOff, Edit2, Trash2, MessageSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
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
  const map = /* @__PURE__ */ new Map();
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
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
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
  useEffect(() => {
    if (postId) fetchPost();
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
  const canModify = (authorId) => {
    return currentUser && (currentUser.id === authorId || isModerator);
  };
  const ReplyNode = ({
    reply,
    depth
  }) => {
    const isEditingThis = editingReplyId === reply.id;
    const isDeletingThis = deletingReplyId === reply.id;
    return <div className={`${depth > 0 ? "ml-6 border-l-2 border-slate-200 dark:border-slate-700 pl-4" : ""}`}><div className="pg-forumpost-1">{isEditingThis ? <div className="pg-forumpost-2"><textarea
      value={editReplyBody}
      onChange={(e) => setEditReplyBody(e.target.value)}
      rows={3}
      className="pg-forumpost-3"
    /><div className="pg-forumpost-4"><Button size="sm" variant="primary" onClick={handleSaveEditReply}>
                  Save
                </Button><Button size="sm" variant="secondary" onClick={() => setEditingReplyId(null)}>
                  Cancel
                </Button></div></div> : <><div className="pg-forumpost-5"><span className="pg-forumpost-6">{reply.author_name}</span><span className="pg-forumpost-7">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span></div><div className="pg-forumpost-8"><ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.body}</ReactMarkdown></div><div className="pg-forumpost-9"><button
      onClick={() => {
        setReplyingTo(reply.id);
        document.getElementById("reply-form")?.scrollIntoView({ behavior: "smooth" });
      }}
      className="pg-forumpost-10"
    >
                  Reply
                </button>{canModify(reply.author_id) && <><button
      onClick={() => handleEditReply(reply)}
      className="pg-forumpost-10"
    >
                      Edit
                    </button><button
      onClick={() => setDeletingReplyId(reply.id)}
      className="pg-forumpost-11"
    >
                      Delete
                    </button></>}</div>{
      /* Delete confirmation for reply */
    }{isDeletingThis && <div className="pg-forumpost-12"><p className="pg-forumpost-13">
                    Delete this reply?
                  </p><div className="pg-forumpost-4"><Button size="sm" variant="primary" onClick={() => handleDeleteReply(reply.id)}>
                      Delete
                    </Button><Button size="sm" variant="secondary" onClick={() => setDeletingReplyId(null)}>
                      Cancel
                    </Button></div></div>}</>}</div>{
      /* Nested children */
    }{reply.children.map((child) => <ReplyNode key={child.id} reply={child} depth={depth + 1} />)}</div>;
  };
  if (loading) {
    return <div className="pg-forumpost-14"><Skeleton variant="card" count={2} /></div>;
  }
  if (!post) return null;
  const replyTree = buildReplyTree(post.replies || []);
  return <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="pg-forumpost-15"
  >{
    /* Back button */
  }<button
    onClick={() => navigate("/forum")}
    className="pg-forumpost-16"
  ><ArrowLeft size={16} />
        Back to Forum
      </button>{
    /* Post Card */
  }<Card hoverGlow={false} className="pg-forumpost-17">{editingPost ? <div className="pg-forumpost-18"><input
    type="text"
    value={editTitle}
    onChange={(e) => setEditTitle(e.target.value)}
    className="pg-forumpost-19"
  /><textarea
    value={editBody}
    onChange={(e) => setEditBody(e.target.value)}
    rows={8}
    className="pg-forumpost-3"
  /><div className="pg-forumpost-4"><Button size="sm" variant="primary" onClick={handleSaveEditPost}>
                Save Changes
              </Button><Button size="sm" variant="secondary" onClick={() => setEditingPost(false)}>
                Cancel
              </Button></div></div> : <>{
    /* Header */
  }<div className="pg-forumpost-20"><div className="pg-forumpost-21">{post.is_pinned && <div className="pg-forumpost-22"><Pin size={14} className="pg-forumpost-23" /><span className="pg-forumpost-24">
                      Pinned
                    </span></div>}<h1 className="pg-forumpost-25">{post.title}</h1><div className="pg-forumpost-26"><span className="pg-forumpost-27">{post.author_name}</span><span>·</span><Badge variant="info">{post.course_tag}</Badge><span>·</span><span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span></div></div>{
    /* Action buttons */
  }<div className="pg-forumpost-28">{isModerator && <button
    onClick={handlePinToggle}
    className="pg-forumpost-29"
    title={post.is_pinned ? "Unpin post" : "Pin post"}
  >{post.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}</button>}{(isAuthor || isModerator) && <><button
    onClick={handleEditPost}
    className="pg-forumpost-30"
    title="Edit post"
  ><Edit2 size={16} /></button><button
    onClick={() => setShowDeleteConfirm(true)}
    className="pg-forumpost-31"
    title="Delete post"
  ><Trash2 size={16} /></button></>}</div></div>{
    /* Post body */
  }<div className="pg-forumpost-32"><ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown></div></>}</Card>{
    /* Delete confirmation */
  }{showDeleteConfirm && <div className="pg-forumpost-33"><motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="pg-forumpost-34"
  ><Trash2 size={32} className="pg-forumpost-35" /><h3 className="pg-forumpost-36">Delete Post?</h3><p className="pg-forumpost-37">
              This action cannot be undone. All replies will also be deleted.
            </p><div className="pg-forumpost-38"><Button size="sm" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button><Button size="sm" variant="primary" onClick={handleDeletePost}>
                Delete
              </Button></div></motion.div></div>}{
    /* Replies Section */
  }<div><div className="pg-forumpost-39"><MessageSquare size={18} className="pg-forumpost-40" /><h2 className="pg-forumpost-41">
            Replies ({post.replies?.length || 0})
          </h2></div>{replyTree.length > 0 ? <Card hoverGlow={false} className="pg-forumpost-42">{replyTree.map((reply) => <ReplyNode key={reply.id} reply={reply} depth={0} />)}</Card> : <Card hoverGlow={false} className="pg-forumpost-43">
            No replies yet. Be the first to respond!
          </Card>}</div>{
    /* Reply Form */
  }<div id="reply-form"><Card hoverGlow={false} className="pg-forumpost-44"><form onSubmit={handleReply} className="pg-forumpost-45">{replyingTo && <div className="pg-forumpost-46"><span>Replying to a comment</span><button
    type="button"
    onClick={() => setReplyingTo(null)}
    className="pg-forumpost-47"
  >
                ✕
              </button></div>}<textarea
    value={replyBody}
    onChange={(e) => setReplyBody(e.target.value)}
    placeholder="Write your reply... (Supports Markdown)"
    rows={4}
    className="pg-forumpost-48"
  /><div className="pg-forumpost-49"><Button type="submit" variant="primary" size="sm" disabled={submitting || !replyBody.trim()}><Send size={14} className="pg-forumpost-50" />{submitting ? "Posting..." : "Post Reply"}</Button></div></form></Card></div></motion.div>;
};
