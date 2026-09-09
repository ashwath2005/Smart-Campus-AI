import "./Forum.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Card, Skeleton, Badge, Button, SearchBar, Tabs } from "../../components/ui";
import { Pin, MessageSquare, Plus, X } from "lucide-react";
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
      setPosts(data.posts);
      setTotalPages(data.total_pages);
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
      toast.success("Post created successfully!");
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
    { id: "all", label: "All" },
    ...courseTags.map((tag) => ({ id: tag, label: tag }))
  ];
  const pinnedPosts = posts.filter((p) => p.is_pinned);
  const regularPosts = posts.filter((p) => !p.is_pinned);
  return <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="pg-forum-1"
  >{
    /* Header */
  }<div className="pg-forum-2"><div><h2 className="pg-forum-3">
            Discussion Forum
          </h2><p className="pg-forum-4">
            Ask questions, share knowledge, and discuss with your peers
          </p></div><Button variant="primary" size="sm" onClick={() => setShowCreateForm(true)}><Plus size={16} className="pg-forum-5" />
          New Post
        </Button></div>{
    /* Search + Filter */
  }<div className="pg-forum-6"><SearchBar
    value={search}
    onChange={setSearch}
    placeholder="Search posts..."
  />{courseTags.length > 0 && <Tabs tabs={tabs} activeTab={activeTag} onChange={handleTagChange} />}</div>{
    /* Posts List */
  }{loading ? <div className="pg-forum-6"><Skeleton variant="card" count={3} /></div> : posts.length > 0 ? <div className="pg-forum-7">{
    /* Pinned Posts */
  }{pinnedPosts.map((post, idx) => <motion.div
    key={post.id}
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: idx * 0.03  }}
  ><Card
    className="pg-forum-8"
    onClick={() => navigate(`/forum/${post.id}`)}
  ><div className="pg-forum-9"><div className="pg-forum-10"><div className="pg-forum-11"><Pin size={14} className="pg-forum-12" /><span className="pg-forum-13">
                        Pinned
                      </span></div><h3 className="pg-forum-14">{post.title}</h3><div className="pg-forum-15"><span>{post.author_name}</span><span>·</span><Badge variant="info">{post.course_tag}</Badge><span>·</span><span className="pg-forum-16"><MessageSquare size={12} />{post.reply_count}</span><span>·</span><span>{formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}</span></div></div></div></Card></motion.div>)}{
    /* Regular Posts */
  }{regularPosts.map((post, idx) => <motion.div
    key={post.id}
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: (pinnedPosts.length + idx) * 0.03  }}
  ><Card
    className="pg-forum-17"
    onClick={() => navigate(`/forum/${post.id}`)}
  ><div className="pg-forum-9"><div className="pg-forum-10"><h3 className="pg-forum-14">{post.title}</h3><div className="pg-forum-15"><span>{post.author_name}</span><span>·</span><Badge variant="info">{post.course_tag}</Badge><span>·</span><span className="pg-forum-16"><MessageSquare size={12} />{post.reply_count}</span><span>·</span><span>{formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}</span></div></div></div></Card></motion.div>)}</div> : <Card hoverGlow={false} className="pg-forum-18">
          No posts found. Be the first to start a discussion!
        </Card>}{
    /* Pagination */
  }{totalPages > 1 && <div className="pg-forum-19"><Button
    size="sm"
    variant="secondary"
    onClick={() => setPage((p) => Math.max(1, p - 1))}
    disabled={page <= 1}
  >
            Prev
          </Button><span className="pg-forum-20">
            Page {page} of {totalPages}</span><Button
    size="sm"
    variant="secondary"
    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
    disabled={page >= totalPages}
  >
            Next
          </Button></div>}{
    /* Create Post Modal */
  }{showCreateForm && <div className="pg-forum-21"><motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="pg-forum-22"
  ><div className="pg-forum-23"><h3 className="pg-forum-24">
                Create New Post
              </h3><button
    onClick={() => setShowCreateForm(false)}
    className="pg-forum-25"
  ><X size={20} /></button></div><form onSubmit={handleCreatePost} className="pg-forum-6"><div><label className="pg-forum-26">
                  Title
                </label><input
    type="text"
    value={newTitle}
    onChange={(e) => setNewTitle(e.target.value)}
    placeholder="Post title..."
    className="pg-forum-27"
  /></div><div><label className="pg-forum-26">
                  Body <span className="pg-forum-28">(Supports Markdown)</span></label><textarea
    value={newBody}
    onChange={(e) => setNewBody(e.target.value)}
    placeholder="Write your post content..."
    rows={6}
    className="pg-forum-29"
  /></div><div><label className="pg-forum-26">
                  Course Tag
                </label><input
    type="text"
    value={newCourseTag}
    onChange={(e) => setNewCourseTag(e.target.value)}
    placeholder="e.g., CS101, MATH201..."
    className="pg-forum-27"
  /></div><div className="pg-forum-30"><Button
    type="button"
    variant="secondary"
    size="sm"
    onClick={() => setShowCreateForm(false)}
  >
                  Cancel
                </Button><Button type="submit" variant="primary" size="sm" disabled={creating}>{creating ? "Creating..." : "Create Post"}</Button></div></form></motion.div></div>}</motion.div>;
};
