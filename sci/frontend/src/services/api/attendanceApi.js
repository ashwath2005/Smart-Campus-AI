import api from './client';
import { ENDPOINTS } from './endpoints';

export const attendanceApi = {
  getMyAttendance: () => api.get(ENDPOINTS.ATTENDANCE.BASE),
  getSummary: () => api.get(ENDPOINTS.ATTENDANCE.SUMMARY),
  getStudentAttendance: (studentId) => api.get(ENDPOINTS.ATTENDANCE.STUDENT(studentId)),
  markAttendance: (payload) => api.post(ENDPOINTS.ATTENDANCE.BASE, payload),
};

export default attendanceApi;
