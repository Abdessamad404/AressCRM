import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { jobOfferApi, quizApi, messageApi } from '../../api/client';
import { Briefcase, BookOpen, MessageCircle, TrendingUp, ArrowRight, Star, Clock } from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const isCommercial = user?.client_type === 'commercial';
  const isEntreprise = user?.client_type === 'entreprise';

  const { data: jobOffersData } = useQuery({
    queryKey: ['client-job-offers'],
    queryFn: () => jobOfferApi.list({ page: 1 }),
  });

  const { data: quizzesData } = useQuery({
    queryKey: ['client-quizzes'],
    queryFn: () => quizApi.list({ page: 1 }),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: messageApi.getUnreadCount,
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageApi.getConversations,
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bonjour, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {isCommercial
            ? 'Découvrez les nouvelles offres et gérez votre profil commercial.'
            : 'Gérez vos offres d\'emploi, vos quizzes et votre équipe commerciale.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={Briefcase}
          label={isEntreprise ? 'My Job Offers' : 'Open Positions'}
          value={jobOffersData?.total ?? 0}
          color="blue"
          to="/client/job-offers"
        />
        <StatCard
          icon={BookOpen}
          label={isEntreprise ? 'My Quizzes' : 'Available Quizzes'}
          value={quizzesData?.total ?? 0}
          color="purple"
          to="/client/quizzes"
        />
        <StatCard
          icon={MessageCircle}
          label="Unread Messages"
          value={unreadCount ?? 0}
          color={unreadCount ? 'orange' : 'green'}
          to="/client/messages"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversations"
          value={conversations?.length ?? 0}
          color="green"
          to="/client/messages"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Job Offers */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {isEntreprise ? 'My Job Offers' : 'Latest Offers'}
            </h2>
            <Link to="/client/job-offers" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {(jobOffersData?.data?.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              {isEntreprise ? (
                <>No job offers yet. <Link to="/client/job-offers/create" className="text-primary-600 dark:text-primary-400 hover:underline">Post one now</Link></>
              ) : (
                'No job offers available right now.'
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {jobOffersData?.data?.slice(0, 4).map((offer) => (
                <Link
                  key={offer.id}
                  to={`/client/job-offers/${offer.id}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Briefcase size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {offer.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{offer.company_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${
                    offer.status === 'published'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : offer.status === 'draft'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {offer.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Messages</h2>
            <Link to="/client/messages" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {(conversations?.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No conversations yet.</div>
          ) : (
            <div className="space-y-3">
              {conversations?.slice(0, 4).map((conv) => (
                <Link
                  key={conv.id}
                  to={`/client/messages/${conv.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm shrink-0">
                    {conv.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{conv.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {conv.last_message?.content ?? 'No messages yet'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-bold shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color, to
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'purple' | 'green' | 'orange';
  to: string;
}) {
  const colors = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'text-blue-600 dark:text-blue-400',   num: 'text-blue-700 dark:text-blue-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', num: 'text-purple-700 dark:text-purple-300' },
    green:  { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-600 dark:text-green-400', num: 'text-green-700 dark:text-green-300' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400', num: 'text-orange-700 dark:text-orange-300' },
  };
  const c = colors[color];

  return (
    <Link to={to} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
        <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-400 transition-colors" />
      </div>
      <p className={`text-2xl font-bold ${c.num}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{label}</p>
    </Link>
  );
}
