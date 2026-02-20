import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, User, BookOpen, MessageCircle,
  LogOut, Sun, Moon, TrendingUp, PlusCircle,
  ClipboardList, Rocket, Building2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { messageApi, notificationApi } from '../../api/client';

// ─── Badge helper — Instagram-style red dot on the icon ───────────────────────
function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[1rem] px-0.5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none ring-2 ring-white dark:ring-gray-900 pointer-events-none">
      {count > 9 ? '9+' : count}
    </span>
  );
}

// ─── Nav item with optional badge ─────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, end = false, badge }: {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  badge?: number;
}) {
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
      <div className="relative shrink-0">
        <Icon size={18} />
        <Badge count={badge ?? 0} />
      </div>
      {label}
    </NavLink>
  );
}

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isCommercial = user?.client_type === 'commercial';
  const isEntreprise = user?.client_type === 'entreprise';

  // ── Unread messages (10s — conversational speed) ─────────────────────────
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: messageApi.getUnreadCount,
    refetchInterval: 10000,
  });

  // ── Commercial notification counts (60s polling) ─────────────────────────
  const { data: newOffersCount = 0 } = useQuery({
    queryKey: ['notif-new-offers'],
    queryFn: notificationApi.newJobOffersCount,
    enabled: isCommercial,
    refetchInterval: 60000,
  });

  const { data: appActionCount = 0 } = useQuery({
    queryKey: ['notif-app-actions'],
    queryFn: notificationApi.applicationActionCount,
    enabled: isCommercial,
    refetchInterval: 60000,
  });

  const { data: unstartedQuizzes = 0 } = useQuery({
    queryKey: ['notif-unstarted-q'],
    queryFn: notificationApi.unstartedQuizzesCount,
    enabled: isCommercial,
    refetchInterval: 60000,
  });

  // ── Entreprise notification counts (60s polling) ──────────────────────────
  const { data: pendingApps = 0 } = useQuery({
    queryKey: ['notif-pending-apps'],
    queryFn: notificationApi.pendingApplicationsCount,
    enabled: isEntreprise,
    refetchInterval: 60000,
  });

  const { data: unreviewedSubs = 0 } = useQuery({
    queryKey: ['notif-unreviewed-q'],
    queryFn: notificationApi.unreviewedSubmissionsCount,
    enabled: isEntreprise,
    refetchInterval: 60000,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
              <NavItem to="/client/profile"          icon={User}          label="My Profile"       end />
              <NavItem to="/client/job-offers"       icon={Briefcase}     label="Job Offers"       end badge={newOffersCount} />
              <NavItem to="/client/my-applications"  icon={ClipboardList} label="My Applications"  end badge={appActionCount} />
              <NavItem to="/client/missions"         icon={Rocket}        label="My Missions"      end />
              <NavItem to="/client/quizzes"          icon={BookOpen}      label="My Quizzes"       end badge={unstartedQuizzes} />
            </>
          )}

          {isEntreprise && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Manage</div>
              <NavItem to="/client/company-profile"  icon={Building2}     label="Company Profile"  end />
              <NavItem to="/client/job-offers"       icon={Briefcase}     label="Job Offers"       end badge={pendingApps} />
              <NavItem to="/client/job-offers/create" icon={PlusCircle}   label="Post Job"         end />
              <NavItem to="/client/quizzes"          icon={BookOpen}      label="Quizzes"          end badge={unreviewedSubs} />
              <NavItem to="/client/talent"           icon={TrendingUp}    label="Find Talent"      end />
            </>
          )}

          <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Messaging</div>
          <NavItem to="/client/messages" icon={MessageCircle} label="Messages" end badge={unreadCount} />
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
