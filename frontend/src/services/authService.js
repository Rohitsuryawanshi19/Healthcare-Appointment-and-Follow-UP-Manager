import api from './api';

export const authService = {
  // Register new patient
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  // Login user
  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  // Logout user
  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  // Get current user profile
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },
};
