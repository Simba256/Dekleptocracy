import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import './OfflineIndicator.css';

/**
 * OfflineIndicator - Banner shown when user loses internet connection
 * Uses the online status hook to detect connectivity changes.
 * @returns {JSX.Element|null}
 */
export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="offline-indicator" role="alert" aria-live="assertive">
      <span className="offline-icon" aria-hidden="true">
        📡
      </span>
      <span className="offline-text">You're offline. Some features may not work.</span>
    </div>
  );
};

/**
 * OfflineFallback - Wrapper component for graceful offline degradation
 * Shows cached data notice or full offline screen based on data availability.
 * @param {Object} props
 * @param {Object} [props.cachedData] - Cached data object with timestamp property
 * @param {React.ReactNode} props.children - Content to render when online or cached data exists
 * @param {Function} [props.onRetry] - Custom retry callback (defaults to page reload)
 * @returns {JSX.Element}
 */
export const OfflineFallback = ({ cachedData, children, onRetry }) => {
  const isOnline = useOnlineStatus();

  if (!isOnline && !cachedData) {
    return (
      <div className="offline-fallback" role="alert" aria-live="polite">
        <div className="offline-fallback-content">
          <div className="offline-icon-large" aria-hidden="true">
            📡
          </div>
          <h2 className="offline-fallback-title">You're offline</h2>
          <p className="offline-fallback-message">
            Connect to the internet to see the latest data.
          </p>
          <button
            className="offline-retry-btn"
            onClick={onRetry || (() => window.location.reload())}
            aria-label="Retry connecting to the internet"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isOnline && cachedData) {
    return (
      <div className="cached-data-notice">
        <div className="offline-indicator" role="status" aria-live="polite">
          <span className="offline-icon" aria-hidden="true">
            📡
          </span>
          <span className="offline-text">
            Showing cached data from {new Date(cachedData.timestamp).toLocaleString()}
          </span>
        </div>
        {children}
      </div>
    );
  }

  return children;
};

export default OfflineIndicator;
