import api from './api';

export const doctorService = {
  // Get doctor dashboard summary
  async getDashboard() {
    const res = await api.get('/doctor/dashboard');
    return res.data;
  },

  // Get appointments with filter
  async getAppointments(params = {}) {
    const res = await api.get('/doctor/appointments', { params });
    return res.data;
  },

  // Get single appointment
  async getAppointmentById(id) {
    const res = await api.get(`/doctor/appointments/${id}`);
    return res.data;
  },

  // Update appointment status
  async updateAppointmentStatus(id, status) {
    const res = await api.patch(`/doctor/appointments/${id}/status`, { status });
    return res.data;
  },

  // Save clinical notes
  async saveDoctorNotes(id, doctorNotes) {
    const res = await api.put(`/doctor/appointments/${id}/notes`, { doctorNotes });
    return res.data;
  },

  // Save prescription
  async savePrescription(id, data) {
    const res = await api.post(`/doctor/appointments/${id}/prescription`, data);
    return res.data;
  },

  // Submit complete consultation (Clinical Notes, Diagnosis, Prescription, Follow-Up)
  async submitConsultation(id, data) {
    const res = await api.post(`/doctor/appointments/${id}/consultation`, data);
    return res.data;
  },

  // Get profile
  async getProfile() {
    const res = await api.get('/doctor/profile');
    return res.data;
  },

  // Update profile
  async updateProfile(data) {
    const res = await api.put('/doctor/profile', data);
    return res.data;
  },

  // Get schedule & leaves
  async getSchedule() {
    const res = await api.get('/doctor/schedule');
    return res.data;
  },

  // Update schedule
  async updateSchedule(data) {
    const res = await api.put('/doctor/schedule', data);
    return res.data;
  },

  // Add scheduled leave
  async addLeave(data) {
    const res = await api.post('/doctor/leaves', data);
    return res.data;
  },

  // Cancel scheduled leave
  async deleteLeave(id) {
    const res = await api.delete(`/doctor/leaves/${id}`);
    return res.data;
  },
};
