import { useState } from 'react';

/**
 * StateDetailPanel - Side panel showing detailed state information
 * Displays top price shocks, average impact, and drill-down options.
 * @param {Object} props
 * @param {string} props.stateCode - State name or 'nationwide'
 * @param {Object} props.stateData - State data with intensity, topShocks array
 * @param {Function} props.onClose - Callback to close the panel
 * @param {Function} [props.onDrillDown] - Callback for drill-down actions (stateCode, type: 'cities'|'timeline') => void
 * @returns {JSX.Element|null}
 */
const StateDetailPanel = ({ stateCode, stateData, onClose, onDrillDown }) => {
  const [loading, setLoading] = useState(false);

  if (!stateCode || !stateData) return null;

  const stats = stateData.topShocks || [];

  const handleViewCities = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onDrillDown?.(stateCode, 'cities');
    }, 500);
  };

  const handleViewHistory = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onDrillDown?.(stateCode, 'timeline');
    }, 500);
  };

  return (
    <div className="state-detail-panel">
      <button className="close-btn" onClick={onClose} aria-label="Close panel">
        ×
      </button>

      <div className="panel-header">
        <h3>{stateCode === 'nationwide' ? 'National' : stateCode}</h3>
        <div className="intensity-badge">
          {stateData.intensity > 70 ? 'High Impact' : 
           stateData.intensity > 40 ? 'Medium Impact' : 'Low Impact'}
        </div>
      </div>

      <div className="state-stats">
        <div className="stat-summary">
          <div className="stat-item">
            <span className="stat-label">Top Shock</span>
            <span className="stat-value">{stats[0]?.item || 'N/A'}</span>
            <span className={`stat-trend ${stats[0]?.change > 0 ? 'up' : 'down'}`}>
              {stats[0]?.change > 0 ? '+' : ''}{stats[0]?.change}%
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Avg. Impact</span>
            <span className="stat-value">+{stateData.intensity?.toFixed(1) || '15.2'}%</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Data Points</span>
            <span className="stat-value">{stats.length || 0}</span>
          </div>
        </div>

        {stats.length > 1 && (
          <div className="top-shocks-list">
            <h4>Top Shocks</h4>
            {stats.slice(0, 3).map((shock, index) => (
              <div key={index} className="shock-row">
                <span className="shock-icon">{shock.icon}</span>
                <span className="shock-name">{shock.item}</span>
                <span className={`shock-change ${shock.change > 0 ? 'up' : 'down'}`}>
                  {shock.change > 0 ? '+' : ''}{shock.change}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-actions">
        <button onClick={handleViewCities} disabled={loading}>
          {loading ? 'Loading...' : 'View Cities'}
        </button>
        <button onClick={handleViewHistory} disabled={loading}>
          {loading ? 'Loading...' : 'View History'}
        </button>
      </div>
    </div>
  );
};

export default StateDetailPanel;
