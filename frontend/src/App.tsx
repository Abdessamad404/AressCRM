import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeadsIndex from './pages/Leads/Index';
import LeadCreate from './pages/Leads/Create';
import LeadShow from './pages/Leads/Show';
import LeadEdit from './pages/Leads/Edit';
import LeadKanban from './pages/Leads/Kanban';
import BugsIndex from './pages/Bugs/Index';
import BugCreate from './pages/Bugs/Create';
import BugShow from './pages/Bugs/Show';
import BugEdit from './pages/Bugs/Edit';
import UsersIndex from './pages/Users/Index';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/leads" element={<LeadsIndex />} />
        <Route path="/leads/create" element={<LeadCreate />} />
        <Route path="/leads/kanban" element={<LeadKanban />} />
        <Route path="/leads/:id" element={<LeadShow />} />
        <Route path="/leads/:id/edit" element={<LeadEdit />} />

        <Route path="/bugs" element={<BugsIndex />} />
        <Route path="/bugs/create" element={<BugCreate />} />
        <Route path="/bugs/:id" element={<BugShow />} />
        <Route path="/bugs/:id/edit" element={<BugEdit />} />

        <Route path="/users" element={<AdminRoute><UsersIndex /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
