import api from './api';

export const adminService = {
  // Get dashboard statistics
  async getStats() {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  // Get doctors list with filters
  async getDoctors(params = {}) {
    const res = await api.get('/admin/doctors', { params });
    return res.data;
  },

  // Create new doctor
  async createDoctor(data) {
    const res = await api.post('/admin/doctors', data);
    return res.data;
  },

  // Get doctor details by ID
  async getDoctorById(id) {
    const res = await api.get(`/admin/doctors/${id}`);
    return res.data;
  },

  // Update doctor details
  async updateDoctor(id, data) {
    const res = await api.put(`/admin/doctors/${id}`, data);
    return res.data;
  },

  // Update doctor verification status (verified, rejected, pending)
  async updateDoctorVerification(id, status) {
    const res = await api.patch(`/admin/doctors/${id}/status`, { status });
    return res.data;
  },

  // Get all system appointments
  async getAppointments(params = {}) {
    const res = await api.get('/admin/appointments', { params });
    return res.data;
  },

  // Get all users
  async getUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  // Leave & Unavailability Management
  async getDoctorLeavePreview(id, date) {
    const res = await api.get(`/admin/doctors/${id}/leave-preview`, { params: { date } });
    return res.data;
  },

  async getDoctorLeaves(id) {
    const res = await api.get(`/admin/doctors/${id}/leaves`);
    return res.data;
  },

  async addDoctorLeave(id, data) {
    const res = await api.post(`/admin/doctors/${id}/leaves`, data);
    return res.data;
  },

  async removeDoctorLeave(id, leaveId) {
    const res = await api.delete(`/admin/doctors/${id}/leaves/${leaveId}`);
    return res.data;
  },
};
