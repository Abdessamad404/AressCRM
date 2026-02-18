import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Search, Shield, User } from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';
import type { User as UserType } from '../../types/auth';

export default function UsersIndex() {
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', { search }],
    queryFn: async () => {
      const r = await api.get('/api/users', { params: search ? { search } : {} });
      return r.data.data as UserType[];
    },
  });

  const filtered = (users ?? []).filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filtered.length} team members</p>
        </div>
      </div>

      {/* Search */}
      <div className="card py-3">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="input pl-9 py-2"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No users found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ user }: { user: UserType }) {
  const isAdmin = user.role === 'admin';
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="card flex items-start gap-4 hover:shadow-md transition-shadow">
      {/* Avatar */}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isAdmin ? 'bg-indigo-500' : 'bg-gray-400 dark:bg-gray-600'}`}>
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{user.name}</p>
          {isAdmin && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 flex-shrink-0">
              <Shield size={10} /> Admin
            </span>
          )}
          {!isAdmin && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 flex-shrink-0">
              <User size={10} /> User
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
        <p className="text-xs text-gray-400 mt-1">
          Joined {formatRelativeTime(user.created_at ?? '')}
        </p>
      </div>
    </div>
  );
}
