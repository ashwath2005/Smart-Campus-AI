/**
 * Backward compatibility re-export bridge for Axios client.
 * Canonical location: src/services/api/client.js
 */
import api, { apiClient } from '../services/api/client';

export { apiClient };
export default api;
