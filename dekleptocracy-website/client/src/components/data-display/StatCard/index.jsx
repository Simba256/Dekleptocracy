import './StatCard.css';

/**
 * Stat Card Component
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.value - Main value
 * @param {string} props.change - Change value (e.g., "+28.42%")
 * @param {string} props.changeDirection - 'up' or 'down'
 * @param {string} props.subtitle - Optional subtitle
 * @param {string} props.icon - Optional emoji icon
 * @param {string} props.variant - 'default', 'large', 'pink', 'red'
 * @param {Array} props.chartData - Optional chart data
 * @param {React.ReactNode} props.children - Custom chart content
 */
export function StatCard({
  title,
  value,
  change,
  changeDirection = 'up',
  subtitle,
  icon,
  variant = 'default',
  chartData,
  children
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
          {changeDirection === 'up' ? String.fromCharCode(8593) : String.fromCharCode(8595)} {change}
        </div>
      )}

      {children && <div className="stat-card__chart">{children}</div>}

      {chartData && !children && (
        <div className="stat-card__bar-chart">
          {chartData.map((item, index) => (
            <div key={index} className="stat-card__bar-group">
              <div
                className={`stat-card__bar ${index === chartData.length - 2 ? 'stat-card__bar--active' : ''}`}
                style={{ height: `${(item.value / Math.max(...chartData.map(d => d.value))) * 100}%` }}
              ></div>
              <span className="stat-card__bar-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

export default StatCard;
