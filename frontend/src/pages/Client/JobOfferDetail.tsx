import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobOfferApi, applicationApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft, MapPin, TrendingUp, Clock, Eye, FileText,
  CheckCircle, XCircle, Loader2, Users, Pencil, Download,
  BookOpen, Send
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';
import type { Application } from '../../types/client';

const MISSION_LABELS: Record<string, string> = {
  direct_sales: 'Direct Sales', lead_gen: 'Lead Gen', demo: 'Demo', other: 'Other',
};
const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  accepted:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected:    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function JobOfferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEntreprise = user?.client_type === 'entreprise';
  const isCommercial = user?.client_type === 'commercial';

  const [tab, setTab] = useState<'details' | 'applications'>('details');
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  const { data: offer, isLoading } = useQuery({
    queryKey: ['client-job-offer-detail', id],
    queryFn: () => jobOfferApi.get(id!),
    enabled: !!id,
  });

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['job-offer-applications', id],
    queryFn: () => applicationApi.getForOffer(id!),
    enabled: !!id && isEntreprise && tab === 'applications',
  });

  const applyMutation = useMutation({
    mutationFn: () => applicationApi.apply(id!, coverLetter || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-job-offer-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['client-job-offers'] });
      setShowApplyModal(false);
      setCoverLetter('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      applicationApi.updateStatus(id!, appId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-offer-applications', id] }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!offer) return (
    <div className="p-8 text-center text-gray-500">Offer not found.</div>
  );

  const compensation = offer.compensation_type === 'fixed_budget'
    ? offer.budget_amount != null ? `€${Number(offer.budget_amount).toLocaleString()} fixed budget` : null
    : offer.commission_rate != null ? `${offer.commission_rate}% commission` : null;

  const isOwner = offer.user_id === user?.id;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{offer.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{offer.company_name}</p>
            {offer.user && !isOwner && (
              <p className="text-xs text-gray-400 mt-0.5">Posted by {offer.user.name}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              offer.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : offer.status === 'draft'   ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>{offer.status}</span>
            {isOwner && (
              <Link to={`/client/job-offers/${offer.id}/edit`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 transition-colors">
                <Pencil size={12} /> Edit
              </Link>
            )}
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {offer.location && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              <MapPin size={11} /> {offer.location}
            </span>
          )}
          {offer.mission_type && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <TrendingUp size={11} /> {MISSION_LABELS[offer.mission_type]}
            </span>
          )}
          {compensation && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium">
              {compensation}
            </span>
          )}
          {offer.contract_duration && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <Clock size={11} /> {offer.contract_duration}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Eye size={11} /> {offer.views_count} views
          </span>
        </div>

        {/* Product sheet */}
        {offer.product_sheet_path && offer.product_sheet_name && (
          <a
            href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8001'}/storage/${offer.product_sheet_path}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-fit"
          >
            <FileText size={15} className="text-primary-500" />
            <span className="truncate max-w-xs">{offer.product_sheet_name}</span>
            <Download size={13} className="text-gray-400 ml-auto" />
          </a>
        )}

        {/* Apply / application status */}
        {isCommercial && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            {offer.has_applied && offer.application_status ? (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${STATUS_STYLES[offer.application_status]}`}>
                  <CheckCircle size={14} />
                  Application {offer.application_status}
                </span>
              </div>
            ) : offer.status === 'published' ? (
              <button
                onClick={() => setShowApplyModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Send size={15} /> Apply Now
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Tabs (entreprise: details + applications) */}
      {isEntreprise && (
        <div className="flex gap-1 mb-5">
          {(['details', 'applications'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t === 'applications' ? (
                <span className="flex items-center gap-1.5"><Users size={14} /> Applications</span>
              ) : t}
            </button>
          ))}
        </div>
      )}

      {/* Details tab */}
      {tab === 'details' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Description</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">{offer.description}</p>
          </div>

          {(offer.requirements ?? []).length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Requirements</h2>
              <ul className="space-y-1.5">
                {(offer.requirements ?? []).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(offer.benefits ?? []).length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Benefits</h2>
              <ul className="space-y-1.5">
                {(offer.benefits ?? []).map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle size={14} className="text-primary-500 mt-0.5 flex-shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quizzes section */}
          {(offer.quizzes ?? []).length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-primary-500" /> Assessment Quizzes
              </h2>
              <div className="space-y-2">
                {(offer.quizzes ?? []).map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{q.title}</p>
                      {q.description && <p className="text-xs text-gray-400 mt-0.5">{q.description}</p>}
                    </div>
                    {q.time_limit_minutes && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> {q.time_limit_minutes}min
                      </span>
                    )}
                    {isCommercial && (
                      <Link
                        to={`/client/quizzes/${q.id}`}
                        className="ml-3 text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                      >
                        Take Quiz
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Applications tab (entreprise only) */}
      {tab === 'applications' && isEntreprise && (
        <div>
          {appsLoading ? (
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (applicationsData?.data.length ?? 0) === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={36} className="mx-auto mb-3 opacity-40" />
              <p>No applications yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applicationsData?.data.map((app) => (
                <ApplicationRow
                  key={app.id}
                  application={app}
                  onStatusChange={(status) => updateStatusMutation.mutate({ appId: app.id, status })}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apply modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Apply to {offer.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{offer.company_name}</p>

            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Cover Letter <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="Introduce yourself and explain why you're a great fit for this mission..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 resize-none"
            />

            {applyMutation.isError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">Failed to submit. You may have already applied.</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setShowApplyModal(false); setCoverLetter(''); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {applyMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <><Send size={15} /> Submit Application</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationRow({ application, onStatusChange, isUpdating }: {
  application: Application;
  onStatusChange: (status: string) => void;
  isUpdating: boolean;
}) {
  const initials = (application.user?.name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 text-sm font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-gray-900 dark:text-white text-sm">{application.user?.name ?? '—'}</p>
            <span className="text-xs text-gray-400">{formatRelativeTime(application.created_at)}</span>
          </div>
          <p className="text-xs text-gray-400">{application.user?.email}</p>
          {application.cover_letter && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{application.cover_letter}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[application.status]}`}>
          {application.status}
        </span>
        <div className="flex gap-1">
          {(['pending', 'shortlisted', 'accepted', 'rejected'] as const).filter(s => s !== application.status).map((s) => (
            <button
              key={s}
              disabled={isUpdating}
              onClick={() => onStatusChange(s)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
                s === 'accepted' ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                : s === 'rejected' ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20'
                : s === 'shortlisted' ? 'border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {s === 'accepted' ? <CheckCircle size={11} className="inline mr-0.5" /> : s === 'rejected' ? <XCircle size={11} className="inline mr-0.5" /> : null}
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
