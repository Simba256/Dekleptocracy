import { memo } from 'react';
import PropTypes from 'prop-types';
import './StatCard.css';

/**
 * Stat Card Component - Memoized to prevent unnecessary re-renders
 */
export const StatCard = memo(function StatCard({
  title,
  value,
  change,
  changeDirection = 'up',
  subtitle,
  icon,
  variant = 'default',
  chartData,
  children,
}) {
  const cardClass = `stat-card stat-card--${variant}`;
  const changeClass = `stat-card__change stat-card__change--${changeDirection}`;

  return (
    <div className={cardClass}>
      {icon && <div className="stat-card__icon">{icon}</div>}

      <div className="stat-card__header">
        <h3 className="stat-card__title">{title}</h3>
      </div>

      <div className="stat-card__value">{value}</div>

      {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}

      {change && (
        <div className={changeClass}>
          {changeDirection === 'up' ? String.fromCharCode(8593) : String.fromCharCode(8595)}{' '}
          {change}
        </div>
      )}

      {children && <div className="stat-card__chart">{children}</div>}

      {chartData && !children && (
        <div className="stat-card__bar-chart">
          {chartData.map((item, index) => (
            <div key={index} className="stat-card__bar-group">
              <div
                className={`stat-card__bar ${index === chartData.length - 2 ? 'stat-card__bar--active' : ''}`}
                style={{
                  height: `${(item.value / Math.max(...chartData.map((d) => d.value))) * 100}%`,
                }}
              ></div>
              <span className="stat-card__bar-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.string,
  changeDirection: PropTypes.oneOf(['up', 'down']),
  subtitle: PropTypes.string,
  icon: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'large', 'pink', 'red', 'compact']),
  chartData: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  children: PropTypes.node,
};

StatCard.defaultProps = {
  change: '',
  changeDirection: 'up',
  subtitle: '',
  icon: '',
  variant: 'default',
  chartData: null,
  children: null,
};

/**
 * Lobbying Stat Card with line chart
 */
export function LobbyingStatCard({ value }) {
  return (
    <StatCard title="Lobbying Cases Tracked" value={value} variant="large">
      <svg viewBox="0 0 300 100" className="stat-card__line-chart">
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
    </StatCard>
  );
}

LobbyingStatCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default StatCard;
