import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    // Optionally send error details to an external monitoring service here
    
    // Optionally send to logging service
    // You can add error reporting service here (e.g., Sentry, LogRocket, etc.)
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</div>
            <div className="text-sm text-gray-600 mb-4">An unexpected error occurred. Please try again.</div>
            {process.env.NODE_ENV === 'development' && error && (
              <div className="text-xs text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200 text-left">
                <div className="font-semibold mb-1">Error Details (Dev Mode):</div>
                <div className="font-mono text-xs">
                  {error?.message || error?.toString() || String(error)}
                </div>
                {error?.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Stack Trace</summary>
                    <pre className="text-xs mt-1 overflow-auto max-h-40">{error.stack}</pre>
                  </details>
                )}
                {error?.response && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">API Error Response</summary>
                    <pre className="text-xs mt-1 overflow-auto max-h-40">
                      {JSON.stringify(error.response?.data || {}, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-md bg-black text-white"
              >
                Reload
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-800"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


