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
};

// Slot APIs
export const slotAPI = {
  createSlot: (data) => api.post('/slots/create', data),
  getMySlots: () => api.get('/slots/staff'),
  updateSlot: (slotId, data) => api.put(`/slots/${slotId}`, data),
  deleteSlot: (slotId) => api.delete(`/slots/${slotId}`),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/send', data),
  getChatHistory: (userId) => api.get(`/chat/history/${userId}`),
  getChats: () => api.get('/chat/list'),
};

// Material APIs
export const materialAPI = {
  uploadMaterial: (data) => api.post('/materials/upload', data),
  getAllMaterials: () => api.get('/materials'),
  getMyMaterials: () => api.get('/materials/staff'),
  updateMaterial: (materialId, data) => api.put(`/materials/${materialId}`, data),
  deleteMaterial: (materialId) => api.delete(`/materials/${materialId}`),
};

export default api;
