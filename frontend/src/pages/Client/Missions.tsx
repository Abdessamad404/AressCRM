import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { applicationApi } from '../../api/client';
import {
  Briefcase, MapPin, TrendingUp, Clock,
  Loader2, RocketIcon, BookOpen, MessageCircle, ChevronRight,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';
import type { Application } from '../../types/client';

export default function Missions() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-missions'],
    queryFn: () => applicationApi.myApplications({ status: 'accepted' }),
  });

  const missions = data?.data ?? [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Missions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Your active and ongoing missions
        </p>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{missions.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active Missions</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {missions.filter((m) => m.job_offer?.compensation_type === 'commission').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Commission-based</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {missions.filter((m) => m.job_offer?.compensation_type === 'fixed_budget').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fixed Budget</p>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : missions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RocketIcon size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No active missions yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">
            Apply to job offers and get accepted to see your missions here
          </p>
          <Link
            to="/client/job-offers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Briefcase size={15} /> Browse Job Offers
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}

function MissionCard({ mission }: { mission: Application }) {
  const offer = mission.job_offer;
  if (!offer) return null;

  const isCommission = offer.compensation_type === 'commission';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 to-primary-500" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Company avatar */}
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-lg shrink-0">
            {offer.company_name[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  to={`/client/job-offers/${offer.id}`}
                  className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {offer.title}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{offer.company_name}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Active
              </span>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {offer.location && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin size={13} /> {offer.location}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={13} />
                {isCommission
                  ? `${offer.commission_rate ?? '?'}% commission`
                  : `€${Number(offer.budget_amount ?? 0).toLocaleString()} fixed`}
              </span>
              {offer.contract_duration && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <Clock size={13} />
                  {DURATION_LABELS[offer.contract_duration] ?? offer.contract_duration}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Clock size={13} /> Accepted {formatRelativeTime(mission.updated_at)}
              </span>
            </div>

            {/* Entreprise notes */}
            {mission.entreprise_notes && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Instructions from employer: </span>
                  {mission.entreprise_notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action footer */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Link
            to={`/client/job-offers/${offer.id}`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <Briefcase size={14} /> View Offer
          </Link>
          {offer.quizzes && offer.quizzes.length > 0 && (
            <Link
              to={`/client/quizzes/${offer.quizzes[0].id}`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
            >
              <BookOpen size={14} /> Training Quiz
            </Link>
          )}
          {offer.user?.id && (
            <Link
              to={`/client/messages/${offer.user.id}`}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <MessageCircle size={14} /> Message Employer
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

const DURATION_LABELS: Record<string, string> = {
  '1month':  '1 Month',
  '3months': '3 Months',
  '6months': '6 Months',
  'ongoing': 'Ongoing',
};
