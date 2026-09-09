import "./Assignments.css";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Card, Skeleton, Badge, Button, Modal, Input, Tabs } from "../../components/ui";
import { FileText, Calendar, BookOpen, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
export const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const fetchAssignments = async () => {
    try {
      const res = await api.get("/assignments/");
      setAssignments(res.data);
    } catch {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAssignments();
  }, []);
  const openSubmitModal = (assign) => {
    setSelectedAssignment(assign);
    setSubmitUrl("");
    setIsSubmitOpen(true);
  };
  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !submitUrl) return;
    setSubmitLoading(true);
    try {
      await api.post(`/assignments/${selectedAssignment.id}/submit`, {
        file_url: submitUrl
      });
      toast.success("Assignment submitted successfully!");
      setIsSubmitOpen(false);
      fetchAssignments();
    } catch (err) {
      toast.error(err.message || "Error submitting assignment");
    } finally {
      setSubmitLoading(false);
    }
  };
  const getStatus = (item) => item.status || (item.submitted ? "submitted" : "pending");

  const filtered = assignments.filter((item) => {
    const status = getStatus(item);
    if (activeTab === "pending") return status === "pending";
    if (activeTab === "submitted") return status === "submitted" || status === "graded";
    return true;
  });

  const pendingCount = assignments.filter((a) => getStatus(a) === "pending").length;
  const submittedCount = assignments.filter((a) => getStatus(a) === "submitted" || getStatus(a) === "graded").length;

  const assignmentTabs = [
    { id: "all", label: `All Assignments (${assignments.length})` },
    { id: "pending", label: `Pending (${pendingCount})` },
    { id: "submitted", label: `Submitted (${submittedCount})` }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="pg-assignments-1"
    >
      <div className="pg-assignments-2">
        <h2 className="pg-assignments-3">Academic Assignments</h2>
        <p className="pg-assignments-4">
          Upload and submit coursework, check deadlines and feedback grades
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="pg-assignments-5">
        <Tabs tabs={assignmentTabs} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="pg-assignments-6">
          <Skeleton variant="card" count={2} />
        </div>
      ) : filtered.length > 0 ? (
        <div className="pg-assignments-6">
          {filtered.map((item, idx) => {
            const status = getStatus(item);
            const isSubmitted = status === "submitted" || status === "graded";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03, type: "spring", stiffness: 350, damping: 25 }}
                className="pg-assignments-card-wrapper"
              >
                <Card className="pg-assignments-7">
                  <div className="pg-assignments-body">
                    <div className="pg-assignments-8">
                      <div className="pg-assignments-9">
                        <FileText size={16} className="pg-assignments-10" />
                        <h3 className="pg-assignments-11">{item.title}</h3>
                      </div>
                      <Badge variant={isSubmitted ? "success" : "warning"}>
                        {isSubmitted ? "Submitted" : "Pending"}
                      </Badge>
                    </div>
                    <span className="pg-assignments-12">{item.subject}</span>
                    <p className="pg-assignments-13">{item.description || "No instructions provided."}</p>
                  </div>
                  <div className="pg-assignments-14">
                    <div className="pg-assignments-15">
                      <Calendar size={13} />
                      <span>Due: {item.due_date}</span>
                    </div>
                    {!isSubmitted ? (
                      <Button variant="primary" size="sm" onClick={() => openSubmitModal(item)}>
                        Submit
                      </Button>
                    ) : (
                      <span className="pg-assignments-16">
                        <CheckCircle2 size={13} />
                        Submitted
                      </span>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="pg-assignments-17">
          <BookOpen size={36} className="pg-assignments-18" />
          <p className="pg-assignments-19">No assignments found matching this filter.</p>
        </Card>
      )}

      {/* Submit Modal */}
      <Modal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} title="Submit Assignment">
        <form onSubmit={handleAssignmentSubmit} className="pg-assignments-20">
          <p className="pg-assignments-21">
            Upload your solution file to a shared drive (e.g. Google Drive, OneDrive) or paste your Git repository link, and share the URL below:
          </p>
          <Input
            label="Submission URL"
            placeholder="https://drive.google.com/..."
            value={submitUrl}
            onChange={(e) => setSubmitUrl(e.target.value)}
            disabled={submitLoading}
            required
          />
          <Button type="submit" loading={submitLoading} className="pg-assignments-22">
            Submit Solution
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
};
