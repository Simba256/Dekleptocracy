import './ErrorMessage.css';

/**
 * Error Message Component
 * @param {Object} props
 * @param {string} props.message - Error message
 * @param {Function} props.onRetry - Optional retry callback
 * @param {boolean} props.fullPage - Whether to show as full page
 */
export function ErrorMessage({
  message = 'An error occurred',
  onRetry,
  fullPage = false
}) {
  const content = (
    <div className="error-message-content">
      <div className="error-message-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="error-message-text">{message}</p>
      {onRetry && (
        <button className="error-message-retry-btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="error-message-fullpage">
        {content}
      </div>
    );
  }

  return (
    <div className="error-message-container">
      {content}
    </div>
  );
}

export default ErrorMessage;
