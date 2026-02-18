import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Search, Shield, User, ChevronDown } from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';
import type { User as UserType } from '../../types/auth';

export default function UsersIndex() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await api.get('/api/users');
      return r.data.data as UserType[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.put(`/api/users/${id}`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const filtered = (users ?? []).filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = filtered.filter(u => u.role === 'admin').length;
  const userCount = filtered.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {adminCount} admin{adminCount !== 1 ? 's' : ''} · {userCount} user{userCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="card py-3">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-9 py-2"
          />
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
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  onRoleChange={(role) => updateRoleMutation.mutate({ id: user.id, role })}
                  isUpdating={updateRoleMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserRow({ user, onRoleChange, isUpdating }: {
  user: UserType;
  onRoleChange: (role: string) => void;
  isUpdating: boolean;
}) {
  const isAdmin = user.role === 'admin';
  const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleRoleToggle = () => {
    const newRole = isAdmin ? 'user' : 'admin';
    if (window.confirm(`Change ${user.name} to ${newRole}?`)) {
      onRoleChange(newRole);
    }
  };

  return (
    <tr className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isAdmin ? 'bg-indigo-500' : 'bg-gray-400 dark:bg-gray-600'}`}>
            {initials}
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isAdmin
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {isAdmin ? <Shield size={10} /> : <User size={10} />}
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-400 text-xs">{formatRelativeTime(user.created_at ?? '')}</td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleRoleToggle}
          disabled={isUpdating}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
            isAdmin
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
          }`}
        >
          <ChevronDown size={12} />
          {isAdmin ? 'Demote to User' : 'Promote to Admin'}
        </button>
      </td>
    </tr>
  );
}
