import './LoadingSpinner.css';

/**
 * Loading Spinner Component
 * @param {Object} props
 * @param {string} props.message - Loading message
 * @param {string} props.size - Spinner size: 'small', 'medium', 'large'
 * @param {boolean} props.fullPage - Whether to show as full page overlay
 */
export function LoadingSpinner({
  message = 'Loading...',
  size = 'medium',
  fullPage = false
}) {
  const spinnerClass = `loading-spinner loading-spinner--${size}`;

  const content = (
    <div className="loading-spinner-content">
      <div className={spinnerClass}></div>
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="loading-spinner-fullpage">
        {content}
      </div>
    );
  }

  return (
    <div className="loading-spinner-container">
      {content}
    </div>
  );
}

export default LoadingSpinner;
