import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 handler
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

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getProfile:    () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/users/profile', data),
  uploadAvatar:  (formData) => api.post('/users/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Doctors ───────────────────────────────────────────────────────────────
export const doctorsAPI = {
  getAll:            (params) => api.get('/doctors', { params }),
  getById:           (id)     => api.get(`/doctors/${id}`),
  getSpecializations:()       => api.get('/doctors/specializations'),
  updateProfile:     (data)   => api.patch('/doctors/profile', data),
  uploadAvatar:      (formData) => api.post('/doctors/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Bookings ──────────────────────────────────────────────────────────────
export const bookingsAPI = {
  create:       (data)         => api.post('/bookings', data),
  getAll:       (params)       => api.get('/bookings/my', { params }),
  getById:      (id)           => api.get(`/bookings/${id}`),
  getUpcoming:  ()             => api.get('/bookings/upcoming'),
  cancel:       (id, reason)   => api.put(`/bookings/${id}/cancel`, { reason }),
  updateStatus: (id, status)   => api.put(`/bookings/${id}/status`, { status }),
};

// ── Health Records ────────────────────────────────────────────────────────
export const healthRecordsAPI = {
  upload:  (formData) => api.post('/health-records/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll:  (params) => api.get('/health-records/my', { params }),
  getById: (id)     => api.get(`/health-records/${id}`),
  update:  (id, data) => api.put(`/health-records/${id}`, data),
  delete:  (id)     => api.delete(`/health-records/${id}`),
};

// ── Lab Tests ─────────────────────────────────────────────────────────────
export const labTestsAPI = {
  getAll:  (params) => api.get('/lab-tests', { params }),
  getById: (id)     => api.get(`/lab-tests/${id}`),
  book:    (data)   => api.post('/lab-tests/book-test', data),
};

// ── Hospitals ─────────────────────────────────────────────────────────────
export const hospitalsAPI = {
  getAll:    (params)    => api.get('/hospitals', { params }),
  getNearby: (lat, lng)  => api.get('/hospitals/nearby', { params: { lat, lng } }),
};

// ── Ambulance ─────────────────────────────────────────────────────────────
export const ambulanceAPI = {
  getAll:  ()     => api.get('/ambulances'),
  request: (data) => api.post('/ambulances/request', data),
};

// ── Providers ─────────────────────────────────────────────────────────────
export const providersAPI = {
  apply:    (data)          => api.post('/providers/apply', data),
  getByType:(type, params)  => api.get(`/providers/${type}`, { params }),
  getById:  (type, id)      => api.get(`/providers/${type}/${id}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getAnalytics:    ()              => api.get('/admin/analytics'),
  getAllUsers:     (params)        => api.get('/admin/users', { params }),
  getAllDoctors:   (params)        => api.get('/admin/doctors', { params }),
  getPendingDoctors:()             => api.get('/admin/doctors/pending'),
  getDoctorById:   (id)            => api.get(`/admin/doctors/${id}`),
  getAllBookings:  ()              => api.get('/admin/bookings'),
  verifyDoctor:    (id)            => api.patch(`/admin/doctors/${id}/verify`),
  rejectDoctor:    (id, reason)    => api.patch(`/admin/doctors/${id}/reject`, { reason }),
  suspendDoctor:   (id, reason)    => api.patch(`/admin/doctors/${id}/suspend`, { reason }),
  activateDoctor:  (id)            => api.patch(`/admin/doctors/${id}/activate`),
  updateDoctor:    (id, data)      => api.patch(`/admin/doctors/${id}`, data),
  deleteUser:      (id)            => api.delete(`/admin/users/${id}`),
  
  // Generic Provider Verifications
  getAllProviders: (params)        => api.get('/admin/providers', { params }),
  approveProvider: (type, id)      => api.patch(`/admin/providers/${type}/${id}/approve`),
};

export default api;