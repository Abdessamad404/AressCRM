import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, Search, User, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';

interface ActivityEntry {
  id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  lead_id: string;
  lead_name: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

interface Paginated {
  data: ActivityEntry[];
  current_page: number;
  last_page: number;
  total: number;
}

const ACTION_COLORS: Record<string, string> = {
  'Lead created':   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Status updated': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Notes updated':  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function actionBadge(action: string) {
  const cls = ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{action}</span>;
}

export default function ActivityIndex() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');

  // Admin: fetch user list for filter dropdown
  const { data: users } = useQuery({
    queryKey: ['users-list-activity'],
    queryFn: async () => { const r = await api.get('/api/users'); return r.data.data as { id: string; name: string; client_type: string | null }[]; },
    enabled: isAdmin,
  });

  const internalUsers = (users ?? []).filter(u => !u.client_type);

  const { data, isLoading } = useQuery({
    queryKey: ['activity', { page, search, userId }],
    queryFn: async (): Promise<Paginated> => {
      const params: Record<string, any> = { page, per_page: 20 };
      if (search)  params.action  = search;
      if (userId)  params.user_id = userId;
      const r = await api.get('/api/activity', { params });
      return r.data;
    },
  });

  const entries  = data?.data ?? [];
  const total    = data?.total ?? 0;
  const lastPage = data?.last_page ?? 1;
  const curPage  = data?.current_page ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isAdmin ? 'All team activity' : 'Your activity'} · {total} entries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filter by action..."
            className="input pl-9 py-2"
          />
        </div>
        {isAdmin && (
          <select
            value={userId}
            onChange={e => { setUserId(e.target.value); setPage(1); }}
            className="input w-auto py-2"
          >
            <option value="">All team members</option>
            {internalUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
        {(search || userId) && (
          <button
            onClick={() => { setSearch(''); setUserId(''); setPage(1); }}
            className="btn-secondary py-2 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Activity size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No activity found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-bold flex-shrink-0 mt-0.5">
                  <User size={14} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{entry.user_name}</span>
                    {actionBadge(entry.action)}
                    <span className="text-sm text-gray-500 dark:text-gray-400">on</span>
                    <Link
                      to={`/leads/${entry.lead_id}`}
                      className="text-sm font-medium text-primary-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      {entry.lead_name} <ChevronRight size={12} />
                    </Link>
                  </div>
                  {entry.old_value !== null && entry.new_value !== null && (
                    <p className="text-xs text-gray-400 mt-1">
                      <span className="line-through text-rose-400">{entry.old_value}</span>
                      <span className="mx-1">→</span>
                      <span className="text-emerald-500">{entry.new_value}</span>
                    </p>
                  )}
                  {entry.old_value === null && entry.new_value !== null && (
                    <p className="text-xs text-gray-400 mt-1">{entry.new_value}</p>
                  )}
                </div>

                {/* Time */}
                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-1">
                  {formatRelativeTime(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {curPage} of {lastPage} · {total} total
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >← Prev</button>
              <button
                disabled={page >= lastPage}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
