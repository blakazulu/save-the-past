import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logger } from '@/lib/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-dvh bg-bg flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
            <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-earth mb-2">
              Something went wrong
            </h2>
            <p className="text-text-secondary mb-6">
              An unexpected error occurred. Please try again.
            </p>
            {this.state.error && (
              <pre className="text-md text-left bg-sand p-3 rounded-lg mb-4 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 border border-sand text-earth rounded-xl font-medium hover:bg-sand transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleRetry}
                className="flex-1 py-3 bg-terracotta text-white rounded-xl font-semibold hover:bg-clay transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
