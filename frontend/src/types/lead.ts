import type { User } from './auth';

export type LeadSource = 'LinkedIn' | 'Referral' | 'Cold call' | 'Website' | 'Other';
export type LeadStatus = 'New' | 'Contacted' | 'Interested' | 'Negotiation' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  source: LeadSource | null;
  status: LeadStatus;
  notes: string | null;
  created_by: User | null;
  history?: LeadHistory[];
  created_at: string;
  updated_at: string;
}

export interface LeadHistory {
  id: string;
  lead_id: string;
  user: User | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: LeadSource;
  status?: LeadStatus;
  notes?: string;
}

export interface LeadFilters {
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  sort_by?: 'name' | 'company' | 'status' | 'source' | 'created_at';
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface PaginatedLeads {
  data: Lead[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
