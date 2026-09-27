import api from './client';
import { ENDPOINTS } from './endpoints';

export const placementApi = {
  getDrives: (params) => api.get(ENDPOINTS.PLACEMENTS.DRIVES, { params }),
  getCompanies: () => api.get(ENDPOINTS.PLACEMENTS.COMPANIES),
  applyForDrive: (driveId, payload) => api.post(ENDPOINTS.PLACEMENTS.APPLY(driveId), payload),
};

export default placementApi;
