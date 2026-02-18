import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import './index.css';
import api from './api/axios';

// Global error handler for unhandled promise rejections and runtime errors
const reportError = (title: string, detail: string, stack?: string) => {
  api.post('/api/exceptions/report', {
    title: title.slice(0, 255),
    description: detail,
    exception_class: 'UnhandledError',
    stack_trace: stack,
    url: window.location.href,
    user_agent: navigator.userAgent,
    environment: import.meta.env.MODE,
  }).catch(() => {/* swallow */});
};

window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message ?? String(e.reason);
  reportError(`UnhandledPromiseRejection: ${msg}`, msg, e.reason?.stack);
});

window.addEventListener('error', (e) => {
  if (e.error) reportError(`${e.error.name}: ${e.error.message}`, e.error.message, e.error.stack);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
