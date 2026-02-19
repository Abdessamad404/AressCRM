import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { useAuth } from '../contexts/AuthContext';
import { Users, Bug, TrendingUp, Activity, ArrowUp, ArrowDown, Briefcase, FileText, MessageSquare, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatRelativeTime, LEAD_STATUS_COLORS } from '../utils/helpers';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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
  const bugStatusData  = Object.entries(stats?.bugs_by_status  ?? {}).map(([name, value]) => ({ name, value: value as number }));
  const clientStats    = stats?.client_stats ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your CRM activity</p>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads"     value={stats?.total_leads ?? 0}                        icon={<Users size={20} />}      color="bg-indigo-500"  trend={stats?.leads_trend ?? null} />
        <StatCard label="Conversion Rate" value={`${stats?.conversion_rate ?? 0}%`}             icon={<TrendingUp size={20} />} color="bg-emerald-500" trend={null} />
        <StatCard label="Total Bugs"      value={stats?.total_bugs ?? 0}                        icon={<Bug size={20} />}        color="bg-rose-500"    trend={stats?.bugs_trend != null ? -stats.bugs_trend : null} />
        <StatCard label="Open Bugs"       value={stats?.bugs_by_status?.['open'] ?? 0}          icon={<Activity size={20} />}   color="bg-amber-500"   trend={null} />
      </div>

      {/* Client Platform Stats (admin only) */}
      {isAdmin && clientStats && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Client Platform</h2>
            <Link to="/users" className="text-xs text-primary-600 hover:underline">View all users →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MiniStat label="Entreprises"    value={clientStats.total_entreprises} icon={<Building2 size={16} />}      color="text-violet-500" />
            <MiniStat label="Commercials"    value={clientStats.total_commercials} icon={<TrendingUp size={16} />}     color="text-emerald-500" />
            <MiniStat label="Job Offers"     value={clientStats.total_job_offers}  icon={<Briefcase size={16} />}      color="text-indigo-500" />
            <MiniStat label="Active Offers"  value={clientStats.active_job_offers} icon={<Briefcase size={16} />}      color="text-blue-500" />
            <MiniStat label="Submissions"    value={clientStats.total_submissions} icon={<FileText size={16} />}       color="text-amber-500" />
            <MiniStat label="Messages"       value={clientStats.total_messages}    icon={<MessageSquare size={16} />}  color="text-rose-500" />
          </div>
        </div>
      )}

      {/* Charts */}
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

function StatCard({ label, value, icon, color, trend }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; trend: number | null;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="card flex items-start gap-4">
      <div className={`${color} text-white p-2.5 rounded-xl flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {trend != null && (
          <p className={`text-xs flex items-center gap-0.5 mt-1 ${up ? 'text-emerald-600' : 'text-rose-500'}`}>
            {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {up ? '+' : ''}{trend}% this month
          </p>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon, color }: {
  label: string; value: number; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="card p-3 flex items-center gap-2">
      <span className={color}>{icon}</span>
      <div>
        <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
