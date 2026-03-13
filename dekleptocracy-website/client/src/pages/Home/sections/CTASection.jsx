import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

export const CTASection = memo(function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-card">
          <div className="cta-background-decoration">
            <svg className="chain-decoration left" viewBox="0 0 200 200" fill="none">
              <path d="M50 100 Q75 50, 100 100 T 150 100" stroke="rgba(255,255,255,0.1)" strokeWidth="30" strokeLinecap="round"/>
              <circle cx="50" cy="100" r="35" stroke="rgba(255,255,255,0.15)" strokeWidth="25" fill="none"/>
              <circle cx="150" cy="100" r="35" stroke="rgba(255,255,255,0.15)" strokeWidth="25" fill="none"/>
            </svg>
            <svg className="chain-decoration right" viewBox="0 0 200 200" fill="none">
              <path d="M50 100 Q75 50, 100 100 T 150 100" stroke="rgba(255,255,255,0.1)" strokeWidth="30" strokeLinecap="round"/>
              <circle cx="50" cy="100" r="35" stroke="rgba(255,255,255,0.15)" strokeWidth="25" fill="none"/>
              <circle cx="150" cy="100" r="35" stroke="rgba(255,255,255,0.15)" strokeWidth="25" fill="none"/>
            </svg>
          </div>

          <div className="cta-content">
            <h2 className="cta-title">Ready to See How Policy Impacts<br />Your Wallet?</h2>
            <p className="cta-description">
              Chat instantly with our AI or explore your local impact map to uncover the<br />
              hidden costs behind rising bills.
            </p>
            <div className="cta-buttons">
              <button className="cta-btn primary" onClick={() => navigate('/chatbot')}>Ask AI Now</button>
              <button className="cta-btn secondary">Explore Local Impact</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default CTASection;
