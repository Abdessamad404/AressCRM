import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { applicationApi } from '../../api/client';
import {
  Briefcase, MapPin, TrendingUp, Clock, ChevronRight,
  Loader2, InboxIcon, Filter,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';
import type { Application } from '../../types/client';

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  accepted:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected:    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pending',
  shortlisted: 'Shortlisted',
  accepted:    'Accepted',
  rejected:    'Rejected',
};


export default function MyApplications() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-applications', statusFilter, page],
    queryFn: () => applicationApi.myApplications({ status: statusFilter || undefined, page }),
  });

  const applications = data?.data ?? [];
  const totalPages = data?.last_page ?? 1;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track the status of your job applications
          </p>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(['pending', 'shortlisted', 'accepted', 'rejected'] as const).map((s) => {
            // Use total from current page — we'll just show total for current filter
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1); }}
                className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[s]}`}>
                  {STATUS_LABELS[s]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <InboxIcon size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No applications found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">
            {statusFilter ? 'Try a different status filter' : "You haven't applied to any job offers yet"}
          </p>
          {!statusFilter && (
            <Link
              to="/client/job-offers"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Briefcase size={15} /> Browse Job Offers
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const offer = application.job_offer;
  if (!offer) return null;

  return (
    <Link
      to={`/client/job-offers/${offer.id}`}
      className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Company avatar */}
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-base shrink-0">
          {offer.company_name[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {offer.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{offer.company_name}</p>
            </div>
            <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[application.status]}`}>
              {STATUS_LABELS[application.status]}
            </span>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mt-2.5">
            {offer.location && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <MapPin size={11} /> {offer.location}
              </span>
            )}
            {offer.compensation_type === 'commission' && offer.commission_rate != null && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <TrendingUp size={11} /> {offer.commission_rate}% commission
              </span>
            )}
            {offer.compensation_type === 'fixed_budget' && offer.budget_amount != null && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <TrendingUp size={11} /> €{Number(offer.budget_amount).toLocaleString()} budget
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Clock size={11} /> Applied {formatRelativeTime(application.created_at)}
            </span>
          </div>

          {/* Cover letter snippet */}
          {application.cover_letter && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">
              "{application.cover_letter}"
            </p>
          )}

          {/* Entreprise notes (if any) */}
          {application.entreprise_notes && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-medium">Note from employer: </span>
                {application.entreprise_notes}
              </p>
            </div>
          )}
        </div>

        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors mt-0.5 shrink-0" />
      </div>
    </Link>
  );
}
