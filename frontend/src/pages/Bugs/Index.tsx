import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bugsApi } from '../../api/bugs';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { BUG_STATUS_COLORS, BUG_PRIORITY_COLORS } from '../../utils/helpers';
import type { Bug, BugStatus, BugPriority } from '../../types/bug';

const STATUSES: BugStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES: BugPriority[] = ['low', 'medium', 'high', 'critical'];

export default function BugsIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['bugs', { search, status, priority, page }],
    queryFn: () => bugsApi.getAll({
      search: search || undefined,
      status: status as BugStatus || undefined,
      priority: priority as BugPriority || undefined,
      page,
      per_page: 15,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: bugsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bugs'] }),
  });

  const handleDelete = (bug: Bug) => {
    if (confirm(`Delete bug "${bug.title}"?`)) deleteMutation.mutate(bug.id);
  };

  const hasFilters = search || status || priority;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bugs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{data?.total ?? 0} total bugs</p>
        </div>
        <button onClick={() => navigate('/bugs/create')} className="btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Report Bug
        </button>
      </div>

      {/* Filters */}
      <div className="card py-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search bugs..."
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
        {hasFilters && (
          <button onClick={() => { setSearch(''); setStatus(''); setPriority(''); setPage(1); }} className="btn-secondary py-2 text-xs">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Title</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Priority</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Assigned To</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Reported By</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
              )}
              {!isLoading && (data?.data ?? []).length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No bugs found.</td></tr>
              )}
              {(data?.data ?? []).map(bug => (
                <tr key={bug.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{bug.title}</p>
                    {bug.related_lead && (
                      <p className="text-xs text-gray-400">Lead: {bug.related_lead.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${BUG_STATUS_COLORS[bug.status]}`}>
                      {bug.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${BUG_PRIORITY_COLORS[bug.priority]}`}>
                      {bug.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{bug.assigned_to?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{bug.reported_by?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => navigate(`/bugs/${bug.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><Eye size={15} /></button>
                      <button onClick={() => navigate(`/bugs/${bug.id}/edit`)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"><Edit size={15} /></button>
                      <button onClick={() => handleDelete(bug)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.last_page ?? 1) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500">Page {data?.current_page} of {data?.last_page}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 text-xs disabled:opacity-40">Prev</button>
              <button disabled={page >= (data?.last_page ?? 1)} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
