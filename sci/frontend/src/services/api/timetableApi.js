import api from './client';
import { ENDPOINTS } from './endpoints';

export const timetableApi = {
  getTimetable: (params) => api.get(ENDPOINTS.TIMETABLE.BASE, { params }),
  getTodaySchedule: () => api.get(ENDPOINTS.TIMETABLE.TODAY),
  getSectionSchedule: (section) => api.get(ENDPOINTS.TIMETABLE.SECTION(section)),
  generateTimetable: (payload) => api.post(ENDPOINTS.TIMETABLE.GENERATE, payload),
};

export default timetableApi;
