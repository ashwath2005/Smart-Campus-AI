import api from '../../../api/axios';

export const campusPulseApi = {
  getCurrentPulse: async () => {
    const res = await api.get('/campus-pulse/current');
    return res.data;
  },

  getPulseHistory: async (timeframe = 'today') => {
    const res = await api.get(`/campus-pulse/history?timeframe=${timeframe}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  getPulseLocations: async () => {
    const res = await api.get('/campus-pulse/locations');
    return Array.isArray(res.data) ? res.data : [];
  },

  getPulseForecast: async () => {
    const res = await api.get('/campus-pulse/forecast');
    return Array.isArray(res.data) ? res.data : [];
  },

  getPulseInsights: async () => {
    const res = await api.get('/campus-pulse/insights');
    return res.data;
  },

  investigateBlock: async (blockId) => {
    const res = await api.get(`/campus-pulse/investigate/${blockId}`);
    return res.data;
  }
};
