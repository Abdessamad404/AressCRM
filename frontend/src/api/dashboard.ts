import api from './axios';

export interface DashboardStats {
  total_leads: number;
  leads_by_status: Record<string, number>;
  conversion_rate: number;
  total_bugs: number;
  bugs_by_status: Record<string, number>;
  recent_activity: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type: 'lead' | 'bug';
  action: string;
  subject: string;
  user: string;
  created_at: string;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/api/dashboard/stats');
    return response.data.data;
  },
};
