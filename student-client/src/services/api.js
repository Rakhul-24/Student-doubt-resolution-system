import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getAllStaff: () => api.get('/auth/staff'),
};

// Slot APIs
export const slotAPI = {
  getAvailableSlots: () => api.get('/slots/available'),
  getMySlots: () => api.get('/slots/my-slots'),
  bookSlot: (data) => api.post('/slots/book', data),
  cancelBooking: (slotId) => api.post(`/slots/${slotId}/cancel`),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/send', data),
  getChatHistory: (userId) => api.get(`/chat/history/${userId}`),
  getChats: () => api.get('/chat/list'),
};

// Material APIs
export const materialAPI = {
  getAllMaterials: () => api.get('/materials'),
  getStaffMaterials: () => api.get('/materials/staff'),
};

export default api;
