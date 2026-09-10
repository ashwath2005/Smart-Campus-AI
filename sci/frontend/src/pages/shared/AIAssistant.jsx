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
  BarChart2,
  ExternalLink
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

        {/* ─── TAB 2: STUDY PLANNER & ROADMAP ─────────────────────────────── */}
        {activeTab === "planner" && (
          <div className="ai-planner-layout">
            {/* Left Column: Form, Active Timer, Stats, and History */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="planner-config-card">
                <h3 className="planner-card-title">
                  <BookOpen size={16} />
                  <span>Configure Syllabus Roadmap</span>
                </h3>
                <form onSubmit={handlePlannerSubmit} className="planner-form">
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      Target Subject / Course
                    </label>
                    <Input
                      placeholder="e.g. Distributed Systems"
                      value={plannerSubject}
                      onChange={(e) => setPlannerSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      Core Topics / Syllabus Modules (comma-separated)
                    </label>
                    <Textarea
                      placeholder="e.g. Raft Consensus, MapReduce, Vector Clocks, Microservices"
                      value={plannerTopics}
                      onChange={(e) => setPlannerTopics(e.target.value)}
                      required
                      style={{ minHeight: "80px" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                        Duration (Days)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={plannerDays}
                        onChange={(e) => setPlannerDays(parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                        Hours / Day
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        step="0.5"
                        value={plannerHours}
                        onChange={(e) => setPlannerHours(parseFloat(e.target.value) || 1)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={plannerLoading || !plannerSubject.trim() || !plannerTopics.trim()}
                    className="planner-btn-submit"
                    style={{ marginTop: "8px" }}
                  >
                    {plannerLoading ? "Synthesizing Adaptive Plan..." : "Generate AI Study Plan"}
                  </button>
                </form>
              </div>

              {/* Active Stopwatch Widget (when a session timer is running) */}
              {activeSessionDay && (
                <div style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "rgba(227, 27, 35, 0.08)",
                  border: "1px solid rgba(227, 27, 35, 0.3)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#E31B23", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={14} /> LIVE STUDY SESSION
                    </span>
                    <Badge variant="danger">Day {activeSessionDay.day}</Badge>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {activeSessionDay.title}
                  </div>
                  <div style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    fontFamily: "monospace",
                    textAlign: "center",
                    padding: "8px 0"
                  }}>
                    {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:{String(timerSeconds % 60).padStart(2, "0")}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleStopTimer}
                      style={{ flex: 1 }}
                    >
                      <Square size={12} style={{ marginRight: "6px" }} /> Complete Session
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelTimer}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Study Stats Widget */}
              {studyStats && (
                <div style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                    <BarChart2 size={14} style={{ color: "#E31B23" }} />
                    Study Activity & Retention
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                    <div style={{ padding: "10px", borderRadius: "8px", background: "var(--bg-tertiary)" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Total Time</span>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                        {Math.floor((studyStats.total_seconds || 0) / 3600)}h {Math.floor(((studyStats.total_seconds || 0) % 3600) / 60)}m
                      </div>
                    </div>
                    <div style={{ padding: "10px", borderRadius: "8px", background: "var(--bg-tertiary)" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Sessions</span>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                        {studyStats.sessions_count || 0} completed
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Roadmaps History */}
              {roadmapHistory.length > 0 && (
                <div style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      Saved Roadmaps
                    </h4>
                    <button
                      onClick={handleNewRoadmap}
                      style={{ fontSize: "11px", color: "#E31B23", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      + New
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
                    {roadmapHistory.map((rh) => (
                      <div
                        key={rh.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: plannerResult?.id === rh.id ? "rgba(227, 27, 35, 0.08)" : "var(--bg-tertiary)",
                          border: plannerResult?.id === rh.id ? "1px solid rgba(227, 27, 35, 0.3)" : "1px solid transparent"
                        }}
                      >
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{rh.subject}</span>
                          <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>{rh.days} Days &bull; {rh.created_at?.split(" ")[0]}</span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
                          <button
                            onClick={() => handleLoadRoadmap(rh.id)}
                            style={{ padding: "3px 8px", fontSize: "11px", borderRadius: "4px", background: "#E31B23", color: "#fff", border: "none", cursor: "pointer" }}
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => handleDeleteRoadmap(rh.id)}
                            style={{ padding: "3px 6px", fontSize: "11px", borderRadius: "4px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "none", cursor: "pointer" }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Daily Breakdown Plan or Idle State */}
            <div className="planner-result-pane">
              {plannerLoading ? (
                <div className="planner-idle-card" style={{ gap: "16px" }}>
                  <div className="loading-bubble">
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                  </div>
                  <h4 className="idle-title">Compiling Adaptive Syllabus Roadmap...</h4>
                  <p className="idle-text">Analyzing concept dependencies and calibrating spaced repetition intervals.</p>
                </div>
              ) : plannerResult && plannerResult.plan && plannerResult.plan.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div className="results-header-row">
                    <div>
                      <h3 className="results-title">{plannerResult.subject}</h3>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                        {plannerResult.days}-Day Personalized Learning Path &bull; Interactive Checklists
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleNewRoadmap}>
                      <Plus size={12} style={{ marginRight: "4px" }} /> New Roadmap
                    </Button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "650px", overflowY: "auto", paddingRight: "4px" }}>
                    {plannerResult.plan.map((dayItem) => {
                      const isTimerRunningOnThisDay = activeSessionDay?.day === dayItem.day;
                      return (
                        <div key={dayItem.day} className="planner-day-card">
                          <div className="day-card-header">
                            <div>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#E31B23", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Day {dayItem.day}
                              </span>
                              <h4 className="day-title">{dayItem.title}</h4>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className="day-duration">{dayItem.duration || "2 hours"}</span>
                              {isTimerRunningOnThisDay ? (
                                <Badge variant="success">Timer Active</Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartTimer(dayItem)}
                                  style={{ padding: "4px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                                >
                                  <Play size={11} /> Start Timer
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Tasks Checklist */}
                          {dayItem.tasks && dayItem.tasks.length > 0 && (
                            <div className="day-tasks-list">
                              {dayItem.tasks.map((task, tIdx) => {
                                const taskText = typeof task === "object" && task !== null ? task.text : task;
                                const isDone = typeof task === "object" && task !== null ? task.completed : false;
                                return (
                                  <label
                                    key={tIdx}
                                    className="day-task-item"
                                    style={{
                                      cursor: "pointer",
                                      textDecoration: isDone ? "line-through" : "none",
                                      opacity: isDone ? 0.65 : 1
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={Boolean(isDone)}
                                      onChange={() => handleToggleTask(dayItem.day, tIdx, isDone)}
                                      style={{ accentColor: "#E31B23", cursor: "pointer", borderRadius: "4px" }}
                                    />
                                    <span>{taskText}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* YouTube Learning Link */}
                          {dayItem.youtube_search_query && (
                            <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                              <a
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(dayItem.youtube_search_query)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: "11.5px",
                                  color: "#E31B23",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  textDecoration: "none",
                                  fontWeight: 600
                                }}
                              >
                                <Video size={13} />
                                <span>Watch Video Tutorials: "{dayItem.youtube_search_query}"</span>
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="planner-idle-card">
                  <BookOpen size={48} style={{ color: "#4a4c54" }} />
                  <h4 className="idle-title">No Active Study Roadmap</h4>
                  <p className="idle-text">
                    Fill out the syllabus form on the left to dynamically generate a daily study schedule with spaced revision checklists.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: DOCUMENT SUMMARIZER ───────────────────────────────────── */}
        {activeTab === "summarizer" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
            {/* Upload Box & Action */}
            <div className="planner-config-card">
              <h3 className="planner-card-title">
                <FileText size={16} />
                <span>Upload Lecture Notes or Textbook PDF</span>
              </h3>
              
              <form onSubmit={handleSummarizerSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="pdf-upload-box">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files[0] || null)}
                    className="pdf-file-input"
                  />
                  <FileText size={36} className="pdf-upload-icon" />
                  {pdfFile ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10B981" }}>
                      <CheckCircle size={16} />
                      <span style={{ fontWeight: 600, fontSize: "13px" }}>{pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                        Click to browse or drag and drop your study PDF
                      </p>
                      <span className="pdf-upload-label">Supports lecture slides, textbook excerpts, and study notes (up to 20MB)</span>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    disabled={summaryLoading || !pdfFile}
                    style={{ minWidth: "160px" }}
                  >
                    {summaryLoading ? (
                      <span>Synthesizing Key Concepts...</span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Sparkles size={14} /> Summarize Document
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Results Section */}
            {summaryLoading && (
              <div className="planner-idle-card" style={{ padding: "40px" }}>
                <div className="loading-bubble" style={{ marginBottom: "12px" }}>
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
                <h4 className="idle-title">Parsing and Extracting High-Yield Content...</h4>
                <p className="idle-text">Synthesizing executive summary, key concepts, and revision questions.</p>
              </div>
            )}

            {summaryResult && !summaryLoading && (
              <div className="summary-results-container">
                {/* Executive Summary Card */}
                <div className="summary-section-card">
                  <h4 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Brain size={16} style={{ color: "#E31B23" }} />
                    Executive Summary & Core Takeaways
                  </h4>
                  <div className="section-content" style={{ whiteSpace: "pre-line" }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryResult.summary}</ReactMarkdown>
                  </div>
                </div>

                {/* Key Concepts Badges */}
                {summaryResult.key_concepts && summaryResult.key_concepts.length > 0 && (
                  <div className="summary-section-card">
                    <h4 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Sparkles size={16} style={{ color: "#f59e0b" }} />
                      Key Terminology & Essential Concepts
                    </h4>
                    <div className="concepts-list">
                      {summaryResult.key_concepts.map((concept, idx) => (
                        <Badge key={idx} variant="info" style={{ padding: "6px 12px", fontSize: "12px" }}>
                          {concept}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revision & Practice Questions */}
                {summaryResult.questions && summaryResult.questions.length > 0 && (
                  <div className="summary-section-card">
                    <h4 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Award size={16} style={{ color: "#10B981" }} />
                      High-Yield Practice Questions
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {summaryResult.questions.map((q, idx) => (
                        <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <span style={{ fontWeight: 700, color: "#E31B23", fontSize: "13px" }}>Q{idx + 1}.</span>
                          <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!summaryResult && !summaryLoading && (
              <div className="planner-idle-card">
                <FileText size={48} style={{ color: "#4a4c54" }} />
                <h4 className="idle-title">No Document Summarized Yet</h4>
                <p className="idle-text">Upload any course PDF above to immediately extract a high-yield summary, keywords, and practice questions.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: ADAPTIVE PRACTICE QUIZ ────────────────────────────────── */}
        {activeTab === "quiz" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
            {/* Quiz Generation Configuration */}
            <div className="planner-config-card">
              <h3 className="planner-card-title">
                <Award size={16} />
                <span>Generate Adaptive Practice Quiz</span>
              </h3>
              <form onSubmit={quizFile ? handleQuizSubmit : handleQuizGenerate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      Subject / Topic
                    </label>
                    <Input
                      placeholder="e.g. Operating Systems"
                      value={quizSubject}
                      onChange={(e) => setQuizSubject(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      Difficulty Level
                    </label>
                    <select
                      value={quizDiff}
                      onChange={(e) => setQuizDiff(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-color)",
                        fontSize: "13px"
                      }}
                    >
                      <option value="easy">Easy (Fundamentals)</option>
                      <option value="medium">Medium (Standard Exam)</option>
                      <option value="hard">Hard (Advanced Problem Solving)</option>
                    </select>
                  </div>
                </div>

                {/* Optional PDF File */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Or Upload PDF to Extract Questions From (Optional)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="file"
                      accept=".pdf"
                      id="quiz-file-input"
                      onChange={(e) => setQuizFile(e.target.files[0] || null)}
                      style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                    />
                    {quizFile && (
                      <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>
                        ✓ {quizFile.name}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    disabled={quizLoading || (!quizSubject.trim() && !quizFile)}
                    style={{ minWidth: "160px" }}
                  >
                    {quizLoading ? "Compiling 5 Questions..." : "Generate Quiz (5 MCQs)"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Quiz Questions Player */}
            {quizQuestions.length > 0 && (
              <div className="quiz-questions-list">
                {quizScore !== null && (
                  <div className="quiz-results-card" style={{ justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Award size={32} style={{ color: quizScore >= 4 ? "#10B981" : "#E31B23" }} />
                      <div>
                        <h4 className="score-title">
                          Score: {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                        </h4>
                        <p className="score-subtitle">
                          {quizScore === quizQuestions.length
                            ? "Flawless score! Concepts thoroughly retained."
                            : quizScore >= 3
                            ? "Solid performance! Review the answer explanations below."
                            : "Needs review. Check the solutions below to master these concepts."}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setQuizScore(null);
                        setQuizAnswers({});
                      }}
                    >
                      Retake Quiz
                    </Button>
                  </div>
                )}

                {quizQuestions.map((q, qIdx) => {
                  const userAns = quizAnswers[qIdx] || "";
                  const correctLetter = (q.answer || "").trim().charAt(0).toUpperCase();
                  const isGraded = quizScore !== null;
                  const isUserCorrect = isGraded && userAns.trim().charAt(0).toUpperCase() === correctLetter;

                  return (
                    <div key={qIdx} className="quiz-question-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#E31B23", textTransform: "uppercase" }}>
                          Question {qIdx + 1}
                        </span>
                        {isGraded && (
                          <span style={{ fontSize: "12px", fontWeight: 700, color: isUserCorrect ? "#10B981" : "#ef4444" }}>
                            {isUserCorrect ? "✓ Correct" : `❌ Correct: Option ${correctLetter}`}
                          </span>
                        )}
                      </div>
                      <h4 className="question-text">{q.question}</h4>

                      <div className="quiz-options-grid">
                        {q.options && q.options.map((opt, optIdx) => {
                          const optionLetter = String.fromCharCode(65 + optIdx);
                          const isSelected = userAns.startsWith(optionLetter);
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => {
                                if (quizScore === null) {
                                  setQuizAnswers({ ...quizAnswers, [qIdx]: opt });
                                }
                              }}
                              className={`quiz-option-btn ${isSelected ? "active" : ""}`}
                              style={{
                                cursor: quizScore !== null ? "default" : "pointer"
                              }}
                            >
                              <span className="option-letter">{optionLetter}</span>
                              <span style={{ flex: 1 }}>{opt.replace(/^[A-D][.:]\s*/, "")}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {quizScore === null && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      onClick={handleQuizGrade}
                      disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                      style={{ minWidth: "180px" }}
                    >
                      Submit & Grade Quiz
                    </Button>
                  </div>
                )}
              </div>
            )}

            {quizLoading && (
              <div className="planner-idle-card" style={{ padding: "40px" }}>
                <div className="loading-bubble" style={{ marginBottom: "12px" }}>
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
                <h4 className="idle-title">Compiling Adaptive Quiz Questions...</h4>
                <p className="idle-text">Generating questions and plausible distractors.</p>
              </div>
            )}

            {quizQuestions.length === 0 && !quizLoading && (
              <div className="planner-idle-card">
                <Award size={48} style={{ color: "#4a4c54" }} />
                <h4 className="idle-title">No Quiz Questions Generated</h4>
                <p className="idle-text">Enter a subject above or upload study material to generate an interactive 5-question mock quiz.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: PLACEMENT & SKILL-GAP AI ──────────────────────────────── */}
        {activeTab === "placement" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
            {/* Input Form */}
            <div className="planner-config-card">
              <h3 className="planner-card-title">
                <Briefcase size={16} />
                <span>Analyze Career Fit & Fuzzy Skill Gap</span>
              </h3>
              <form onSubmit={handleGapSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Target Career / Job Role
                  </label>
                  <Input
                    placeholder="e.g. Full Stack Developer, Data Scientist, DevOps Engineer, Cloud Architect"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Your Current Technical Skills (comma-separated)
                  </label>
                  <Textarea
                    placeholder="e.g. React, JavaScript, HTML, CSS, Git, Python, SQL"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    required
                    style={{ minHeight: "80px" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    disabled={gapLoading || !targetRole.trim() || !skills.trim()}
                    style={{ minWidth: "160px" }}
                  >
                    {gapLoading ? "Computing Jaccard Alignment..." : "Analyze Career Fit"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Gap Results Container */}
            {gapLoading && (
              <div className="planner-idle-card" style={{ padding: "40px" }}>
                <div className="loading-bubble" style={{ marginBottom: "12px" }}>
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
                <h4 className="idle-title">Analyzing Industry Skill Match...</h4>
                <p className="idle-text">Comparing candidate skill vectors with market recruitment specifications.</p>
              </div>
            )}

            {gapResult && !gapLoading && (
              <div className="gap-results-container">
                {/* Match Score Metric Card */}
                <div className="gap-metric-card" style={{ padding: "24px" }}>
                  <div>
                    <span className="metric-lbl">Target Role: {gapResult.targetRole || targetRole}</span>
                    <h3 style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>
                      Overall Skill Match
                    </h3>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: "32px",
                      fontWeight: 800,
                      color: (gapResult.matchPercentage || gapResult.match_percentage || 0) >= 70 ? "#10B981" : "#E31B23"
                    }}>
                      {gapResult.matchPercentage || gapResult.match_percentage || 0}%
                    </span>
                    <Badge variant={(gapResult.matchPercentage || gapResult.match_percentage || 0) >= 70 ? "success" : "warning"} style={{ display: "block", marginTop: "4px" }}>
                      {(gapResult.matchPercentage || gapResult.match_percentage || 0) >= 70 ? "Interview Ready" : "Targeted Upskilling Required"}
                    </Badge>
                  </div>
                </div>

                {/* Missing Skills (The Gap) */}
                {(gapResult.missingSkills || gapResult.missing_skills) && (gapResult.missingSkills || gapResult.missing_skills).length > 0 && (
                  <div className="summary-section-card">
                    <h4 className="section-title" style={{ color: "#E31B23", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Brain size={16} />
                      Identified Prerequisite Gaps (Missing Skills)
                    </h4>
                    <div className="concepts-list">
                      {(gapResult.missingSkills || gapResult.missing_skills).map((ms, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            background: "rgba(227, 27, 35, 0.12)",
                            color: "#E31B23",
                            fontSize: "12px",
                            fontWeight: 600,
                            border: "1px solid rgba(227, 27, 35, 0.25)"
                          }}
                        >
                          + {ms}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Resources */}
                {(gapResult.resources) && gapResult.resources.length > 0 && (
                  <div className="summary-section-card">
                    <h4 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <BookOpen size={16} style={{ color: "#f59e0b" }} />
                      Recommended Learning Resources & Courses
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {gapResult.resources.map((res, idx) => (
                        <li key={idx} style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          {res}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actionable Next Steps */}
                {(gapResult.nextSteps || gapResult.next_steps) && (gapResult.nextSteps || gapResult.next_steps).length > 0 && (
                  <div className="summary-section-card">
                    <h4 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Award size={16} style={{ color: "#10B981" }} />
                      Actionable Career Next Steps
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(gapResult.nextSteps || gapResult.next_steps).map((step, idx) => (
                        <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#10B981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: "13px", color: "var(--text-primary)", paddingTop: "1px" }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!gapResult && !gapLoading && (
              <div className="planner-idle-card">
                <Briefcase size={48} style={{ color: "#4a4c54" }} />
                <h4 className="idle-title">No Career Analysis Conducted</h4>
                <p className="idle-text">Enter your current technical skills and target job title above to evaluate recruitment alignment and missing prerequisites.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
