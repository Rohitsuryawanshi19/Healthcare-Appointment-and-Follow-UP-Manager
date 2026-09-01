import api from './api';

export const calendarService = {
  // Get Google Calendar connection status
  async getStatus() {
    const res = await api.get('/calendar/status');
    return res.data;
  },

  // Get OAuth connect URL
  async getConnectUrl(returnTo) {
    const res = await api.get(`/calendar/connect?json=true${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`);
    return res.data;
  },

  // Disconnect Google Calendar
  async disconnect() {
    const res = await api.post('/calendar/disconnect');
    return res.data;
  },

  // Retry / sync appointment to Google Calendar
  async syncAppointment(appointmentId) {
    const res = await api.post(`/calendar/sync/${appointmentId}`);
    return res.data;
  },
};
