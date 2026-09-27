import api from './client';
import { ENDPOINTS } from './endpoints';

export const facultyApi = {
  getFacultyList: (params) => api.get(ENDPOINTS.FACULTY.BASE, { params }),
  getFacultyLocator: () => api.get(ENDPOINTS.FACULTY.LOCATOR),
  updateStatus: (status) => api.post(ENDPOINTS.FACULTY.STATUS, { status }),
};

export default facultyApi;
