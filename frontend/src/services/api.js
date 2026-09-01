import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Crucial for sending and receiving HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for centralized error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject({ ...error, message, status: error.response?.status });
  }
);

export default api;
