import "./Announcements.css";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, Skeleton, Badge, Button, Input, Textarea, Select } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { AlertTriangle, Plus, Volume2 } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
export const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [targetDept, setTargetDept] = useState("all");
  const [isEmergency, setIsEmergency] = useState(false);
  const fetchAnnouncements = async () => {
    try {
      const [genRes, emerRes] = await Promise.all([
        api.get("/announcements"),
        api.get("/announcements/emergency")
      ]);
      setAnnouncements(genRes.data);
      setEmergencies(emerRes.data);
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAnnouncements();
  }, []);
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      await api.post("/announcements", {
        title,
        content,
        target_role: targetRole,
        target_dept: targetDept,
        is_emergency: isEmergency
      });
      toast.success("Announcement posted successfully!");
      setTitle("");
      setContent("");
      setTargetRole("all");
      setTargetDept("all");
      setIsEmergency(false);
      setShowAddForm(false);
      fetchAnnouncements();
    } catch {
      toast.error("Failed to post announcement");
    }
  };
  const isFacultyOrAdmin = user?.role === "faculty" || user?.role === "admin";
  return <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="pg-announcements-1"
  ><div className="pg-announcements-2"><div><h2 className="pg-announcements-3">
            Campus Announcements
          </h2><p className="pg-announcements-4">
            Official notices, circulars and emergency broadcasts
          </p></div>{isFacultyOrAdmin && <Button
    variant="primary"
    size="sm"
    onClick={() => setShowAddForm(!showAddForm)}
    icon={<Plus size={16} />}
  >{showAddForm ? "Cancel" : "Post Notice"}</Button>}</div>{
    /* Add Announcement Form */
  }{showAddForm && <Card className="pg-announcements-5"><h3 className="pg-announcements-6">
            Post new announcement
          </h3><form onSubmit={handleCreate} className="pg-announcements-7"><Input
    label="Title"
    placeholder="e.g. End Semester Exam Fee Deadline Extended"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    required
  /><Textarea
    label="Content"
    rows={4}
    placeholder="Details of the announcement..."
    value={content}
    onChange={(e) => setContent(e.target.value)}
    required
  /><div className="pg-announcements-8"><Select
    label="Target Audience (Role)"
    options={[
      { value: "all", label: "All Users" },
      { value: "student", label: "Students" },
      { value: "faculty", label: "Faculty & Staff" }
    ]}
    value={targetRole}
    onChange={(e) => setTargetRole(e.target.value)}
  /><Select
    label="Target Department"
    options={[
      { value: "all", label: "All Departments" },
      { value: "CSE", label: "CSE Department" },
      { value: "ECE", label: "ECE Department" },
      { value: "ME", label: "ME Department" },
      { value: "CE", label: "CE Department" }
    ]}
    value={targetDept}
    onChange={(e) => setTargetDept(e.target.value)}
  /></div><div className="pg-announcements-9"><input
    type="checkbox"
    id="isEmergency"
    checked={isEmergency}
    onChange={(e) => setIsEmergency(e.target.checked)}
    className="pg-announcements-10"
  /><label htmlFor="isEmergency" className="pg-announcements-11">
                Mark as High Priority / Emergency Alert
              </label></div><Button type="submit">Publish</Button></form></Card>}{
    /* Emergency Alerts Section */
  }{emergencies.length > 0 && <div className="pg-announcements-12"><h3 className="pg-announcements-13"><AlertTriangle size={16} /> Urgent Emergency Alerts
          </h3>{emergencies.map((emer) => <Card
    key={emer.id}
    className="pg-announcements-14"
  ><div className="pg-announcements-15"><h4 className="pg-announcements-16">{emer.title}</h4><Badge variant="danger">Urgent</Badge></div><p className="pg-announcements-17">{emer.content}</p><span className="pg-announcements-18">
                Posted by: {emer.postedBy} • {emer.createdAt ? emer.createdAt.split(" ")[0] : ""}</span></Card>)}</div>}{
    /* General List */
  }<div className="pg-announcements-7"><h3 className="pg-announcements-19"><Volume2 size={16} /> Notice Board
        </h3>{loading ? <Skeleton variant="card" count={3} /> : announcements.length > 0 ? announcements.filter((a) => a.type !== "emergency").map((ann, idx) => <motion.div
    key={ann.id}
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: idx * 0.05  }}
  ><Card className="pg-announcements-20"><div className="pg-announcements-21"><h4 className="pg-announcements-22">{ann.title}</h4><div className="pg-announcements-23">{ann.targetRole && ann.targetRole !== "all" && <Badge variant="info" className="pg-announcements-24">{ann.targetRole}</Badge>}{ann.targetDept && ann.targetDept !== "all" && <Badge variant="info" className="pg-announcements-25">{ann.targetDept}</Badge>}<Badge variant={ann.priority === "high" ? "warning" : "default"} className="pg-announcements-25">{ann.priority || "general"}</Badge></div></div><p className="pg-announcements-26">{ann.content}</p><div className="pg-announcements-27"><span className="pg-announcements-28">Author: {ann.postedBy}</span><span>{ann.createdAt ? ann.createdAt.split(" ")[0] : ""}</span></div></Card></motion.div>) : <Card className="pg-announcements-29">Notice board is currently empty.</Card>}</div></motion.div>;
};
