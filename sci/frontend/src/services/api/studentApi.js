import api from './client';
import { ENDPOINTS } from './endpoints';

export const studentApi = {
  getProfile: (id) => api.get(ENDPOINTS.STUDENTS.PROFILE(id)),
  getResults: (params) => api.get(ENDPOINTS.STUDENTS.RESULTS, { params }),
  getInternalMarks: (params) => api.get(ENDPOINTS.STUDENTS.INTERNAL_MARKS, { params }),
  getWorkflows: () => api.get(ENDPOINTS.STUDENTS.WORKFLOWS),
  getAssignments: (params) => api.get(ENDPOINTS.ASSIGNMENTS.BASE, { params }),
  submitAssignment: (id, data) => api.post(ENDPOINTS.ASSIGNMENTS.SUBMIT(id), data),
  getStudyMaterials: (params) => api.get(ENDPOINTS.STUDY_MATERIALS.BASE, { params }),
};

export default studentApi;
