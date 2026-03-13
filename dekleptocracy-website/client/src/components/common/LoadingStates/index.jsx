import './LoadingStates.css';

/**
 * PageLoader - Full-page loading spinner with message
 * @param {Object} props
 * @param {string} [props.message='Loading...'] - Loading message to display
 * @returns {JSX.Element}
 */
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="page-loader" role="status" aria-label="Loading page">
    <div className="page-loader-content">
      <svg className="loader-spinner" viewBox="0 0 50 50" aria-hidden="true">
        <circle
          className="path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
        />
      </svg>
      <p className="loader-text">{message}</p>
    </div>
  </div>
);

/**
 * RefreshingOverlay - Subtle overlay indicator for background updates
 * @param {Object} props
 * @param {string} [props.message='Updating...'] - Screen reader message
 * @returns {JSX.Element}
 */
export const RefreshingOverlay = ({ message = 'Updating...' }) => (
  <div className="refreshing-overlay" aria-live="polite" aria-busy="true">
    <div className="refreshing-indicator">
      <span className="dot" aria-hidden="true" />
      <span className="dot" aria-hidden="true" />
      <span className="dot" aria-hidden="true" />
      <span className="sr-only">{message}</span>
    </div>
  </div>
);

/**
 * ButtonLoader - Button with integrated loading state
 * @param {Object} props
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {React.ReactNode} props.children - Button content
 * @returns {JSX.Element}
 */
export const ButtonLoader = ({ loading, children, ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className={`button-loader ${loading ? 'button-loader--loading' : ''}`}
    aria-busy={loading}
  >
    {loading ? (
      <>
        <span className="button-spinner" aria-hidden="true" />
        <span className="sr-only">Loading...</span>
      </>
    ) : (
      children
    )}
  </button>
);

/**
 * InlineLoader - Small spinner for inline loading states
 * @param {Object} props
 * @param {'small'|'medium'|'large'} [props.size='small'] - Spinner size
 * @param {string} [props.message] - Screen reader message
 * @returns {JSX.Element}
 */
export const InlineLoader = ({ size = 'small', message }) => {
  const sizeClass = `inline-loader--${size}`;

  return (
    <div className={`inline-loader ${sizeClass}`} role="status" aria-busy="true">
      <span className="inline-spinner" aria-hidden="true" />
      {message && <span className="sr-only">{message}</span>}
    </div>
  );
};

/**
 * ProgressBar - Horizontal progress indicator
 * @param {Object} props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.label - Accessible label for the progress bar
 * @param {boolean} [props.showPercentage=true] - Whether to show percentage text
 * @returns {JSX.Element}
 */
export const ProgressBar = ({ progress, label, showPercentage = true }) => (
  <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" aria-label={label}>
    <div
      className="progress-bar-fill"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    >
      {showPercentage && (
        <span className="progress-percentage">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  </div>
);

export default PageLoader;
