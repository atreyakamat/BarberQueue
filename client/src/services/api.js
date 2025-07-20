import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  toggleAvailability: () => api.put('/auth/availability'),
};

// Users API
export const usersAPI = {
  getBarbers: (params = {}) => api.get('/users/barbers', { params }),
  getBarberDetails: (id) => api.get(`/users/barber/${id}`),
  getBarberSlots: (id, date) => api.get(`/users/barber/${id}/slots`, { params: { date } }),
  search: (params = {}) => api.get('/users/search', { params }),
  getDashboard: () => api.get('/users/dashboard'),
};

// Services API
export const servicesAPI = {
  getServices: (params = {}) => api.get('/services', { params }),
  getBarberServices: (barberId) => api.get(`/services/barber/${barberId}`),
  getCategories: () => api.get('/services/categories'),
  getPopularServices: () => api.get('/services/popular'),
  createService: (data) => api.post('/services', data),
  updateService: (id, data) => api.put(`/services/${id}`, data),
  deleteService: (id) => api.delete(`/services/${id}`),
};

// Bookings API
export const bookingsAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getMyBookings: (params = {}) => api.get('/bookings/my-bookings', { params }),
  getBarberBookings: (params = {}) => api.get('/bookings/barber-bookings', { params }),
  getBooking: (id) => api.get(`/bookings/${id}`),
  getBookingDetails: (id) => api.get(`/bookings/${id}`),
  updateBookingStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
  rescheduleBooking: (id, data) => api.put(`/bookings/${id}/reschedule`, data),
  getAvailableSlots: (params) => api.get('/bookings/available-slots', { params }),
  addReview: (id, data) => api.put(`/bookings/${id}/review`, data),
};

// Queue API
export const queueAPI = {
  getQueue: (barberId) => api.get(`/queue/${barberId}`),
  joinQueue: (data) => api.post('/queue/join', data),
  getQueuePosition: (bookingId) => api.get(`/queue/position/${bookingId}`),
  updateQueueStatus: (bookingId, status) => api.put(`/queue/update/${bookingId}`, { status }),
  removeFromQueue: (bookingId) => api.delete(`/queue/remove/${bookingId}`),
  getQueueStats: (barberId) => api.get(`/queue/stats/${barberId}`),
};

export default api;
export { api };
