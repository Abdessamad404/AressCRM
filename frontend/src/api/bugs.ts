import api from './axios';
import type { Bug, BugFilters, BugFormData, PaginatedBugs } from '../types/bug';

const flattenPagination = (res: any): PaginatedBugs => ({
  data: res.data,
  current_page: res.meta?.current_page ?? res.current_page,
  last_page: res.meta?.last_page ?? res.last_page,
  per_page: res.meta?.per_page ?? res.per_page,
  total: res.meta?.total ?? res.total,
});

export const bugsApi = {
  getAll: async (filters?: BugFilters): Promise<PaginatedBugs> => {
    const response = await api.get('/api/bugs', { params: filters });
    return flattenPagination(response.data);
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

  resolve: async (id: string): Promise<Bug> => {
    const response = await api.patch(`/api/bugs/${id}/resolve`);
    return response.data.data;
  },

  reportException: async (data: {
    title: string;
    description?: string;
    exception_class?: string;
    stack_trace?: string;
    url?: string;
    user_agent?: string;
    environment?: string;
  }): Promise<void> => {
    await api.post('/api/exceptions/report', data);
  },
};
