import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import ClientLayout from './components/client/ClientLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeadsIndex from './pages/Leads/Index';
import LeadCreate from './pages/Leads/Create';
import LeadShow from './pages/Leads/Show';
import LeadEdit from './pages/Leads/Edit';
import LeadKanban from './pages/Leads/Kanban';
import BugsIndex from './pages/Bugs/Index';
import BugShow from './pages/Bugs/Show';
import UsersIndex from './pages/Users/Index';
import ClientProgress from './pages/Admin/ClientProgress';

// Client pages
import ClientDashboard from './pages/Client/Dashboard';
import JobOffersPage from './pages/Client/JobOffers';
import JobOfferForm from './pages/Client/JobOfferForm';
import CommercialProfile from './pages/Client/Profile';
import QuizzesPage from './pages/Client/Quizzes';
import QuizForm from './pages/Client/QuizForm';
import QuizTake from './pages/Client/QuizTake';
import TalentBrowser from './pages/Client/Talent';
import { ConversationsList, MessageThread } from './pages/Client/Messages';
import QuizSubmissions from './pages/Client/QuizSubmissions';

// ─── Route guards ─────────────────────────────────────────────────────────────

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
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <>{children}</>;
  if (user?.client_type) return <Navigate to="/client/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function RootRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.client_type) return <Navigate to="/client/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Admin / internal backoffice */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/leads"          element={<LeadsIndex />} />
        <Route path="/leads/create"   element={<LeadCreate />} />
        <Route path="/leads/kanban"   element={<LeadKanban />} />
        <Route path="/leads/:id"      element={<LeadShow />} />
        <Route path="/leads/:id/edit" element={<LeadEdit />} />

        <Route path="/bugs"    element={<BugsIndex />} />
        <Route path="/bugs/:id" element={<BugShow />} />

        <Route path="/users" element={<AdminRoute><UsersIndex /></AdminRoute>} />
        <Route path="/users/:id/progress" element={<AdminRoute><ClientProgress /></AdminRoute>} />
      </Route>

      {/* Client layout (commercial + entreprise) */}
      <Route element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
        <Route path="/client/dashboard" element={<ClientDashboard />} />

        {/* Job Offers */}
        <Route path="/client/job-offers"          element={<JobOffersPage />} />
        <Route path="/client/job-offers/create"   element={<JobOfferForm />} />
        <Route path="/client/job-offers/:id/edit" element={<JobOfferForm />} />

        {/* Commercial profile */}
        <Route path="/client/profile" element={<CommercialProfile />} />

        {/* Quizzes */}
        <Route path="/client/quizzes"                    element={<QuizzesPage />} />
        <Route path="/client/quizzes/create"             element={<QuizForm />} />
        <Route path="/client/quizzes/:id"                element={<QuizTake />} />
        <Route path="/client/quizzes/:id/edit"           element={<QuizForm />} />
        <Route path="/client/quizzes/:id/submissions"    element={<QuizSubmissions />} />

        {/* Talent browser (entreprise) */}
        <Route path="/client/talent" element={<TalentBrowser />} />

        {/* Messages */}
        <Route path="/client/messages"            element={<ConversationsList />} />
        <Route path="/client/messages/:partnerId" element={<MessageThread />} />
      </Route>

      {/* Root catch-all */}
      <Route index element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
