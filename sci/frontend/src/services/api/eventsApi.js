import api from './client';
import { ENDPOINTS } from './endpoints';

export const eventsApi = {
  getEvents: (params) => api.get(ENDPOINTS.EVENTS.BASE, { params }),
  getUpcoming: () => api.get(ENDPOINTS.EVENTS.UPCOMING),
  getCalendar: (params) => api.get(ENDPOINTS.ACADEMIC.CALENDAR, { params }),
};

export default eventsApi;
