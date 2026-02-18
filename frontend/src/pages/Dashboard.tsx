import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';
import { Users, Bug, TrendingUp, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatRelativeTime, LEAD_STATUS_COLORS } from '../utils/helpers';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const leadStatusData = Object.entries(stats?.leads_by_status ?? {}).map(([name, value]) => ({ name, value: value as number }));
  const bugStatusData = Object.entries(stats?.bugs_by_status ?? {}).map(([name, value]) => ({ name, value: value as number }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your CRM activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={stats?.total_leads ?? 0} icon={<Users size={20} />} color="bg-indigo-500" trend="+12%" up />
        <StatCard label="Conversion Rate" value={`${stats?.conversion_rate ?? 0}%`} icon={<TrendingUp size={20} />} color="bg-emerald-500" trend="+3.1%" up />
        <StatCard label="Total Bugs" value={stats?.total_bugs ?? 0} icon={<Bug size={20} />} color="bg-rose-500" trend="-2" up={false} />
        <StatCard label="Open Bugs" value={stats?.bugs_by_status?.['open'] ?? 0} icon={<Activity size={20} />} color="bg-amber-500" trend="" up />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Leads by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadStatusData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {leadStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Bugs by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={bugStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                {bugStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Lead Pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats?.leads_by_status ?? {}).map(([status, count]) => (
            <span key={status} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${LEAD_STATUS_COLORS[status as keyof typeof LEAD_STATUS_COLORS] ?? 'bg-gray-100 text-gray-600'}`}>
              {status} <span className="font-bold">{count as number}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {(stats?.recent_activity ?? []).length === 0 && <p className="text-sm text-gray-400 py-2">No recent activity.</p>}
          {(stats?.recent_activity ?? []).map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 py-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'lead' ? 'bg-indigo-500' : 'bg-rose-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium">{item.user}</span>{' '}&mdash;{' '}
                  <span className="text-gray-500 dark:text-gray-400">{item.action}</span>{' on '}
                  <span className="font-medium">{item.subject}</span>
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{formatRelativeTime(item.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, trend, up }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; trend: string; up: boolean;
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`${color} text-white p-2.5 rounded-xl flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {trend && (
          <p className={`text-xs flex items-center gap-0.5 mt-1 ${up ? 'text-emerald-600' : 'text-rose-500'}`}>
            {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{trend} this month
          </p>
        )}
      </div>
    </div>
  );
}
