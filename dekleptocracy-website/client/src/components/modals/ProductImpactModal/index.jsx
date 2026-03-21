import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import './ProductImpactModal.css';

/**
 * Product Impact Modal Component
 */
export function ProductImpactModal({ isOpen, onClose, product = 'Housing', data }) {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  // Focus trap implementation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    },
    [onClose],
  );

  // Store previously focused element and set initial focus
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement;
      // Focus the close button when modal opens
      setTimeout(() => closeButtonRef.current?.focus(), 0);
      document.addEventListener('keydown', handleKeyDown);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      // Return focus to previously focused element
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

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
      description:
        'Import duties on steel, aluminum, lumber, gypsum, windows, roofing raise input costs. NAHB notes sizeable share of building materials are imported.',
      source: 'National Association of Home Builders',
    },
    lobbying: {
      amount: '$2.3 BILLION',
      description:
        'While your housing costs jumped +80.9%, real estate fat cats poured $2.3B into lobbying for the very policies that drove your costs up.',
    },
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

  const modalTitleId = 'product-impact-modal-title';

  return (
    <div className="product-impact-modal__overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className="product-impact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          className="product-impact-modal__close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 id={modalTitleId} className="product-impact-modal__title">
          Price Impact: {product}
        </h2>

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
                <span key={index} className="product-impact-modal__badge">
                  {badge}
                </span>
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
          <h3 className="product-impact-modal__lobbying-amount">
            {impactData.lobbying.amount} Spent in DC
          </h3>
          <p className="product-impact-modal__lobbying-text">
            While your {product.toLowerCase()} costs jumped{' '}
            <span className="product-impact-modal__highlight">{impactData.totalIncrease}</span>,
            real estate fat cats poured
            <span className="product-impact-modal__highlight">
              {' '}
              {impactData.lobbying.amount}
            </span>{' '}
            into lobbying for the very policies that drove your costs up.
          </p>
          <button className="product-impact-modal__ask-ai-btn" onClick={handleAskAI}>
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}

ProductImpactModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.string,
  data: PropTypes.shape({
    startingPrice: PropTypes.string,
    startingDate: PropTypes.string,
    currentPrice: PropTypes.string,
    currentDate: PropTypes.string,
    totalIncrease: PropTypes.string,
    increaseAmount: PropTypes.string,
    tariffs: PropTypes.shape({
      title: PropTypes.string,
      badges: PropTypes.arrayOf(PropTypes.string),
      description: PropTypes.string,
      source: PropTypes.string,
    }),
    lobbying: PropTypes.shape({
      amount: PropTypes.string,
      description: PropTypes.string,
    }),
  }),
};

ProductImpactModal.defaultProps = {
  product: 'Housing',
  data: null,
};

export default ProductImpactModal;
