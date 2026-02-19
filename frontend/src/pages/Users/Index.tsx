import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Search, Shield, Briefcase, TrendingUp, BarChart2 } from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import type { User as UserType } from '../../types/auth';

function roleBadge(user: UserType) {
  if (user.role === 'admin') {
    return { label: 'Admin', icon: <Shield size={10} />, cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' };
  }
  if (user.client_type === 'entreprise') {
    return { label: 'Entreprise', icon: <Briefcase size={10} />, cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' };
  }
  if (user.client_type === 'commercial') {
    return { label: 'Commercial', icon: <TrendingUp size={10} />, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  }
  return { label: 'User', icon: <Shield size={10} />, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
}

export default function UsersIndex() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'entreprise' | 'commercial'>('all');
  const { user: me } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await api.get('/api/users');
      return r.data.data as UserType[];
    },
  });

  const adminCount      = (users ?? []).filter(u => u.role === 'admin').length;
  const entrepriseCount = (users ?? []).filter(u => u.client_type === 'entreprise').length;
  const commercialCount = (users ?? []).filter(u => u.client_type === 'commercial').length;


  // Only show admin + client accounts (hide internal role=user/no client_type rows)
  const relevant = (users ?? []).filter(u => u.role === 'admin' || !!u.client_type);

  const filtered = relevant.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all'        ? true :
      filter === 'admin'      ? u.role === 'admin' :
      filter === 'entreprise' ? u.client_type === 'entreprise' :
      filter === 'commercial' ? u.client_type === 'commercial' : true;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team & Clients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {adminCount} admin · {entrepriseCount} entreprise · {commercialCount} commercial
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-9 py-2"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'admin', 'entreprise', 'commercial'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No users found.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Member</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === me?.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserRow({ user, isSelf }: { user: UserType; isSelf: boolean }) {
  const badge    = roleBadge(user);
  const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const isClient = !!user.client_type;

  const avatarColor =
    user.role === 'admin'            ? 'bg-indigo-500'  :
    user.client_type === 'entreprise'? 'bg-violet-500'  :
    user.client_type === 'commercial'? 'bg-emerald-500' :
    'bg-gray-400 dark:bg-gray-600';

  return (
    <tr className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor}`}>
            {initials}
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            {user.name}
            {isSelf && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
          {badge.icon}
          {badge.label}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-400 text-xs">{formatRelativeTime(user.created_at ?? '')}</td>
      <td className="px-4 py-3 text-right">
        {isClient && (
          <Link
            to={`/users/${user.id}/progress`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <BarChart2 size={12} /> View Progress
          </Link>
        )}
      </td>
    </tr>
  );
}
