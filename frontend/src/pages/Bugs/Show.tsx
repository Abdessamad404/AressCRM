import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bugsApi } from '../../api/bugs';
import api from '../../api/axios';
import { ArrowLeft, CheckCircle2, Trash2, User, Clock, Globe, Monitor, RefreshCcw, AlertTriangle } from 'lucide-react';
import { BUG_STATUS_COLORS, BUG_PRIORITY_COLORS, formatRelativeTime, formatDate } from '../../utils/helpers';
import type { BugHistory } from '../../types/bug';

export default function BugShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assignTo, setAssignTo] = useState('');

  const { data: bug, isLoading } = useQuery({
    queryKey: ['bug', id],
    queryFn: () => bugsApi.getOne(id!),
  });

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => { const r = await api.get('/api/users'); return r.data.data; },
  });

  const resolveMutation = useMutation({
    mutationFn: () => bugsApi.resolve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      queryClient.invalidateQueries({ queryKey: ['bug', id] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) => bugsApi.update(id!, { assigned_to_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug', id] });
      setAssignTo('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => bugsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      navigate('/bugs');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Exception not found.</p>
        <Link to="/bugs" className="btn-primary mt-4 inline-flex">Back to Monitor</Link>
      </div>
    );
  }

  const isResolved = bug.status === 'resolved' || bug.status === 'closed';
  const borderColor =
    bug.priority === 'critical' ? 'border-rose-500' :
    bug.priority === 'high' ? 'border-orange-500' :
    bug.priority === 'medium' ? 'border-yellow-500' : 'border-gray-300';

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-0.5">
            <ArrowLeft size={18} />
          </button>
          <div>
            {bug.exception_class && (
              <p className="text-xs font-mono text-rose-500 dark:text-rose-400 mb-1">{bug.exception_class}</p>
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{bug.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${BUG_PRIORITY_COLORS[bug.priority]}`}>
                <AlertTriangle size={10} /> {bug.priority}
              </span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${BUG_STATUS_COLORS[bug.status]}`}>
                {bug.status.replace('_', ' ')}
              </span>
              {bug.environment && (
                <span className={bug.environment === 'production'
                  ? 'text-xs px-2 py-0.5 rounded font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  : 'text-xs px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }>{bug.environment}</span>
              )}
              {bug.occurrence_count > 1 && (
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <RefreshCcw size={10} /> {bug.occurrence_count}x
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isResolved && (
            <button
              onClick={() => resolveMutation.mutate()}
              disabled={resolveMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              <CheckCircle2 size={15} /> Mark Resolved
            </button>
          )}
          <button
            onClick={() => { if (window.confirm('Delete this exception permanently?')) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
            className="btn-secondary flex items-center gap-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Stack trace + history */}
        <div className="lg:col-span-2 space-y-5">
          {bug.description && bug.description !== bug.title && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Message</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">{bug.description}</p>
            </div>
          )}

          {bug.stack_trace && (
            <div className={`card border-l-4 ${borderColor} p-0 overflow-hidden`}>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stack Trace</h2>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                {bug.stack_trace}
              </pre>
            </div>
          )}

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Activity</h2>
            {(!bug.history || bug.history.length === 0) ? (
              <p className="text-sm text-gray-400">No activity yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-700" />
                <div className="space-y-4">
                  {bug.history.map((item: BugHistory) => (
                    <div key={item.id} className="pl-8 relative">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-gray-800" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            <span className="font-medium">{item.user?.name ?? 'System'}</span>{' '}
                            <span className="text-gray-500">{item.action}</span>
                          </p>
                          {item.old_value !== null && item.new_value !== null && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              <span className="line-through text-rose-400">{item.old_value}</span>
                              {' → '}
                              <span className="text-emerald-500">{item.new_value}</span>
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(item.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Request</h2>
            <div className="space-y-3">
              {bug.url && (
                <MetaRow icon={<Globe size={13} />} label="URL">
                  <span className="font-mono text-xs break-all text-gray-700 dark:text-gray-300">{bug.url}</span>
                </MetaRow>
              )}
              {bug.http_method && (
                <MetaRow icon={<Globe size={13} />} label="Method">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{bug.http_method}</span>
                </MetaRow>
              )}
              {bug.user_agent && (
                <MetaRow icon={<Monitor size={13} />} label="Browser">
                  <span className="text-xs text-gray-600 dark:text-gray-400 break-all">{bug.user_agent.split(' ').slice(-2).join(' ')}</span>
                </MetaRow>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Timing</h2>
            <div className="space-y-3">
              <MetaRow icon={<Clock size={13} />} label="First seen">
                <span className="text-xs text-gray-700 dark:text-gray-300">{formatDate(bug.created_at)}</span>
              </MetaRow>
              {bug.last_occurred_at && (
                <MetaRow icon={<Clock size={13} />} label="Last seen">
                  <span className="text-xs text-gray-700 dark:text-gray-300">{formatDate(bug.last_occurred_at)}</span>
                </MetaRow>
              )}
              <MetaRow icon={<RefreshCcw size={13} />} label="Occurrences">
                <span className="font-bold text-gray-900 dark:text-white">{bug.occurrence_count}</span>
              </MetaRow>
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Assignment</h2>
            <div className="space-y-3">
              <MetaRow icon={<User size={13} />} label="Assigned to">
                <span className="text-sm text-gray-700 dark:text-gray-300">{bug.assigned_to?.name ?? 'Unassigned'}</span>
              </MetaRow>
              {!isResolved && (
                <div className="space-y-2">
                  <select
                    value={assignTo}
                    onChange={e => setAssignTo(e.target.value)}
                    className="input text-xs py-1.5"
                  >
                    <option value="">Reassign to...</option>
                    {(users ?? []).map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  {assignTo && (
                    <button
                      onClick={() => assignMutation.mutate(assignTo)}
                      disabled={assignMutation.isPending}
                      className="btn-primary w-full text-xs py-1.5"
                    >
                      Assign
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {bug.related_lead && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Related Lead</h2>
              <Link to={`/leads/${bug.related_lead.id}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                {bug.related_lead.name}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mb-0.5">
        {icon} {label}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );
}
