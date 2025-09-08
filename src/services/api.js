import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instances
export const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const urlAPI = axios.create({
  baseURL: `${API_BASE_URL}/urls`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const statsAPI = axios.create({
  baseURL: `${API_BASE_URL}/stats`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response interceptor for error handling
const handleResponseError = (error) => {
  if (error.response?.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

// Add interceptors to all API instances
[authAPI, urlAPI, statsAPI].forEach(api => {
  api.interceptors.request.use(addAuthToken);
  api.interceptors.response.use(
    response => response,
    handleResponseError
  );
});

// URL API functions
export const urlService = {
  // Create short URL
  createShortUrl: (urlData) => urlAPI.post('/shorten', urlData),
  
  // Get user's URLs
  getMyUrls: (params) => urlAPI.get('/my-urls', { params }),
  
  // Get URL details
  getUrlDetails: (urlId) => urlAPI.get(`/${urlId}`),
  
  // Update URL
  updateUrl: (urlId, updateData) => urlAPI.put(`/${urlId}`, updateData),
  
  // Delete URL
  deleteUrl: (urlId) => urlAPI.delete(`/${urlId}`),
  
  // Bulk delete URLs
  bulkDeleteUrls: (urlIds) => urlAPI.delete('/bulk/delete', { data: { urlIds } }),
  
  // Get URL info (public)
  getUrlInfo: (shortCode) => axios.get(`${API_BASE_URL}/${shortCode}/info`),
};

// Statistics API functions
export const statsService = {
  // Get overview statistics
  getOverview: () => statsAPI.get('/overview'),
  
  // Get URL-specific statistics
  getUrlStats: (urlId) => statsAPI.get(`/url/${urlId}`),
  
  // Get real-time analytics
  getRealtimeStats: () => statsAPI.get('/realtime'),
};

// Auth API functions
export const authService = {
  // Login
  login: (credentials) => authAPI.post('/login', credentials),
  
  // Register
  register: (userData) => authAPI.post('/register', userData),
  
  // Get current user
  getCurrentUser: () => authAPI.get('/me'),
  
  // Update profile
  updateProfile: (profileData) => authAPI.put('/profile', profileData),
};

export default {
  authAPI,
  urlAPI,
  statsAPI,
  urlService,
  statsService,
  authService,
};
