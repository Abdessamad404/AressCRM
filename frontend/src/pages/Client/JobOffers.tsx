import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { jobOfferApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  Briefcase, Plus, Search, MapPin, TrendingUp,
  Eye, Pencil, Trash2, ChevronRight, CheckCircle, Users
} from 'lucide-react';
import type { JobOffer } from '../../types/client';

const MISSION_LABELS: Record<string, string> = {
  direct_sales: 'Direct Sales',
  lead_gen: 'Lead Gen',
  demo: 'Demo',
  other: 'Other',
};

const APPLICATION_STATUS_STYLES: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  accepted:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected:    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function JobOffersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEntreprise = user?.client_type === 'entreprise';

  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['client-job-offers', search, sector, page],
    queryFn: () => jobOfferApi.list({ search: search || undefined, sector: sector || undefined, page }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: jobOfferApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-job-offers'] }),
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEntreprise ? 'My Job Offers' : 'Job Offers'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isEntreprise ? 'Manage your posted positions' : 'Find commercial opportunities'}
          </p>
        </div>
        {isEntreprise && (
          <Link
            to="/client/job-offers/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus size={16} /> Post Job Offer
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search offers..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900"
          />
        </div>
        <input
          value={sector}
          onChange={(e) => { setSector(e.target.value); setPage(1); }}
          placeholder="Sector..."
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 w-36"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (data?.data?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {isEntreprise ? (
            <div className="flex flex-col items-center gap-3">
              <Briefcase size={40} className="opacity-40" />
              <p className="font-medium">No job offers yet</p>
              <Link to="/client/job-offers/create" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
                Post your first job offer
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Briefcase size={40} className="opacity-40" />
              <p className="font-medium">No offers found</p>
              <p className="text-sm">Try adjusting your search filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data?.data.map((offer) => (
            <JobOfferCard
              key={offer.id}
              offer={offer}
              isOwner={isEntreprise}
              onDelete={() => handleDelete(offer.id, offer.title)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {data?.last_page}</span>
          <button
            onClick={() => setPage((p) => Math.min(data?.last_page ?? 1, p + 1))}
            disabled={page === data?.last_page}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function JobOfferCard({ offer, isOwner, onDelete }: { offer: JobOffer; isOwner: boolean; onDelete: () => void }) {
  const compensation = offer.compensation_type === 'fixed_budget'
    ? offer.budget_amount != null ? `€${Number(offer.budget_amount).toLocaleString()} budget` : null
    : offer.commission_rate != null ? `${offer.commission_rate}% commission` : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <Link to={`/client/job-offers/${offer.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {offer.title}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{offer.company_name}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            offer.status === 'published'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : offer.status === 'draft'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}>
            {offer.status}
          </span>
          {/* Applied badge for commercial */}
          {offer.has_applied && offer.application_status && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${APPLICATION_STATUS_STYLES[offer.application_status]}`}>
              <CheckCircle size={10} />
              {offer.application_status}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{offer.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {offer.location && (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MapPin size={12} /> {offer.location}
          </span>
        )}
        {offer.mission_type && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <TrendingUp size={11} /> {MISSION_LABELS[offer.mission_type] ?? offer.mission_type}
          </span>
        )}
        {compensation && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium">
            {compensation}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Eye size={12} /> {offer.views_count}</span>
          {isOwner && (
            <Link
              to={`/client/job-offers/${offer.id}/applications`}
              className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Users size={12} /> Applications
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <Link to={`/client/job-offers/${offer.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                <Pencil size={14} />
              </Link>
              <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                <Trash2 size={14} />
              </button>
            </>
          )}
          <Link to={`/client/job-offers/${offer.id}`} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
            View <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
