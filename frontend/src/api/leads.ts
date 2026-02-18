import api from './axios';
import type { Lead, LeadFilters, LeadFormData, LeadStatus, PaginatedLeads } from '../types/lead';

export const leadsApi = {
  getAll: async (filters?: LeadFilters): Promise<PaginatedLeads> => {
    const response = await api.get('/api/leads', { params: filters });
    return response.data;
  },

  getOne: async (id: string): Promise<Lead> => {
    const response = await api.get(`/api/leads/${id}`);
    return response.data.data;
  },

  create: async (data: LeadFormData): Promise<Lead> => {
    const response = await api.post('/api/leads', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<LeadFormData>): Promise<Lead> => {
    const response = await api.put(`/api/leads/${id}`, data);
    return response.data.data;
  },

  updateStatus: async (id: string, status: LeadStatus): Promise<Lead> => {
    const response = await api.patch(`/api/leads/${id}/status`, { status });
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/leads/${id}`);
  },
};
