import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach CSRF token from cookie to every mutating request
api.interceptors.request.use((config) => {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='));

  if (match) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(match.split('=')[1]);
  }
  return config;
});

// Only redirect on 401 if not already on an auth route
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = ['/api/login', '/api/register', '/api/user', '/sanctum/csrf-cookie'].some(
      (path) => error.config?.url?.includes(path)
    );
    if (error.response?.status === 401 && !isAuthRoute) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
