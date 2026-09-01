import api from './api';

export const appointmentService = {
  // Hold a slot for 5 minutes during booking checkout
  async holdSlot(data) {
    const res = await api.post('/appointments/hold', data);
    return res.data;
  },

  // Release a held slot
  async releaseHold(id) {
    const res = await api.post(`/appointments/${id}/release-hold`);
    return res.data;
  },

  // Confirm booking (from hold or direct)
  async createAppointment(data) {
    const res = await api.post('/appointments', data);
    return res.data;
  },

  // Cancel appointment (CONFIRMED -> CANCELLED)
  async cancelAppointment(id) {
    const res = await api.patch(`/appointments/${id}/cancel`);
    return res.data;
  },

  // Reschedule appointment (CONFIRMED -> RESCHEDULED, locks new slot)
  async rescheduleAppointment(id, data) {
    const res = await api.patch(`/appointments/${id}/reschedule`, data);
    return res.data;
  },

  // Get single appointment details for confirmation
  async getAppointmentById(id) {
    const res = await api.get(`/appointments/${id}`);
    return res.data;
  },
};
