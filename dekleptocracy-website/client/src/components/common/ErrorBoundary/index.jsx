import { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleRetry
        })
      ) : (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          sectionName={this.props.sectionName}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, onRetry, sectionName }) => {
  const errorDetails = {
    message: error?.message || 'An unexpected error occurred',
    stack: error?.stack,
    componentStack: errorInfo?.componentStack
  };

  return (
    <div className="error-fallback" role="alert" aria-labelledby="error-fallback-title">
      <div className="error-fallback-content">
        <div className="error-icon" aria-hidden="true">⚠️</div>

        <h2 id="error-fallback-title" className="error-title">
          {sectionName ? `Unable to load ${sectionName}` : 'Something went wrong'}
        </h2>

        <p className="error-message">
          {errorDetails.message}
        </p>

        {process.env.NODE_ENV === 'development' && (errorDetails.stack || errorDetails.componentStack) && (
          <details className="error-details">
            <summary>Technical details (development only)</summary>
            <pre className="error-stack">
              {errorDetails.stack}
              {errorDetails.componentStack && '\n\nComponent Stack:\n' + errorDetails.componentStack}
            </pre>
          </details>
        )}

        <div className="error-actions">
          <button
            className="retry-btn"
            onClick={onRetry}
            aria-label="Try loading the content again"
          >
            Try Again
          </button>

          <button
            className="report-btn"
            onClick={() => window.open('/contact', '_blank')}
            aria-label="Report this issue to the support team"
          >
            Report Issue
          </button>
        </div>

        <p className="error-help">
          If this problem persists, please{' '}
          <a href="/contact" className="error-link">
            contact support
          </a>
        </p>
      </div>
    </div>
  );
};

export const SectionErrorBoundary = ({ children, sectionName, fallbackData }) => (
  <ErrorBoundary
    sectionName={sectionName}
    fallback={({ error, retry }) => (
      <div className="section-error">
        <p className="section-error-message">
          Unable to load {sectionName}. <span className="error-text">{error?.message || 'Unknown error'}</span>
        </p>
        {fallbackData && (
          <div className="fallback-content">
            {fallbackData}
          </div>
        )}
        <button
          className="section-retry-btn"
          onClick={retry}
          aria-label={`Retry loading ${sectionName}`}
        >
          Try Again
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
