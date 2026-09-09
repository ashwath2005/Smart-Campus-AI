import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, Bot, User, Maximize2, RefreshCw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './AICopilotWidget.css';

const CONTEXT_SUGGESTIONS = {
  '/dashboard': [
    'What classes do I have scheduled today?',
    'How is my overall attendance tracking?',
    'What are my highest priority assignments?'
  ],
  '/attendance': [
    'Am I at risk in any subject (<75%)?',
    'How many more classes can I miss safely?',
    'Explain the attendance policy.'
  ],
  '/timetable': [
    'When is my next lecture starting?',
    'What are my busiest lecture days this week?',
    'Are there any lab classes scheduled today?'
  ],
  '/assignments': [
    'Which assignments are due this week?',
    'Help me plan my study schedule for submissions.',
    'Draft a checklist for my pending lab report.'
  ],
  '/gate-pass': [
    'Recommend the best exit window without missing labs.',
    'What is the status of my recent gate pass request?',
    'How does guardian OTP verification work?'
  ],
  '/sgpa-predictor': [
    'How can I boost my SGPA to 8.5+?',
    'Which subject has the highest impact on my GPA?',
    'Create an exam preparation plan for CAT-2.'
  ],
  '/campus-pulse': [
    'Which campus buildings are most crowded right now?',
    'Is the central library currently at peak capacity?',
    'Explain what Campus Pulse activity score means.'
  ],
  '/faculty': [
    'Summarize my teaching schedule for today.',
    'Which students have knowledge decay alerts?',
    'Draft an announcement for the mid-term test.'
  ],
  '/admin': [
    'Summarize today’s campus operational health.',
    'Are there any critical timetable clashes pending?',
    'Give me an overview of student gate pass compliance.'
  ]
};

export const AICopilotWidget = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user ? user.name.split(' ')[0] : 'there'}! I am your Smart Campus AI Copilot. How can I assist you with your schedule, coursework, or campus services today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Keyboard shortcut Ctrl+J / Cmd+J to toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  if (!user) return null;

  const currentSuggestions = CONTEXT_SUGGESTIONS[location.pathname] || [
    'How can I use Smart Campus AI?',
    'Where do I find my schedule?',
    'Check my upcoming campus events.'
  ];

  const handleSend = async (textToSend) => {
    const queryText = typeof textToSend === 'string' ? textToSend : input;
    if (!queryText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const pageName = location.pathname.replace('/', '') || 'dashboard';
      const response = await api.post('/ai/chat', {
        question: queryText.trim(),
        conversation_id: `copilot_${user.id || 'guest'}`,
        context: {
          current_page: pageName,
          user_role: user.role,
          note: `The user is currently browsing the '${pageName}' page of the Smart Campus platform with role '${user.role}'. Keep responses concise, supportive, and formatted cleanly.`
        }
      });

      const aiReply = response.data?.reply || response.data?.answer || response.data?.response || response.data?.message || 'I have processed your campus inquiry.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiReply
        }
      ]);
    } catch (err) {
      // Graceful fallback for offline / mock resilience
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Here is information regarding your query: Currently monitoring active campus modules for ${user.role} on ${location.pathname}. For detailed generation tasks, visit the full AI Intelligence Studio.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (location.pathname === '/dashboard') {
    return null;
  }

  return (
    <div className="ai-copilot-root">
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen(true)}
            className="ai-copilot-trigger-btn"
            title="Open Smart Campus Copilot (Ctrl+J)"
          >
            <div className="ai-copilot-pulse-ring" />
            <Sparkles size={20} className="ai-copilot-sparkle-icon" />
            <span className="ai-copilot-trigger-text">AI Copilot</span>
            <span className="ai-copilot-shortcut-kbd">⌃J</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-Up Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="ai-copilot-panel"
          >
            {/* Header */}
            <div className="ai-copilot-header">
              <div className="ai-copilot-header-left">
                <div className="ai-copilot-avatar">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="ai-copilot-title-row">
                    <span className="ai-copilot-title">Campus Copilot</span>
                    <span className="ai-copilot-badge">Gemini</span>
                  </div>
                  <span className="ai-copilot-status">● Real-time Assistant</span>
                </div>
              </div>

              <div className="ai-copilot-header-actions">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/ai-assistant');
                  }}
                  className="ai-copilot-action-btn"
                  title="Open Full AI Studio"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="ai-copilot-action-btn"
                  title="Minimize (Ctrl+J)"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Context Notice */}
            <div className="ai-copilot-context-bar">
              <span className="ai-copilot-context-dot" />
              <span>Context: <strong>{location.pathname}</strong></span>
            </div>

            {/* Messages Thread */}
            <div className="ai-copilot-messages-container custom-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`ai-copilot-message-row ${
                    msg.role === 'user' ? 'ai-copilot-row-user' : 'ai-copilot-row-ai'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="ai-copilot-msg-avatar ai-avatar">
                      <Sparkles size={12} />
                    </div>
                  )}
                  <div
                    className={`ai-copilot-bubble ${
                      msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-ai'
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="ai-copilot-msg-avatar user-avatar">
                      <User size={12} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="ai-copilot-message-row ai-copilot-row-ai">
                  <div className="ai-copilot-msg-avatar ai-avatar">
                    <Sparkles size={12} />
                  </div>
                  <div className="ai-copilot-bubble ai-bubble-ai ai-copilot-typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Context Suggestions Chips */}
            <div className="ai-copilot-chips-row scrollbar-none">
              {currentSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(suggestion)}
                  disabled={loading}
                  className="ai-copilot-chip"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="ai-copilot-input-form"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about schedule, gate pass, GPA..."
                className="ai-copilot-input"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="ai-copilot-send-btn"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
