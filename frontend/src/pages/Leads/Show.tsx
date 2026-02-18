import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { leadsApi } from '../../api/leads';
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, Building2, Tag, Clock } from 'lucide-react';
import { LEAD_STATUS_COLORS, formatRelativeTime } from '../../utils/helpers';
import type { LeadHistory } from '../../types/lead';

export default function LeadShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.getOne(id!),
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      navigate('/leads');
    },
  });

  const handleDelete = () => {
    if (confirm(`Delete lead "${lead?.name}"? This cannot be undone.`)) {
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

  if (!lead) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Lead not found.</p>
        <Link to="/leads" className="btn-primary mt-4 inline-flex">Back to Leads</Link>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lead.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{lead.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/leads/${id}/edit`} className="btn-secondary flex items-center gap-1.5">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Lead Details</h2>
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${LEAD_STATUS_COLORS[lead.status]}`}>
            {lead.status}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={<Mail size={15} />} label="Email" value={lead.email} />
          <InfoRow icon={<Phone size={15} />} label="Phone" value={lead.phone ?? '—'} />
          <InfoRow icon={<Building2 size={15} />} label="Company" value={lead.company ?? '—'} />
          <InfoRow icon={<Tag size={15} />} label="Source" value={lead.source ?? '—'} />
          <InfoRow icon={<User size={15} />} label="Assigned To" value={lead.assigned_to?.name ?? 'Unassigned'} />
          <InfoRow icon={<User size={15} />} label="Created By" value={lead.created_by?.name ?? '—'} />
          <InfoRow icon={<Clock size={15} />} label="Created" value={formatRelativeTime(lead.created_at)} />
          <InfoRow icon={<Clock size={15} />} label="Last Updated" value={formatRelativeTime(lead.updated_at)} />
        </div>
        {lead.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}
      </div>

      {/* History */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Activity History</h2>
        {(!lead.history || lead.history.length === 0) ? (
          <p className="text-sm text-gray-400 py-2">No history yet.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-700" />
            <div className="space-y-4">
              {lead.history.map((item: LeadHistory) => (
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

function HistoryItem({ item }: { item: LeadHistory }) {
  return (
    <div className="pl-8 relative">
      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-gray-800" />
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
