import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Briefcase, FileText, MessageSquare, TrendingUp, Building2, CheckCircle, Clock } from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';

interface JobOfferProgress {
  id: string;
  title: string;
  status: string;
  quiz_count: number;
  submission_count: number;
  submissions: {
    id: string;
    candidate_name: string | null;
    candidate_email: string | null;
    quiz_title: string;
    submitted_at: string | null;
  }[];
}

interface SubmissionProgress {
  id: string;
  quiz_title: string;
  job_offer_title: string;
  entreprise_name: string;
  submitted_at: string | null;
}

interface Partner {
  id: string;
  name: string;
  client_type: string | null;
}

interface ProgressData {
  user: { id: string; name: string; email: string; client_type: string | null };
  type: 'entreprise' | 'commercial';
  // entreprise
  job_offers?: JobOfferProgress[];
  // commercial
  submissions?: SubmissionProgress[];
  message_count?: number;
  partners?: Partner[];
  totals: Record<string, number>;
}

export default function ClientProgress() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['client-progress', id],
    queryFn: async (): Promise<ProgressData> => {
      const r = await api.get(`/api/users/${id}/progress`);
      return r.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Could not load client progress.</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4 inline-flex">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{data.user.name}</h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              data.type === 'entreprise'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {data.type === 'entreprise' ? <Building2 size={10} /> : <TrendingUp size={10} />}
              {data.type}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.user.email}</p>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(data.totals).map(([key, val]) => (
          <div key={key} className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{val}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{key.replace(/_/g, ' ')}</p>
          </div>
        ))}
      </div>

      {/* Entreprise: job offers + submissions */}
      {data.type === 'entreprise' && data.job_offers && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase size={16} className="text-violet-500" /> Job Offers & Candidate Submissions
          </h2>
          {data.job_offers.length === 0 && (
            <div className="card text-center py-8 text-gray-400 text-sm">No job offers posted yet.</div>
          )}
          {data.job_offers.map(offer => (
            <div key={offer.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{offer.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {offer.quiz_count} quiz{offer.quiz_count !== 1 ? 'zes' : ''} · {offer.submission_count} submission{offer.submission_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  offer.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>{offer.status}</span>
              </div>

              {offer.submissions.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Candidates</p>
                  <div className="space-y-2">
                    {offer.submissions.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 text-sm">
                        <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{sub.candidate_name ?? '—'}</span>
                          <span className="text-gray-400 mx-1">·</span>
                          <span className="text-gray-500 text-xs">{sub.quiz_title}</span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                          <Clock size={11} />
                          {sub.submitted_at ? formatRelativeTime(sub.submitted_at) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Commercial: submissions + message partners */}
      {data.type === 'commercial' && (
        <>
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText size={16} className="text-emerald-500" /> Quiz Submissions
            </h2>
            {(!data.submissions || data.submissions.length === 0) ? (
              <div className="card text-center py-8 text-gray-400 text-sm">No quiz submissions yet.</div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Quiz</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Job Offer</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Entreprise</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.submissions.map(sub => (
                      <tr key={sub.id} className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{sub.quiz_title}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{sub.job_offer_title}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{sub.entreprise_name}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {sub.submitted_at ? formatRelativeTime(sub.submitted_at) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {data.partners && data.partners.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-500" /> Messaging Partners
                <span className="text-xs font-normal text-gray-400">({data.message_count} total messages)</span>
              </h2>
              <div className="card flex flex-wrap gap-2">
                {data.partners.map(p => (
                  <span key={p.id} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    p.client_type === 'entreprise'
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {p.client_type === 'entreprise' ? <Building2 size={10} /> : <TrendingUp size={10} />}
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
