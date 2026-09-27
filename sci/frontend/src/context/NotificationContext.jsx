import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(undefined);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Fetch count
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [token]);

  // Fetch list
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      // Recalculate unread count locally just to be in sync
      const count = res.data.filter((n) => !n.is_read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Actions
  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      // Re-fetch count in case we deleted an unread notification
      fetchUnreadCount();
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  }, [fetchUnreadCount]);

  const addNotification = useCallback((newNotif) => {
    setNotifications((prev) => {
      // Avoid duplicate entries
      if (prev.some((n) => n.id === newNotif.id)) return prev;
      return [newNotif, ...prev];
    });
    if (!newNotif.is_read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Fetch initial notifications and count on mount/login
  useEffect(() => {
    const isAuthPath = typeof window !== 'undefined' && 
      /^\/(login|register|forgot-password|reset-password)(\/|$)/.test(window.location.pathname);

    if (token && user && !isAuthPath) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [token, user, fetchNotifications, fetchUnreadCount]);

  // WebSocket connection management
  useEffect(() => {
    const isAuthPath = typeof window !== 'undefined' && 
      /^\/(login|register|forgot-password|reset-password)(\/|$)/.test(window.location.pathname);

    if (!token || !user || isAuthPath) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    reconnectAttemptsRef.current = 0;

    const connectWebSocket = () => {
      // If already connected or connecting, skip
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      if (reconnectAttemptsRef.current >= 4) {
        console.warn('Real-time notification service currently unreachable. Will retry on next user session.');
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsHost = apiBaseUrl.replace(/^https?:\/\//, '').split('/')[0];
      const wsUrl = `${wsProtocol}://${wsHost}/ws/notifications?token=${token}`;

      let ws;
      try {
        ws = new WebSocket(wsUrl);
      } catch (err) {
        console.warn('Unable to initiate WebSocket connection:', err.message);
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        console.log('Notification WebSocket connection established');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'notification' && message.data) {
            const notif = {
              ...message.data,
              is_read: false,
            };

            addNotification(notif);

            // Trigger beautiful real-time toast alert
            toast.custom(
              (t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } custom-toast-container`}
                >
                  <div className="custom-toast-body">
                    <div className="custom-toast-content">
                      <div className="custom-toast-icon-wrapper">
                        <span style={{ fontSize: '24px' }}>🔔</span>
                      </div>
                      <div className="custom-toast-info">
                        <p className="custom-toast-title">
                          {notif.title}
                        </p>
                        <p className="custom-toast-message">
                          {notif.message}
                        </p>
                        <div className="custom-toast-badge-container">
                          <span className={
                            notif.priority === 'emergency' || notif.priority === 'high'
                              ? 'custom-toast-badge-priority-high'
                              : 'custom-toast-badge-priority-normal'
                          }>
                            {notif.priority}
                          </span>
                          <span className="custom-toast-badge-category">
                            {notif.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="custom-toast-close-container">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="custom-toast-close-btn"
                    >
                      <svg style={{ height: '16px', width: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ),
              { duration: 6000 }
            );
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onclose = (e) => {
        // Do not reconnect on intentional close (1000) or auth rejection (4000-4003, 1008)
        if (e.code === 1000 || (e.code >= 4000 && e.code <= 4003) || e.code === 1008) {
          return;
        }

        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current <= 3 && token && user) {
          const delay = Math.min(15000, 3000 * reconnectAttemptsRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = () => {
        // Suppress noisy error logs; onclose handles backoff
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token, user, addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
