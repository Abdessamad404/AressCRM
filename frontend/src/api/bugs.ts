import api from './axios';
import type { Bug, BugFilters, BugFormData, PaginatedBugs } from '../types/bug';

export const bugsApi = {
  getAll: async (filters?: BugFilters): Promise<PaginatedBugs> => {
    const response = await api.get('/api/bugs', { params: filters });
    return response.data;
  },

  getOne: async (id: string): Promise<Bug> => {
    const response = await api.get(`/api/bugs/${id}`);
    return response.data.data;
  },

  create: async (data: BugFormData): Promise<Bug> => {
    const response = await api.post('/api/bugs', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<BugFormData>): Promise<Bug> => {
    const response = await api.put(`/api/bugs/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/bugs/${id}`);
  },
};
