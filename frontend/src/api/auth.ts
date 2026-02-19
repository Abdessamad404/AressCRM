import api from './axios';
import type { LoginCredentials, RegisterCredentials, User } from '../types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await api.post('/api/login', credentials);
    const { token, ...user } = response.data.data;
    localStorage.setItem('auth_token', token);
    return user as User;
  },

  register: async (credentials: RegisterCredentials): Promise<User> => {
    const response = await api.post('/api/register', credentials);
    const { token, ...user } = response.data.data;
    localStorage.setItem('auth_token', token);
    return user as User;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/logout');
    localStorage.removeItem('auth_token');
  },

  getUser: async (): Promise<User> => {
    const response = await api.get('/api/user');
    return response.data.data;
  },
};
