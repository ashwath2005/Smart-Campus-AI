import api from './client';
import { ENDPOINTS } from './endpoints';

export const notificationApi = {
  getNotifications: (params) => api.get(ENDPOINTS.NOTIFICATIONS.BASE, { params }),
  getUnreadCount: () => api.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT),
  markAsRead: (id) => api.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),
};

export default notificationApi;
