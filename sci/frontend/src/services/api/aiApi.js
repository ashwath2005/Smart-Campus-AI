import api from './client';
import { ENDPOINTS } from './endpoints';

export const aiApi = {
  chat: (message, context) => api.post(ENDPOINTS.AI.ASSISTANT, { message, context }),
  copilotQuery: (query) => api.post(ENDPOINTS.AI.COPILOT, { query }),
};

export default aiApi;
