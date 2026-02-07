import { useNavigate } from 'react-router-dom';
import './WalletShockCard.css';

/**
 * Wallet Shock Card Component
 * @param {Object} props
 * @param {Object} props.shock - Wallet shock data
 * @param {Function} props.onReaction - Reaction click handler
 * @param {string} props.selectedState - Currently selected state
 */
export function WalletShockCard({ shock, onReaction, selectedState }) {
  const navigate = useNavigate();

  const handleSeeDetails = () => {
    navigate(`/insights?category=${shock.category.toLowerCase()}&state=${selectedState}`);
  };

  const handleReaction = (reactionType) => {
    if (onReaction) {
      onReaction(shock._id, reactionType);
    }
  };

  return (
    <div className="wallet-shock-card">
      <div className="wallet-shock-card__header">
        <span className="wallet-shock-card__category">{shock.category}</span>
      </div>

      <div className="wallet-shock-card__content">
        <div className="wallet-shock-card__icon" style={{ backgroundColor: shock.iconBg }}>
          {shock.icon}
        </div>
        <p className="wallet-shock-card__title">{shock.title}</p>
      </div>

      <div className="wallet-shock-card__price">
        <span className="wallet-shock-card__price-value">{shock.price}</span>
        <span className="wallet-shock-card__price-unit">{shock.unit}</span>
        <span className="wallet-shock-card__price-change">{shock.change}</span>
      </div>

      <div className="wallet-shock-card__chart">
        <svg viewBox="0 0 200 80" className="wallet-shock-card__chart-svg">
          <path
            d={shock.chartPath}
            fill="none"
            stroke={shock.chartColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="wallet-shock-card__footer">
        <button onClick={handleSeeDetails} className="wallet-shock-card__details-btn">
          See details &rarr;
        </button>
        <div className="wallet-shock-card__reactions">
          <span onClick={() => handleReaction('shock')} className="wallet-shock-card__reaction">
            <span role="img" aria-label="shock">😱</span> {shock.reactions?.shock || 0}
          </span>
          <span onClick={() => handleReaction('angry')} className="wallet-shock-card__reaction">
            <span role="img" aria-label="angry">😠</span> {shock.reactions?.angry || 0}
          </span>
          <span onClick={() => handleReaction('sad')} className="wallet-shock-card__reaction">
            <span role="img" aria-label="sad">😢</span> {shock.reactions?.sad || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export default WalletShockCard;
