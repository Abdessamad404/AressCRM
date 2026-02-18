import { Component, type ReactNode } from 'react';
import api from '../api/axios';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Report to backend silently
    api.post('/api/exceptions/report', {
      title: `${error.name}: ${error.message}`.slice(0, 255),
      description: error.message,
      exception_class: error.name,
      stack_trace: error.stack + '\n\nComponent Stack:\n' + info.componentStack,
      url: window.location.href,
      user_agent: navigator.userAgent,
      environment: import.meta.env.MODE,
    }).catch(() => {/* ignore reporting errors */});
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-rose-500 text-2xl">!</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This error has been automatically reported and our team has been notified.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
