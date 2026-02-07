import { useNavigate } from 'react-router-dom';
import './ProductImpactModal.css';

/**
 * Product Impact Modal Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {string} props.product - Product name
 * @param {Object} props.data - Product impact data
 */
export function ProductImpactModal({ isOpen, onClose, product = 'Housing', data }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Default data if not provided
  const impactData = data || {
    startingPrice: '$2.15',
    startingDate: 'January 20, 2024',
    currentPrice: '$3.89',
    currentDate: 'September 20, 2024',
    totalIncrease: '+80.9%',
    increaseAmount: '+$1.74',
    tariffs: {
      title: 'Tariffs on Building materials',
      badges: ['Steel: 25%', 'Aluminum: 10%', 'Lumber duties: -14.5%'],
      description: 'Import duties on steel, aluminum, lumber, gypsum, windows, roofing raise input costs. NAHB notes sizeable share of building materials are imported.',
      source: 'National Association of Home Builders'
    },
    lobbying: {
      amount: '$2.3 BILLION',
      description: 'While your housing costs jumped +80.9%, real estate fat cats poured $2.3B into lobbying for the very policies that drove your costs up.'
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAskAI = () => {
    navigate('/chatbot', { state: { initialQuery: `Tell me about ${product} prices` } });
    onClose();
  };

  return (
    <div className="product-impact-modal__overlay" onClick={handleOverlayClick}>
      <div className="product-impact-modal" onClick={(e) => e.stopPropagation()}>
        <button className="product-impact-modal__close-btn" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 className="product-impact-modal__title">Price Impact: {product}</h2>

        {/* Price Cards */}
        <div className="product-impact-modal__price-cards">
          <div className="product-impact-modal__price-card">
            <div className="product-impact-modal__price-value">{impactData.startingPrice}</div>
            <div className="product-impact-modal__price-date">{impactData.startingDate}</div>
            <div className="product-impact-modal__price-label">Starting Price</div>
          </div>
          <div className="product-impact-modal__price-card">
            <div className="product-impact-modal__price-value">{impactData.currentPrice}</div>
            <div className="product-impact-modal__price-date">{impactData.currentDate}</div>
            <div className="product-impact-modal__price-label">Current Price</div>
          </div>
          <div className="product-impact-modal__price-card">
            <div className="product-impact-modal__price-value">{impactData.totalIncrease}</div>
            <div className="product-impact-modal__price-date">{impactData.increaseAmount}</div>
            <div className="product-impact-modal__price-label">Total Increase</div>
          </div>
        </div>

        {/* What Pushed The Price Up */}
        <h3 className="product-impact-modal__section-title">What Pushed The Price Up?</h3>

        <div className="product-impact-modal__tariff-card">
          <div className="product-impact-modal__tariff-header">
            <h4 className="product-impact-modal__tariff-title">{impactData.tariffs.title}</h4>
            <div className="product-impact-modal__tariff-badges">
              {impactData.tariffs.badges.map((badge, index) => (
                <span key={index} className="product-impact-modal__badge">{badge}</span>
              ))}
            </div>
          </div>
          <p className="product-impact-modal__tariff-text">{impactData.tariffs.description}</p>
          <p className="product-impact-modal__tariff-source">
            <span className="product-impact-modal__source-label">Sources:</span>{' '}
            <span className="product-impact-modal__source-link">{impactData.tariffs.source}</span>
          </p>
        </div>

        {/* Lobbying Section */}
        <div className="product-impact-modal__lobbying-card">
          <h3 className="product-impact-modal__lobbying-amount">{impactData.lobbying.amount} Spent in DC</h3>
          <p className="product-impact-modal__lobbying-text">
            While your {product.toLowerCase()} costs jumped{' '}
            <span className="product-impact-modal__highlight">{impactData.totalIncrease}</span>, real estate fat cats poured
            <span className="product-impact-modal__highlight"> {impactData.lobbying.amount}</span> into lobbying for the very policies that drove your costs up.
          </p>
          <button className="product-impact-modal__ask-ai-btn" onClick={handleAskAI}>
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductImpactModal;
