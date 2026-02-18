import api from './axios';
import type { LoginCredentials, RegisterCredentials, User } from '../types/auth';

export const authApi = {
  /** Must be called before login to get CSRF cookie from Sanctum */
  getCsrfCookie: () => api.get('/sanctum/csrf-cookie'),

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
