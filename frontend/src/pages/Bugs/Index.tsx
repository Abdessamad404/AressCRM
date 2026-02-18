import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bugsApi } from '../../api/bugs';
import { Search, Eye, Trash2, CheckCircle2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { BUG_STATUS_COLORS, BUG_PRIORITY_COLORS, formatRelativeTime } from '../../utils/helpers';
import type { Bug, BugStatus, BugPriority } from '../../types/bug';

const STATUSES: BugStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES: BugPriority[] = ['critical', 'high', 'medium', 'low'];

export default function BugsIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bugs', { search, status, priority, page }],
    queryFn: () => bugsApi.getAll({
      search: search || undefined,
      status: status as BugStatus || undefined,
      priority: priority as BugPriority || undefined,
      page,
      per_page: 20,
    }),
    refetchInterval: 30000,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => bugsApi.resolve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bugs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: bugsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bugs'] }),
  });

  const openCount = data?.data?.filter(b => b.status === 'open').length ?? 0;
  const criticalCount = data?.data?.filter(b => b.priority === 'critical' && b.status === 'open').length ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Exception Monitor
            {openCount > 0 && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                {openCount} open
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Auto-captured app errors — refreshes every 30s</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary flex items-center gap-1.5">
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      {/* Critical alert banner */}
      {criticalCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <p className="text-sm font-medium">
            {criticalCount} critical exception{criticalCount > 1 ? 's' : ''} requiring immediate attention
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card py-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search exceptions..."
            className="input pl-9 py-2"
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input w-auto py-2">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }} className="input w-auto py-2">
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(search || status || priority) && (
          <button onClick={() => { setSearch(''); setStatus(''); setPriority(''); setPage(1); }} className="btn-secondary py-2 text-xs">Clear</button>
        )}
      </div>

      {/* Exception cards */}
      <div className="space-y-2">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && (data?.data ?? []).length === 0 && (
          <div className="card text-center py-16">
            <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">No exceptions found</p>
            <p className="text-sm text-gray-400 mt-1">Your application is running smoothly</p>
          </div>
        )}
        {(data?.data ?? []).map((bug: Bug) => (
          <ExceptionCard
            key={bug.id}
            bug={bug}
            onView={() => navigate(`/bugs/${bug.id}`)}
            onResolve={() => resolveMutation.mutate(bug.id)}
            onDelete={() => { if (window.confirm('Delete this exception log?')) deleteMutation.mutate(bug.id); }}
            isResolving={resolveMutation.isPending}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {data ? `${data.total} total exceptions` : ''}
        </p>
        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >Prev</button>
          {Array.from({ length: data?.last_page ?? 1 }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={p === page
                ? 'w-8 h-8 text-xs rounded-lg bg-primary-600 text-white font-medium'
                : 'w-8 h-8 text-xs rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
            >{p}</button>
          ))}
          <button
            disabled={page >= (data?.last_page ?? 1)}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >Next</button>
        </div>
      </div>
    </div>
  );
}

function ExceptionCard({ bug, onView, onResolve, onDelete, isResolving }: {
  bug: Bug;
  onView: () => void;
  onResolve: () => void;
  onDelete: () => void;
  isResolving: boolean;
}) {
  const isResolved = bug.status === 'resolved' || bug.status === 'closed';
  const borderColor =
    bug.priority === 'critical' ? 'border-l-rose-500' :
    bug.priority === 'high' ? 'border-l-orange-500' :
    bug.priority === 'medium' ? 'border-l-yellow-500' :
    'border-l-gray-300 dark:border-l-gray-600';

  const pathOnly = (url: string) => url.replace(/^https?:\/\/[^/]+/, '') || '/';

  return (
    <div
      className={`card p-0 overflow-hidden border-l-4 cursor-pointer hover:shadow-md transition-shadow ${borderColor} ${isResolved ? 'opacity-60' : ''}`}
      onClick={onView}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {bug.exception_class && (
              <p className="text-xs font-mono text-rose-500 dark:text-rose-400 mb-1 truncate">{bug.exception_class}</p>
            )}
            <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{bug.title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              {bug.url && (
                <span className="text-xs text-gray-400 font-mono" title={bug.url}>
                  {bug.http_method && <span className="text-indigo-500 mr-1">{bug.http_method}</span>}
                  {pathOnly(bug.url)}
                </span>
              )}
              {bug.environment && (
                <span className={bug.environment === 'production'
                  ? 'text-xs px-1.5 py-0.5 rounded font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  : 'text-xs px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }>{bug.environment}</span>
              )}
              <span className="text-xs text-gray-400">{formatRelativeTime(bug.last_occurred_at ?? bug.created_at)}</span>
              {bug.occurrence_count > 1 && (
                <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                  x{bug.occurrence_count}
                </span>
              )}
            </div>
          </div>

          {/* Badges + actions */}
          <div className="flex items-start gap-2 flex-shrink-0">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BUG_PRIORITY_COLORS[bug.priority]}`}>{bug.priority}</span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BUG_STATUS_COLORS[bug.status]}`}>{bug.status.replace('_', ' ')}</span>
            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
              {!isResolved && (
                <button
                  onClick={onResolve}
                  disabled={isResolving}
                  title="Mark as resolved"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <CheckCircle2 size={15} />
                </button>
              )}
              <button onClick={onView} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <Eye size={15} />
              </button>
              <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
        {bug.assigned_to && (
          <p className="text-xs text-gray-400 mt-2">
            Assigned to <span className="font-medium text-gray-600 dark:text-gray-300">{bug.assigned_to.name}</span>
          </p>
        )}
      </div>
    </div>
  );
}
