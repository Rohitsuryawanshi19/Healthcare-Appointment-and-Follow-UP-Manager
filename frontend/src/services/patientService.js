import api from './api';

export const patientService = {
  // Get patient dashboard
  async getDashboard() {
    const res = await api.get('/patient/dashboard');
    return res.data;
  },

  // Search doctors directory with filters
  async getDoctors(params = {}) {
    const res = await api.get('/patient/doctors', { params });
    return res.data;
  },

  // Get doctor profile
  async getDoctorById(id) {
    const res = await api.get(`/patient/doctors/${id}`);
    return res.data;
  },

  // Get live doctor availability slots calculated by backend
  async getDoctorAvailability(doctorId, date) {
    const res = await api.get(`/doctors/${doctorId}/availability`, { params: { date } });
    return res.data;
  },

  // Get patient appointments
  async getAppointments(params = {}) {
    const res = await api.get('/patient/appointments', { params });
    return res.data;
  },

  // Get single appointment details
  async getAppointmentById(id) {
    const res = await api.get(`/patient/appointments/${id}`);
    return res.data;
  },

  // Get active medications & prescriptions
  async getMedications() {
    const res = await api.get('/patient/medications');
    return res.data;
  },

  // Get patient profile
  async getProfile() {
    const res = await api.get('/patient/profile');
    return res.data;
  },

  // Update patient profile
  async updateProfile(data) {
    const res = await api.put('/patient/profile', data);
    return res.data;
  },
};
