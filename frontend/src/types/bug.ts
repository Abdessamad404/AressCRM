import type { User } from './auth';
import type { Lead } from './lead';

export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type BugPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Bug {
  id: string;
  title: string;
  description: string;
  status: BugStatus;
  priority: BugPriority;
  exception_class: string | null;
  stack_trace: string | null;
  url: string | null;
  http_method: string | null;
  user_agent: string | null;
  environment: string | null;
  occurrence_count: number;
  last_occurred_at: string | null;
  fingerprint: string | null;
  assigned_to: User | null;
  reported_by: User;
  related_lead: Lead | null;
  history?: BugHistory[];
  created_at: string;
  updated_at: string;
}

export interface BugHistory {
  id: string;
  bug_id: string;
  user: User | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface BugFormData {
  title: string;
  description: string;
  status?: BugStatus;
  priority?: BugPriority;
  assigned_to_id?: string;
  related_lead_id?: string;
  exception_class?: string;
  stack_trace?: string;
  url?: string;
  http_method?: string;
  user_agent?: string;
  environment?: string;
}

export interface BugFilters {
  search?: string;
  status?: BugStatus;
  priority?: BugPriority;
  assigned_to_id?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedBugs {
  data: Bug[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
