import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// ── Attach JWT to every request ───────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }

    // Automatically set Content-Type to JSON for objects, but allow FormData to be auto-detected
    if (config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Global response interceptor ───────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    // Handle cases where status is 200 but backend sent success: false
    if (response.data && response.data.success === false) {
      toast.error(response.data.message || 'We encountered an issue. Please try again.');
    }
    return response;
  },
  (error) => {
    let message = 'An unexpected error occurred. Our team has been notified.';
    const status = error.response?.status;
    const backendMessage = error.response?.data?.message || error.response?.data?.error;

    if (backendMessage && typeof backendMessage === 'string') {
      message = backendMessage;
    } else {
      // Map common status codes to friendly messages if no backend message exists
      switch (status) {
        case 400:
          message = 'The request was invalid. Please check your input.';
          break;
        case 401:
          message = 'Your session has expired. Please log in again.';
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource could not be found.';
          break;
        case 422:
          message = 'We could not process your request. Please check the details and try again.';
          break;
        case 429:
          message = 'Too many requests. Please slow down and try again later.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          message = 'Our servers are currently busy or undergoing maintenance. Please try again in a few minutes.';
          break;
      }
    }

    if (error.code === 'ERR_NETWORK') {
      message = 'Connection lost. Please check your internet connection.';
    }

    // Don't show toast for 401 on /me check (initial load)
    const isAuthCheck = error.config?.url?.includes('/auth/me');
    if (status === 401) {
      localStorage.removeItem('user');
      if (!isAuthCheck) {
        toast.error(message);
      }
      // Redirect to login if not already on public pages
      if (!['/login', '/register', '/'].includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    } else {
      toast.error(message);
    }

    // Log error for developers only
    if (import.meta.env.MODE === 'development') {
      console.error(`[API Error] ${error.config?.url}:`, error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:      (data)   => api.post('/auth/register', data),
  login:         (data)   => api.post('/auth/login', data),
  getMe:         ()       => api.get('/auth/me'),
  // alias kept for backwards compat
  getProfile:    ()       => api.get('/auth/me'),
  updateProfile: (data)   => api.patch('/users/profile', data),
  uploadAvatar:  (formData) => api.post('/users/upload-avatar', formData),
};

// ── Doctors ───────────────────────────────────────────────────────────────────
export const doctorsAPI = {
  getAll:              (params)   => api.get('/doctors', { params }),
  getById:             (id)       => api.get(`/doctors/${id}`),
  getSpecializations:  ()         => api.get('/doctors/specializations'),
  updateProfile:       (data)     => api.patch('/doctors/profile', data),
  uploadAvatar:        (formData) => api.post('/doctors/upload-avatar', formData),
  getReviews:  (id, params) => api.get(`/reviews/${id}`, { params }),
  addReview:   (data)       => api.post('/reviews', data),
  deleteReview:(id)         => api.delete(`/reviews/${id}`),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsAPI = {
  create:       (data)          => api.post('/bookings', data),
  getAll:       (params)        => api.get('/bookings/my', { params }),   // ?status=&type=&page=
  getById:      (id)            => api.get(`/bookings/${id}`),
  getUpcoming:  ()              => api.get('/bookings/upcoming'),
  cancel:       (id, reason)    => api.put(`/bookings/${id}/cancel`, { reason }),
  updateStatus: (id, status)    => api.put(`/bookings/${id}/status`, { status }),
};

// ── Health Records / Medical Vault ────────────────────────────────────────────
export const healthRecordsAPI = {
  upload:  (formData) => api.post('/records/upload', formData),
  getAll:  (params) => api.get('/records/my', { params }),  // ?category=&search=&page=
  getById: (id)     => api.get(`/records/${id}`),
  update:  (id, data) => api.put(`/records/${id}`, data),
  delete:  (id)     => api.delete(`/records/${id}`),
  summarize: (id)   => api.post(`/records/${id}/summarize`),
};

// ── Lab Tests ─────────────────────────────────────────────────────────────────
export const labTestsAPI = {
  getAll:  (params) => api.get('/lab-tests', { params }),  // ?category=&search=&popular=
  getById: (id)     => api.get(`/lab-tests/${id}`),
  book:    (data)   => api.post('/lab-tests/book-test', data),
  updateBookingStatus: (id, status, reportUrl) =>
    api.patch(`/lab-tests/bookings/${id}/status`, { status, reportUrl }),
};

// ── Hospitals ─────────────────────────────────────────────────────────────────
export const hospitalsAPI = {
  getAll:    (params)   => api.get('/hospitals', { params }),
  getById:   (id)       => api.get(`/hospitals/${id}`),
  getNearby: (lat, lng) => api.get('/hospitals/nearby', { params: { lat, lng } }),
};

// ── Blood Bank ────────────────────────────────────────────────────────────────
export const bloodBankAPI = {
  getAll:     (params) => api.get('/bloodbanks', { params }),  // ?group=&city=
  getById:    (id)     => api.get(`/bloodbanks/${id}`),
  search:     (group)  => api.get('/bloodbanks/search', { params: { group } }),
  request:    (data)   => api.post('/bloodbanks/request', data),  // { bankId, bloodGroup, units, date }
};

// ── Ambulance ─────────────────────────────────────────────────────────────────
export const ambulanceAPI = {
  getNearby: (params) => api.get('/ambulances/nearby', { params }),
  book: (data) => api.post('/ambulances/book', data),
  getBooking: (id) => api.get(`/ambulances/booking/${id}`),
  respondToBooking: (id, data) => api.put(`/ambulances/booking/${id}/respond`, data),
  updateStatus: (id, data) => api.put(`/ambulances/booking/${id}/status`, data),
  getDriverCurrentTrip: () => api.get('/ambulances/driver/current-trip'),
  updateLocation: (data) => api.patch('/ambulances/location', data),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:       (params) => api.get('/notifications', { params }),  // ?read=false
  markRead:     (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead:  ()       => api.patch('/notifications/read-all'),
  delete:       (id)     => api.delete(`/notifications/${id}`),
};

// ── Providers ─────────────────────────────────────────────────────────────────
export const providerAPI = {
  apply:         (data) => api.post('/providers/apply', data),
  getProfile:    ()     => api.get('/providers/profile'),
  updateProfile: (data) => api.put('/providers/profile', data),
  getByType:     (type) => api.get(`/providers/${type}`),
  getById:       (type, id) => api.get(`/providers/${type}/${id}`),
};
export const providersAPI = providerAPI; // Alias for compatibility


// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  // Analytics
  getAnalytics:    ()           => api.get('/admin/analytics'),
  getAllBookings:   ()           => api.get('/admin/bookings'),

  // Doctors
  getAllDoctors:      (params)  => api.get('/admin/doctors', { params }),
  getPendingDoctors: ()         => api.get('/admin/doctors/pending'),
  getDoctorById:     (id)       => api.get(`/admin/doctors/${id}`),
  verifyDoctor:      (id)       => api.patch(`/admin/doctors/${id}/verify`),
  rejectDoctor:      (id, reason) => api.patch(`/admin/doctors/${id}/reject`, { reason }),
  suspendDoctor:     (id, reason) => api.patch(`/admin/doctors/${id}/suspend`, { reason }),
  activateDoctor:    (id)       => api.patch(`/admin/doctors/${id}/activate`),
  updateDoctor:      (id, data) => api.patch(`/admin/doctors/${id}`, data),

  // Users
  getAllUsers:  (params) => api.get('/admin/users', { params }),
  deleteUser:  (id)     => api.delete(`/admin/users/${id}`),

  // Generic providers (ambulance, bloodbank, lab)
  getAllProviders:  (params)        => api.get('/admin/providers', { params }),
  approveProvider: (type, id)       => api.patch(`/admin/providers/${type}/${id}/approve`),
  rejectProvider:  (type, id, reason) => api.patch(`/admin/providers/${type}/${id}/reject`, { reason }),
  suspendProvider: (type, id, reason) => api.patch(`/admin/providers/${type}/${id}/suspend`, { reason }),
  activateProvider: (type, id)       => api.patch(`/admin/providers/${type}/${id}/activate`),
  removeProviderRole: (type, id, reason) => api.delete(`/admin/providers/${type}/${id}`, { data: { reason } }),
};

// ── AI Symptom Checker ────────────────────────────────────────────────────────
export const aiAPI = {
  predict:        (data)     => api.post('/ai/predict', data),
  followUp:       (data)     => api.post('/ai/follow_up', data),
  normalizeInput: (data)     => api.post('/ai/normalize-input', data),
  analyzeReport:  (formData) => api.post('/ai/analyze-report', formData),
};

export default api;