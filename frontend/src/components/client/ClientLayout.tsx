import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, User, BookOpen, MessageCircle,
  LogOut, Sun, Moon, Bell, ChevronDown, TrendingUp, PlusCircle,
  ClipboardList, Rocket, Building2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { messageApi } from '../../api/client';

function NavItem({ to, icon: Icon, label, end = false }: { to: string; icon: React.ElementType; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: messageApi.getUnreadCount,
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isCommercial = user?.client_type === 'commercial';
  const isEntreprise = user?.client_type === 'entreprise';

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 fixed h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">A</span>
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">Aress</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 font-medium capitalize">
              {user?.client_type}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavItem to="/client/dashboard" icon={LayoutDashboard} label="Dashboard" end />

          {isCommercial && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Career</div>
              <NavItem to="/client/profile" icon={User} label="My Profile" end />
              <NavItem to="/client/job-offers" icon={Briefcase} label="Job Offers" end />
              <NavItem to="/client/my-applications" icon={ClipboardList} label="My Applications" end />
              <NavItem to="/client/missions" icon={Rocket} label="My Missions" end />
              <NavItem to="/client/quizzes" icon={BookOpen} label="My Quizzes" end />
            </>
          )}

          {isEntreprise && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Manage</div>
              <NavItem to="/client/company-profile" icon={Building2} label="Company Profile" end />
              <NavItem to="/client/job-offers" icon={Briefcase} label="Job Offers" end />
              <NavItem to="/client/job-offers/create" icon={PlusCircle} label="Post Job" end />
              <NavItem to="/client/quizzes" icon={BookOpen} label="Quizzes" end />
              <NavItem to="/client/talent" icon={TrendingUp} label="Find Talent" end />
            </>
          )}

          <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Messaging</div>
          <NavLink
            to="/client/messages"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`
            }
          >
            <MessageCircle size={18} />
            Messages
            {(unreadCount ?? 0) > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </NavLink>
        </nav>

        {/* User info + actions */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>

          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
