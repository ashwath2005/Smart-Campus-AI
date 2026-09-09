import "./AIAssistant.css";
import React, { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import { Card, Button, Input, Badge, Skeleton, Textarea } from "../../components/ui";
import {
  Send,
  Sparkles,
  BookOpen,
  FileText,
  CheckCircle,
  Award,
  Brain,
  Plus,
  Briefcase,
  MessageSquare,
  Trash2,
  Paperclip,
  CheckCheck,
  Play,
  Square,
  XCircle,
  Video,
  Clock,
  BarChart2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export const AIAssistant = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState("default-session");
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Other AI Features states
  const [plannerSubject, setPlannerSubject] = useState("");
  const [plannerTopics, setPlannerTopics] = useState("");
  const [plannerDays, setPlannerDays] = useState(5);
  const [plannerHours, setPlannerHours] = useState(2);
  const [plannerResult, setPlannerResult] = useState(null);
  const [plannerLoading, setPlannerLoading] = useState(false);

  // Study timer and stats states
  const [studyStats, setStudyStats] = useState(null);
  const [activeSessionDay, setActiveSessionDay] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerIntervalId, setTimerIntervalId] = useState(null);

  const fetchStudyStats = async () => {
    try {
      const res = await api.get("/ai/study-session/stats");
      setStudyStats(res.data);
    } catch {
      // ignore
    }
  };

  const [roadmapHistory, setRoadmapHistory] = useState([]);

  const fetchRoadmapHistory = async () => {
    try {
      const res = await api.get("/ai/study-plans");
      setRoadmapHistory(res.data);
    } catch {
      // ignore
    }
  };

  const fetchActiveRoadmap = async () => {
    try {
      const res = await api.get("/ai/study-plans/active");
      if (res.data && res.data.plan) {
        setPlannerResult({
          id: res.data.id,
          subject: res.data.subject,
          topic: res.data.topics,
          days: res.data.days,
          plan: res.data.plan.plan
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeTab === "planner") {
      fetchStudyStats();
      fetchRoadmapHistory();
      fetchActiveRoadmap();
    }
  }, [activeTab]);

  const handleLoadRoadmap = async (planId) => {
    try {
      const res = await api.put(`/ai/study-plans/${planId}/activate`);
      if (res.data.status === "success") {
        const activePlan = res.data.plan;
        setPlannerResult({
          id: activePlan.id,
          subject: activePlan.subject,
          topic: activePlan.topics,
          days: activePlan.days,
          plan: activePlan.plan.plan
        });
        fetchRoadmapHistory();
        toast.success(`Resumed roadmap: ${activePlan.subject}`);
      }
    } catch {
      toast.error("Failed to resume study plan");
    }
  };

  const handleDeleteRoadmap = async (planId) => {
    try {
      await api.delete(`/ai/study-plans/${planId}`);
      toast.success("Study plan deleted");
      fetchRoadmapHistory();
      if (plannerResult && plannerResult.id === planId) {
        setPlannerResult(null);
      }
    } catch {
      toast.error("Failed to delete study plan");
    }
  };

  const handleNewRoadmap = () => {
    setPlannerResult(null);
    setPlannerSubject("");
    setPlannerTopics("");
    setPlannerDays(5);
    toast.success("Ready to create a new study roadmap!");
  };

  const handleStartTimer = (dayItem) => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }
    setActiveSessionDay(dayItem);
    setTimerSeconds(0);
    
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    setTimerIntervalId(interval);
    toast.success(`Study timer started for Day ${dayItem.day}!`);
  };

  const handleStopTimer = async () => {
    if (!activeSessionDay || !timerIntervalId) return;
    
    clearInterval(timerIntervalId);
    setTimerIntervalId(null);
    
    const secondsWatched = timerSeconds;
    const dayItem = activeSessionDay;
    
    setActiveSessionDay(null);
    setTimerSeconds(0);

    try {
      if (plannerResult?.id) {
        // Calculate completion percentage based on checklist tasks checked
        let completionPercentage = 100.0;
        if (dayItem.tasks && dayItem.tasks.length > 0) {
          const completedCount = dayItem.tasks.filter(t => typeof t === 'object' && t !== null ? t.completed : false).length;
          completionPercentage = (completedCount / dayItem.tasks.length) * 100.0;
        }

        const res = await api.post(`/ai/study-plans/${plannerResult.id}/session-feedback`, {
          day: dayItem.day,
          completion_percentage: completionPercentage,
          duration_seconds: secondsWatched
        });
        
        if (res.data.status === "success") {
          toast.success(`Study session saved! Workload adapted based on ${Math.round(completionPercentage)}% completion.`);
          // Load updated plan structure from response
          setPlannerResult({
            id: plannerResult.id,
            subject: plannerResult.subject,
            topic: plannerResult.topic,
            days: res.data.plan.days,
            plan: res.data.plan.plan
          });
          fetchStudyStats();
          fetchRoadmapHistory();
        }
      } else {
        await api.post("/ai/study-session", {
          subject: plannerSubject || "Self Study",
          topic: dayItem.title,
          day_number: dayItem.day,
          duration_seconds: secondsWatched,
          video_title: dayItem.youtube_search_query || dayItem.title
        });
        toast.success(`Logged study session: ${Math.floor(secondsWatched / 60)}m ${secondsWatched % 60}s!`);
        fetchStudyStats();
      }
    } catch {
      toast.error("Failed to log study session");
    }
  };

  const handleToggleTask = async (dayNumber, taskIdx, currentVal) => {
    if (!plannerResult?.id) return;
    try {
      const res = await api.put(`/ai/study-plans/${plannerResult.id}/toggle-task`, {
        day: dayNumber,
        task_index: taskIdx,
        completed: !currentVal
      });
      if (res.data.status === "success") {
        setPlannerResult({
          id: plannerResult.id,
          subject: plannerResult.subject,
          topic: plannerResult.topic,
          days: res.data.plan.days,
          plan: res.data.plan.plan
        });
        fetchRoadmapHistory();
      }
    } catch {
      toast.error("Failed to update task status");
    }
  };

  const handleCancelTimer = () => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
    setActiveSessionDay(null);
    setTimerSeconds(0);
    toast.error("Study timer cancelled");
  };

  // Clean interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, [timerIntervalId]);

  const [pdfFile, setPdfFile] = useState(null);
  const [summaryResult, setSummaryResult] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [quizFile, setQuizFile] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

  const [skills, setSkills] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [gapResult, setGapResult] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);

  // ICQEA Quiz States
  const [quizSubTab, setQuizSubTab] = useState("take");
  const [quizSubject, setQuizSubject] = useState("Data Structures");
  const [quizDiff, setQuizDiff] = useState("medium");
  const [quizTypes, setQuizTypes] = useState(["mcq", "true_false", "short"]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [gradeResult, setGradeResult] = useState(null);
  const [quizAnalytics, setQuizAnalytics] = useState(null);

  // DSEA Career & Skill Gap States
  const [dseaTarget, setDseaTarget] = useState("Software Engineer");
  const [dseaSkills, setDseaSkills] = useState(["Python", "SQL", "Git"]);
  const [dseaCgpa, setDseaCgpa] = useState(8.2);
  const [dseaPoints, setDseaPoints] = useState(450);
  const [dseaProjects, setDseaProjects] = useState([
    { title: "E-Commerce Database System", complexity: "medium" }
  ]);
  const [dseaCerts, setDseaCerts] = useState(["Oracle SQL Certified"]);
  const [dseaMetrics, setDseaMetrics] = useState(null);
  const [dseaLoading, setDseaLoading] = useState(false);

  const [newSkillText, setNewSkillText] = useState("");
  const [newCertText, setNewCertText] = useState("");
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjComp, setNewProjComp] = useState("medium");

  const fetchUploadedDocs = async () => {
    try {
      const res = await api.get("/quiz/documents");
      setUploadedDocs(res.data);
    } catch {
      // ignore
    }
  };

  const fetchQuizAnalytics = async () => {
    try {
      const res = await api.get("/quiz/analytics");
      setQuizAnalytics(res.data);
    } catch {
      // ignore
    }
  };

  const fetchDseaMetrics = async () => {
    try {
      const res = await api.get(`/learning-intelligence/career-roadmap?career_path=${dseaTarget}`);
      setDseaMetrics(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeTab === "quiz") {
      fetchUploadedDocs();
      fetchQuizAnalytics();
    } else if (activeTab === "placement") {
      fetchDseaMetrics();
    }
  }, [activeTab, quizSubTab, dseaTarget]);

  const handleQuizUpload = async (e) => {
    e.preventDefault();
    if (!quizFile) return;
    setQuizLoading(true);
    const formData = new FormData();
    formData.append("file", quizFile);
    formData.append("subject", quizSubject);
    try {
      await api.post("/quiz/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Document uploaded and chunk indexed!");
      setQuizFile(null);
      fetchUploadedDocs();
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizGenerate = async (e) => {
    e.preventDefault();
    setQuizLoading(true);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizScore(null);
    setGradeResult(null);
    try {
      const res = await api.post("/quiz/generate", {
        subject: quizSubject,
        difficulty: quizDiff,
        question_types: quizTypes
      });
      setQuizQuestions(res.data.questions);
      setQuizId(res.data.quiz_id);
      toast.success("Adaptive quiz compiled!");
    } catch {
      toast.error("Failed to generate quiz locally");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizSubmitAnswer = async () => {
    setQuizLoading(true);
    try {
      const res = await api.post(`/quiz/submit/${quizId}`, {
        answers: quizAnswers,
        time_spent_seconds: 180
      });
      setQuizScore(res.data.score);
      setGradeResult(res.data);
      toast.success("Quiz submitted successfully!");
      fetchQuizAnalytics();
    } catch {
      toast.error("Failed to submit quiz answers");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleDseaAnalyze = async (e) => {
    e.preventDefault();
    setDseaLoading(true);
    setDseaMetrics(null);
    try {
      const res = await api.post("/learning-intelligence/update-skills", {
        skills: dseaSkills,
        coding_points: dseaPoints,
        projects: dseaProjects,
        certifications: dseaCerts,
        career_path: dseaTarget,
        cgpa: parseFloat(dseaCgpa)
      });
      setDseaMetrics(res.data);
      toast.success("Skill profile evolved!");
    } catch {
      toast.error("Failed to analyze skills");
    } finally {
      setDseaLoading(false);
    }
  };


  const fetchConversations = async () => {
    try {
      const res = await api.get("/ai/chat-history");
      setConversations(res.data);
      if (res.data.length > 0 && activeConvId === "default-session") {
        setActiveConvId(res.data[0].id);
      }
    } catch {
      // ignore
    }
  };

  const loadActiveConversation = async (convId) => {
    try {
      setMessages([]);
      const res = await api.get(`/ai/chat-history?conversation_id=${convId}`);
      if (res.data.length > 0) {
        setMessages(
          res.data.map((m) => ({
            id: String(m.id),
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || new Date().toISOString()
          }))
        );
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeTab === "chat") {
      fetchConversations();
      loadActiveConversation(activeConvId);
    }
  }, [activeTab, activeConvId]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChatSend = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        question: userMsg.content,
        conversation_id: activeConvId
      });

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast.error("Failed to get response from AI");
    } finally {
      setChatLoading(false);
      fetchConversations();
    }
  };

  const handleDeleteChat = async () => {
    try {
      await api.delete(`/ai/chat-history/${activeConvId}`);
      setMessages([]);
      setActiveConvId("default-session");
      fetchConversations();
      toast.success("Conversation history deleted");
    } catch {
      toast.error("Failed to delete history");
    }
  };

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}`;
    setActiveConvId(newSessionId);
    setMessages([]);
    toast.success("Started a new chat session");
  };

  // Other AI submit methods (Study Plan, Summarize, Quiz, Placement)
  const handlePlannerSubmit = async (e) => {
    e.preventDefault();
    if (!plannerSubject || !plannerTopics) return;
    setPlannerLoading(true);
    setPlannerResult(null);
    try {
      const res = await api.post("/ai/study-plan", {
        subject: plannerSubject,
        topics: plannerTopics,
        days: plannerDays,
        available_hours: plannerHours
      });
      toast.success("Study plan generated!");
      setPlannerSubject("");
      setPlannerTopics("");
      setPlannerDays(5);
      setPlannerHours(2);
      await fetchRoadmapHistory();
      await fetchActiveRoadmap();
    } catch {
      toast.error("Failed to generate study plan");
    } finally {
      setPlannerLoading(false);
    }
  };

  const handleSummarizerSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) return;
    setSummaryLoading(true);
    setSummaryResult(null);
    const formData = new FormData();
    formData.append("file", pdfFile);
    try {
      const res = await api.post("/ai/summarize", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSummaryResult(res.data);
      toast.success("Summary generated!");
    } catch {
      toast.error("Failed to summarize PDF");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!quizFile) return;
    setQuizLoading(true);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizScore(null);
    const formData = new FormData();
    formData.append("file", quizFile);
    try {
      const res = await api.post("/ai/quiz", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setQuizQuestions(res.data.questions);
      toast.success("Quiz generated!");
    } catch {
      toast.error("Failed to generate quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizGrade = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      const correctOptionLetter = q.answer.trim().charAt(0).toUpperCase();
      const userSelected = quizAnswers[idx];
      if (userSelected && userSelected.charAt(0).toUpperCase() === correctOptionLetter) {
        score++;
      }
    });
    setQuizScore(score);
  };

  const handleGapSubmit = async (e) => {
    e.preventDefault();
    if (!skills || !targetRole) return;
    setGapLoading(true);
    setGapResult(null);
    try {
      const res = await api.post("/ai/skill-gap", {
        skills,
        target_role: targetRole
      });
      setGapResult(res.data);
      toast.success("Analysis completed!");
    } catch {
      toast.error("Failed to complete gap analysis");
    } finally {
      setGapLoading(false);
    }
  };

  const aiTabs = [
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "planner", label: "Study Planner", icon: BookOpen },
    { id: "summarizer", label: "Summarizer", icon: FileText },
    { id: "quiz", label: "Quiz Gen", icon: Award },
    { id: "placement", label: "Placement AI", icon: Briefcase }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="ai-assistant-container"
    >
      {/* Title Header */}
      <div className="ai-assistant-header">
        <div className="ai-title-row">
          <Sparkles className="ai-sparkles-icon" />
          <h2 className="ai-assistant-title">Campus AI Assistant</h2>
        </div>
        <p className="ai-assistant-subtitle">
          Intelligent assistant for study roadmaps, notes summary, revision quiz, and career tools
        </p>
      </div>

      {/* Capsule Tab Navigation */}
      <div className="ai-capsule-navigation">
        <div className="ai-capsule-wrapper">
          {aiTabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`ai-nav-capsule-btn ${isActive ? "active" : ""}`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="ai-panel-content">
        {activeTab === "chat" && (
          <div className="ai-chat-layout">
            {/* Sidebar with conversations */}
            <div className="ai-chat-sidebar">
              <div className="sidebar-header-row">
                <h3 className="sidebar-title">Chat History</h3>
                <button onClick={handleNewChat} className="btn-new-chat-icon" title="Start New Chat">
                  <Plus size={14} />
                </button>
              </div>

              {conversations.length > 0 ? (
                <div className="sidebar-sessions-list scrollbar-none">
                  {conversations.map((c) => {
                    const isActive = activeConvId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveConvId(c.id)}
                        className={`sidebar-session-item ${isActive ? "active" : ""}`}
                      >
                        {c.title}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="sidebar-empty-state">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-history-icon">
                    <path d="M14 18H34" stroke="#4a4c54" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M14 26H28" stroke="#4a4c54" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M8 12C8 9.79086 9.79086 8 12 8H36C38.2091 8 40 9.79086 40 12V30C40 32.2091 38.2091 34 36 34H18L10 40V34H8V12Z" stroke="#4a4c54" strokeWidth="3" strokeLinejoin="round"/>
                    <circle cx="33" cy="33" r="5" fill="#E31B23"/>
                  </svg>
                  <p className="empty-history-title">No history found</p>
                  <p className="empty-history-sub">Start a conversation with Campus AI Assistant.</p>
                </div>
              )}
            </div>

            {/* Chat Frame */}
            <div className="ai-chat-frame">
              {/* Message Feed */}
              <div className="chat-messages-feed scrollbar-none">
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`chat-msg-row ${isUser ? "user-row" : "bot-row"}`}
                      >
                        {!isUser && (
                          <div className="bot-avatar">
                            <Sparkles size={13} />
                          </div>
                        )}
                        <div className={`chat-message-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          <div className="message-meta-row">
                            <span className="msg-timestamp">{msg.timestamp}</span>
                            {isUser && <CheckCheck size={12} className="msg-checkmarks" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="chat-welcome-state">
                    <div className="bot-welcome-avatar">
                      <Sparkles size={24} />
                    </div>
                    <div className="welcome-chat-msg-box">
                      <p className="welcome-title">Hello! 👋</p>
                      <p className="welcome-text">
                        I'm your Campus AI Assistant. How can I help you today?
                      </p>
                      <p className="welcome-text">You can ask me about:</p>
                      <ul className="welcome-bullets">
                        <li>Study roadmap</li>
                        <li>Attendance insights</li>
                        <li>Exam preparation</li>
                        <li>Career guidance</li>
                        <li>And much more!</li>
                      </ul>
                    </div>
                  </div>
                )}
                {chatLoading && (
                  <div className="chat-msg-row bot-row">
                    <div className="bot-avatar">
                      <Sparkles size={13} />
                    </div>
                    <div className="chat-message-bubble bot-bubble loading-bubble">
                      <div className="loading-dot" style={{ animationDelay: "0ms" }} />
                      <div className="loading-dot" style={{ animationDelay: "150ms" }} />
                      <div className="loading-dot" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input panel */}
              <div className="chat-input-panel-wrapper">
                <textarea
                  placeholder="Type your campus question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  className="chat-textarea-field"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSend();
                    }
                  }}
                />
                <div className="chat-input-actions-bar">
                  <div className="left-actions-group">
                    <button className="chat-action-btn-circle" title="Attach file">
                      <Paperclip size={14} />
                    </button>
                    <button className="chat-action-btn-circle" title="AI options">
                      <Sparkles size={14} />
                    </button>
                  </div>
                  <div className="right-actions-group">
                    <span className="char-indicator">{chatInput.length}/1000</span>
                    <button
                      onClick={handleChatSend}
                      disabled={chatLoading || !chatInput.trim()}
                      className="chat-btn-send"
                    >
                      <span>Send</span>
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tab Panels styled similarly */}
        {activeTab === "planner" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
            <Card style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen size={24} style={{ color: '#E31B23' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>AI Study Planner & Roadmap Tracker</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                This feature dynamically generates daily study schedules based on your target syllabus. 
                It logs study sessions in real-time, monitors attention levels, and adapts upcoming workloads 
                using memory decay algorithms to ensure optimal concept retention.
              </p>
              <Badge variant="warning" style={{ alignSelf: 'flex-start' }}>Scheduled for Review 2 activation</Badge>
            </Card>
          </div>
        )}

        {activeTab === "summarizer" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
            <Card style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={24} style={{ color: '#E31B23' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>AI Document Summarizer & Concept Extractor</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                Allows students to upload course books, lecture slides, or study guide PDFs. 
                The AI parses the document chunks, indexes them locally, and generates structured, 
                high-yield summaries alongside core keyword glossaries to accelerate review sessions.
              </p>
              <Badge variant="warning" style={{ alignSelf: 'flex-start' }}>Scheduled for Review 2 activation</Badge>
            </Card>
          </div>
        )}

        {activeTab === "quiz" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
            <Card style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Award size={24} style={{ color: '#E31B23' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Adaptive Practice Quiz Gen</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                Auto-compiles mock tests (multiple-choice questions, true/false statements, and short-answer prompts) 
                extracted directly from uploaded documents. It dynamically grades submissions and feeds performance 
                metrics back to the CLPA vector to update student cognitive profiles.
              </p>
              <Badge variant="warning" style={{ alignSelf: 'flex-start' }}>Scheduled for Review 2 activation</Badge>
            </Card>
          </div>
        )}

        {activeTab === "placement" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
            <Card style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Briefcase size={24} style={{ color: '#E31B23' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Fuzzy Skill-Gap Placements Matcher</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                Evaluates student resume profiles against targeted job postings. Uses character-bigram Jaccard coefficients 
                to analyze spelling variants and synonyms, identifying missing prerequisite skills and recommending 
                corrective learning materials to align students with job requirements.
              </p>
              <Badge variant="warning" style={{ alignSelf: 'flex-start' }}>Scheduled for Review 2 activation</Badge>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
};
