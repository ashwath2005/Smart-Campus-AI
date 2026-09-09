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
    if (token) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [token, fetchNotifications, fetchUnreadCount]);

  // WebSocket connection management
  useEffect(() => {
    if (!token) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    const connectWebSocket = () => {
      // Get base URL for WS from API base url
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsHost = apiBaseUrl.replace(/^https?:\/\//, '').split('/')[0];
      const wsUrl = `${wsProtocol}://${wsHost}/ws/notifications?token=${token}`;

      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection established');
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
        console.log('WebSocket closed:', e.code, e.reason);
        // Do not reconnect on auth errors (codes 4000-4003 or policy violation 1008)
        if (e.code >= 4000 && e.code <= 4003 || e.code === 1008) {
          console.warn('WebSocket authentication failed or unauthorized. Halting reconnect.');
          return;
        }
        // Only reconnect if token is still active (user hasn't logged out)
        if (token) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Reconnecting WebSocket...');
            connectWebSocket();
          }, 5000);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket encountered error:', err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token, addNotification]);

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
