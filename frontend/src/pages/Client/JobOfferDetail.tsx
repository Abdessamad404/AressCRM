import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobOfferApi, applicationApi, quizApi, quizAssignmentApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft, MapPin, TrendingUp, Clock, Eye, FileText,
  CheckCircle, Loader2, Users, Pencil, Download,
  BookOpen, Send, ChevronDown, ChevronUp, ClipboardList,
  X, Plus,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';
import type { Application, QuizAssignment } from '../../types/client';

const MISSION_LABELS: Record<string, string> = {
  direct_sales: 'Direct Sales', lead_gen: 'Lead Gen', demo: 'Demo', other: 'Other',
};
const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  accepted:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected:    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', shortlisted: 'Shortlisted', accepted: 'Accepted', rejected: 'Rejected',
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
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  const { data: offer, isLoading } = useQuery({
    queryKey: ['client-job-offer-detail', id],
    queryFn: () => jobOfferApi.get(id!),
    enabled: !!id,
  });

  // Always fetch applications for entreprise so we can show pending badge on tab
  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['job-offer-applications', id],
    queryFn: () => applicationApi.getForOffer(id!),
    enabled: !!id && isEntreprise,
  });

  // Entreprise: fetch their own published quizzes for the assignment picker
  const { data: myQuizzes = [] } = useQuery({
    queryKey: ['client-quizzes-for-assign'],
    queryFn: () => quizApi.list({ page: 1 }),
    enabled: isEntreprise,
    select: (d) => d.data.filter((q) => q.is_published),
  });

  const pendingCount = (applicationsData?.data ?? []).filter(a => a.status === 'pending').length;

  const applyMutation = useMutation({
    mutationFn: () => applicationApi.apply(id!, coverLetter || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-job-offer-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['client-job-offers'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      // Update entreprise's pending-applications badge immediately
      queryClient.invalidateQueries({ queryKey: ['notif-pending-apps'] });
      setCoverLetter('');
      setShowCoverLetter(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      applicationApi.updateStatus(id!, appId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-offer-applications', id] });
      // Update commercial's My Applications badge immediately (non-pending status changed)
      queryClient.invalidateQueries({ queryKey: ['notif-app-actions'] });
      // Update entreprise's pending-applications badge (count may decrease)
      queryClient.invalidateQueries({ queryKey: ['notif-pending-apps'] });
    },
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

      {/* Header card */}
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

        {/* ── Apply section (commercial) ── */}
        {isCommercial && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            {offer.has_applied && offer.application_status ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${STATUS_STYLES[offer.application_status]}`}>
                <CheckCircle size={14} />
                Application {STATUS_LABELS[offer.application_status]}
              </span>
            ) : offer.status === 'published' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => applyMutation.mutate()}
                    disabled={applyMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {applyMutation.isPending
                      ? <><Loader2 size={15} className="animate-spin" /> Applying...</>
                      : <><Send size={15} /> Apply Now</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCoverLetter((v) => !v)}
                    className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showCoverLetter ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {showCoverLetter ? 'Hide note' : '+ Add a note'}
                  </button>
                </div>

                {showCoverLetter && (
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    autoFocus
                    placeholder="Introduce yourself and explain why you're a great fit for this mission..."
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 resize-none"
                  />
                )}

                {applyMutation.isError && (
                  <p className="text-xs text-red-600 dark:text-red-400">Failed to apply. You may have already applied.</p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Tabs — entreprise: Details + Applications with pending badge */}
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
                <span className="flex items-center gap-1.5">
                  <Users size={14} /> Applications
                  {pendingCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-white text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </span>
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
        </div>
      )}

      {/* Applications tab (entreprise only) */}
      {tab === 'applications' && isEntreprise && (
        <div>
          {appsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
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
                  myQuizzes={myQuizzes}
                  onStatusChange={(status) => updateStatusMutation.mutate({ appId: app.id, status })}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ApplicationRow ────────────────────────────────────────────────────────────

function ApplicationRow({ application, myQuizzes, onStatusChange, isUpdating }: {
  application: Application;
  myQuizzes: { id: string; title: string }[];
  onStatusChange: (status: string) => void;
  isUpdating: boolean;
}) {
  const queryClient = useQueryClient();
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState('');

  // Fetch assignments for this specific application
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<QuizAssignment[]>({
    queryKey: ['quiz-assignments', application.id],
    queryFn: () => quizAssignmentApi.list(application.id),
  });

  const assignMutation = useMutation({
    mutationFn: (quizId: string) => quizAssignmentApi.assign(application.id, quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-assignments', application.id] });
      // Invalidate candidate's quiz list so it refreshes next time they visit /client/quizzes
      queryClient.invalidateQueries({ queryKey: ['client-quizzes'] });
      // Update commercial's My Quizzes badge immediately (new unstarted quiz assigned)
      queryClient.invalidateQueries({ queryKey: ['notif-unstarted-q'] });
      setSelectedQuizId('');
      setShowAssignPicker(false);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (assignmentId: string) => quizAssignmentApi.unassign(application.id, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-assignments', application.id] });
      // Invalidate candidate's quiz list so removal is reflected next time they visit
      queryClient.invalidateQueries({ queryKey: ['client-quizzes'] });
    },
  });

  const assignedQuizIds = new Set(assignments.map((a) => a.quiz_id));
  const availableQuizzes = myQuizzes.filter((q) => !assignedQuizIds.has(q.id));
  const isRejected = application.status === 'rejected';

  const initials = (application.user?.name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      {/* Candidate info */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 text-sm font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-gray-900 dark:text-white text-sm">{application.user?.name ?? '—'}</p>
            <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(application.created_at)}</span>
          </div>
          <p className="text-xs text-gray-400">{application.user?.email}</p>
          {application.cover_letter && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 italic">"{application.cover_letter}"</p>
          )}
        </div>
      </div>

      {/* Status badge + dropdown */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 gap-3">
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[application.status]}`}>
          {STATUS_LABELS[application.status]}
        </span>
        <select
          value={application.status}
          disabled={isUpdating}
          onChange={(e) => onStatusChange(e.target.value)}
          className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 disabled:opacity-50 cursor-pointer"
        >
          <option value="pending">→ Pending</option>
          <option value="shortlisted">→ Shortlist</option>
          <option value="accepted">→ Accept</option>
          <option value="rejected">→ Reject</option>
        </select>
      </div>

      {/* ── Quiz assignments section ── */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <ClipboardList size={12} /> Assigned Quizzes
          </span>
          {!isRejected && myQuizzes.length > 0 && (
            <button
              onClick={() => setShowAssignPicker((v) => !v)}
              disabled={availableQuizzes.length === 0}
              title={availableQuizzes.length === 0 ? 'All your quizzes are already assigned' : 'Assign a quiz'}
              className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={12} /> Assign Quiz
            </button>
          )}
        </div>

        {/* Assigned quiz chips */}
        {assignmentsLoading ? (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Loader2 size={11} className="animate-spin" /> Loading…
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            {isRejected ? 'Cannot assign quizzes to rejected applicants.' : 'No quizzes assigned yet.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {assignments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800"
              >
                <BookOpen size={10} />
                {a.quiz?.title ?? 'Quiz'}
                {!isRejected && (
                  <button
                    onClick={() => unassignMutation.mutate(a.id)}
                    disabled={unassignMutation.isPending}
                    className="ml-0.5 hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Remove assignment"
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Assign picker inline */}
        {showAssignPicker && !isRejected && availableQuizzes.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="flex-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900"
            >
              <option value="">— Select a quiz —</option>
              {availableQuizzes.map((q) => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
            <button
              onClick={() => selectedQuizId && assignMutation.mutate(selectedQuizId)}
              disabled={!selectedQuizId || assignMutation.isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {assignMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : 'Assign'}
            </button>
            <button
              onClick={() => { setShowAssignPicker(false); setSelectedQuizId(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {assignMutation.isError && (
          <p className="text-xs text-red-500 mt-1">Failed to assign quiz. Please try again.</p>
        )}

        {myQuizzes.length === 0 && !isRejected && (
          <p className="text-xs text-gray-400 italic mt-1">
            You have no published quizzes.{' '}
            <a href="/client/quizzes/create" className="text-primary-600 dark:text-primary-400 hover:underline">Create one</a>.
          </p>
        )}
      </div>
    </div>
  );
}
