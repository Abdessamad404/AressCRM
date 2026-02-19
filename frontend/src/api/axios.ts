import axios from 'axios';

// Render's `host` property gives bare hostname — ensure https:// is present
const rawApiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const BASE_URL = rawApiUrl.startsWith('http') ? rawApiUrl : `https://${rawApiUrl}`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach Bearer token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Only redirect on 401 if not already on an auth route
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = ['/api/login', '/api/register', '/api/user'].some(
      (path) => error.config?.url?.includes(path)
    );
    if (error.response?.status === 401 && !isAuthRoute) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
