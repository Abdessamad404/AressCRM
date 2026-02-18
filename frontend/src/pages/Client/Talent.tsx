import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { profileApi } from '../../api/client';
import { MapPin, TrendingUp, Briefcase, MessageCircle, Star, ChevronRight } from 'lucide-react';

export default function TalentBrowser() {
  const [sector, setSector] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['commercial-profiles', sector, location, page],
    queryFn: () => profileApi.listProfiles({
      sector: sector || undefined,
      location: location || undefined,
      page,
    }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find Talent</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Browse commercial profiles and find your next sales partner
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          value={sector}
          onChange={(e) => { setSector(e.target.value); setPage(1); }}
          placeholder="Sector (e.g. SaaS)..."
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 w-44"
        />
        <input
          value={location}
          onChange={(e) => { setLocation(e.target.value); setPage(1); }}
          placeholder="Location..."
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 w-44"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (data?.data?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No commercial profiles found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.data.map((profile) => (
            <div key={profile.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow">
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-lg shrink-0">
                    {profile.user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{profile.user?.name}</p>
                  {profile.title && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.title}</p>}
                </div>
              </div>

              {profile.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin size={11} /> {profile.location}
                  </span>
                )}
                {profile.experience_years != null && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Briefcase size={11} /> {profile.experience_years}y exp.
                  </span>
                )}
                {profile.commission_rate != null && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium">
                    {profile.commission_rate}%
                  </span>
                )}
              </div>

              {/* Skills */}
              {(profile.skills?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {profile.skills?.slice(0, 4).map((skill, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {skill}
                    </span>
                  ))}
                  {(profile.skills?.length ?? 0) > 4 && (
                    <span className="text-xs text-gray-400">+{(profile.skills?.length ?? 0) - 4}</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  to={`/client/messages/${profile.user_id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <MessageCircle size={13} /> Contact
                </Link>
                <Link
                  to={`/client/profiles/${profile.id}`}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 transition-colors"
                >
                  View <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {data?.last_page}</span>
          <button onClick={() => setPage((p) => Math.min(data?.last_page ?? 1, p + 1))} disabled={page === data?.last_page}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
