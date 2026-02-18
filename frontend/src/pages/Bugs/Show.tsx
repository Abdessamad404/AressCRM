import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bugsApi } from '../../api/bugs';
import { ArrowLeft, Edit, Trash2, User, Clock, AlertTriangle } from 'lucide-react';
import { BUG_STATUS_COLORS, BUG_PRIORITY_COLORS, formatRelativeTime } from '../../utils/helpers';
import type { BugHistory } from '../../types/bug';

export default function BugShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: bug, isLoading } = useQuery({
    queryKey: ['bug', id],
    queryFn: () => bugsApi.getOne(id!),
  });

  const deleteMutation = useMutation({
    mutationFn: () => bugsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      navigate('/bugs');
    },
  });

  const handleDelete = () => {
    if (confirm(`Delete bug "${bug?.title}"? This cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

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
        <p className="text-gray-500">Bug not found.</p>
        <Link to="/bugs" className="btn-primary mt-4 inline-flex">Back to Bugs</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{bug.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BUG_STATUS_COLORS[bug.status]}`}>
                {bug.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${BUG_PRIORITY_COLORS[bug.priority]}`}>
                <AlertTriangle size={10} />{bug.priority}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/bugs/${id}/edit`} className="btn-secondary flex items-center gap-1.5">
            <Edit size={14} /> Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="btn-secondary flex items-center gap-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Details Card */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Bug Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <InfoRow icon={<User size={15} />} label="Assigned To" value={bug.assigned_to?.name ?? 'Unassigned'} />
          <InfoRow icon={<User size={15} />} label="Reported By" value={bug.reported_by?.name ?? '—'} />
          <InfoRow icon={<Clock size={15} />} label="Created" value={formatRelativeTime(bug.created_at)} />
          <InfoRow icon={<Clock size={15} />} label="Last Updated" value={formatRelativeTime(bug.updated_at)} />
          {bug.related_lead && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Related Lead</p>
              <Link to={`/leads/${bug.related_lead.id}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                {bug.related_lead.name}
              </Link>
            </div>
          )}
        </div>
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Description</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{bug.description}</p>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Activity History</h2>
        {(!bug.history || bug.history.length === 0) ? (
          <p className="text-sm text-gray-400 py-2">No history yet.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-700" />
            <div className="space-y-4">
              {bug.history.map((item: BugHistory) => (
                <HistoryItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{value}</p>
      </div>
    </div>
  );
}

function HistoryItem({ item }: { item: BugHistory }) {
  return (
    <div className="pl-8 relative">
      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-gray-800" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-gray-800 dark:text-gray-200">
            <span className="font-medium">{item.user?.name ?? 'System'}</span>{' '}
            <span className="text-gray-500 dark:text-gray-400">{item.action}</span>
          </p>
          {item.old_value !== null && item.new_value !== null && (
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="line-through text-rose-400">{item.old_value}</span>
              {' → '}
              <span className="text-emerald-500">{item.new_value}</span>
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{formatRelativeTime(item.created_at)}</span>
      </div>
    </div>
  );
}
