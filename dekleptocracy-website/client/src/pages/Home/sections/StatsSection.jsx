import { useHomepage } from '../../../context/HomepageContext';
import { useState, lazy } from 'react';
import Suspense from 'react';

const StateComparison = lazy(() => import('../../../components/modals/StateComparison'));

export function StatsSection() {
  const { state } = useHomepage();
  const { stats, selectedState } = state;
  const [showComparison, setShowComparison] = useState(false);

  const handleCloseComparison = () => setShowComparison(false);

  // Use API data with fallbacks
  const lobbying = stats.lobbying || { displayValue: '276K' };
  const consumerCost = stats.consumerCost || { displayValue: '$4,679', changeDisplay: '+28.42%' };
  const contributions = stats.contributions || { displayValue: '$9.2M', changeDisplay: '+18.6%' };
  const tariffRevenue = stats.tariffRevenue || { displayValue: '$6.7B' };

  return (
    <section className="stats-section" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">Key Statistics</h2>
      <div className="stats-container">
        {/* Lobbying Cases Tracked */}
        <div className="stat-card stat-card-large">
          <div className="stat-header">
            <h3 className="stat-title">Lobbying Cases Tracked</h3>
          </div>
          <div className="stat-value">{lobbying.displayValue}</div>
          <div className="stat-chart">
            <svg viewBox="0 0 300 100" className="line-chart">
              <path
                d="M 0 80 Q 30 70 60 65 T 120 55 Q 150 45 180 60 T 240 40 L 270 30 L 300 35"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2.5"
              />
              <path
                d="M 0 80 Q 30 70 60 65 T 120 55 Q 150 45 180 60 T 240 40 L 270 30 L 300 35 L 300 100 L 0 100 Z"
                fill="url(#gradient)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Consumer Cost Impact */}
        <div className="stat-card stat-card-pink">
          <div className="stat-icon">💳</div>
          <h3 className="stat-title-small">Consumer Cost Impact</h3>
          <div className="stat-value-medium">{consumerCost.displayValue}</div>
          <div className="stat-change stat-change-up">
            {String.fromCharCode(8593)} {consumerCost.changeDisplay || '+28.42%'} due to tariffs
          </div>
        </div>

        {/* Lobbyist Contributions */}
        <div className="stat-card stat-card-red">
          <div className="stat-icon">💰</div>
          <h3 className="stat-title-small">Lobbyist Contributions</h3>
          <div className="stat-value-medium">{contributions.displayValue}</div>
          <div className="stat-change stat-change-down">
            {String.fromCharCode(8595)} {contributions.changeDisplay || '+18.6%'}
          </div>
        </div>

        {/* Tariff Revenue */}
        <div className="stat-card stat-card-pink">
          <div className="stat-header">
            <h3 className="stat-title">Tariff Revenue</h3>
          </div>
          <div className="stat-value">{tariffRevenue.displayValue}</div>
          <p className="stat-description">Weekly revenue collected from tariffs on imported goods.</p>
          <div className="bar-chart">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <div key={index} className="bar-group">
                <div
                  className={`bar ${index === 4 ? 'bar-active' : ''}`}
                  style={{ height: `${[40, 55, 45, 50, 80, 35, 30][index]}%` }}
                ></div>
                <span className="bar-label">{day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-actions">
          <button
            className="compare-states-btn"
            onClick={() => setShowComparison(true)}
          >
            Compare States {String.fromCharCode(8594)}
          </button>
        </div>
      </div>

      {showComparison && (
        <Suspense fallback={null}>
          <StateComparison
            isOpen={showComparison}
            onClose={handleCloseComparison}
            initialState={selectedState}
          />
        </Suspense>
      )}
    </section>
  );
}

export default StatsSection;
