import api from './api';

export const aiService = {
  // Generate or refresh pre-visit triage summary
  async getPreVisitSummary(data) {
    const res = await api.post('/ai/pre-visit-summary', data);
    return res.data;
  },

  // Generate or refresh post-visit care plan summary
  async getPostVisitSummary(data) {
    const res = await api.post('/ai/post-visit-summary', data);
    return res.data;
  },
};
