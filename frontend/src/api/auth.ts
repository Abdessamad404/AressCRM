import axios from 'axios';
import api from './axios';
import type { LoginCredentials, RegisterCredentials, User } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const authApi = {
  /** Fetch CSRF cookie using a plain axios call (no interceptors) */
  getCsrfCookie: () =>
    axios.get(`${BASE_URL}/sanctum/csrf-cookie`, { withCredentials: true }),

  login: async (credentials: LoginCredentials): Promise<User> => {
    await authApi.getCsrfCookie();
    const response = await api.post('/api/login', credentials);
    return response.data.data;
  },

  register: async (credentials: RegisterCredentials): Promise<User> => {
    await authApi.getCsrfCookie();
    const response = await api.post('/api/register', credentials);
    return response.data.data;
  },

  logout: () => api.post('/api/logout'),

  getUser: async (): Promise<User> => {
    const response = await api.get('/api/user');
    return response.data.data;
  },
};
