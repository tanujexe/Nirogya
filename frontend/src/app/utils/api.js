import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Doctors API
export const doctorsAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getAvailability: (id, date) => api.get(`/doctors/${id}/availability`, { params: { date } }),
  getSpecializations: () => api.get('/doctors/specializations'),
};

// Bookings API
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  getUpcoming: () => api.get('/bookings/upcoming'),
  cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
};

// Health Records API
export const healthRecordsAPI = {
  upload: (formData) => api.post('/health-records', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params) => api.get('/health-records', { params }),
  getById: (id) => api.get(`/health-records/${id}`),
  update: (id, data) => api.put(`/health-records/${id}`, data),
  delete: (id) => api.delete(`/health-records/${id}`),
  getStats: () => api.get('/health-records/stats'),
};

// Lab Tests API
export const labTestsAPI = {
  getAll: (params) => api.get('/lab-tests', { params }),
  getById: (id) => api.get(`/lab-tests/${id}`),
  createBooking: (data) => api.post('/lab-tests/bookings', data),
  getBookings: (params) => api.get('/lab-tests/bookings', { params }),
  getBookingById: (id) => api.get(`/lab-tests/bookings/${id}`),
  cancelBooking: (id) => api.put(`/lab-tests/bookings/${id}/cancel`),
};

// Admin API
export const adminAPI = {
  getAllUsers: () => api.get('/auth/users'),
  getAllBookings: () => api.get('/bookings'),
  getAllDoctors: () => api.get('/doctors'),
};

export default api;