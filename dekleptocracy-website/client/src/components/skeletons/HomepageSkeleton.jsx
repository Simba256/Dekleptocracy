import './Skeleton.css';

export const HeroSkeleton = () => (
  <section
    className="hero-section skeleton-section"
    aria-busy="true"
    aria-label="Loading hero section"
  >
    <div className="hero-container">
      <div className="skeleton skeleton-capsule" aria-hidden="true" />
      <div className="skeleton skeleton-title" style={{ width: '70%' }} aria-hidden="true" />
      <div className="skeleton skeleton-title" style={{ width: '50%' }} aria-hidden="true" />
      <div className="skeleton skeleton-search" aria-hidden="true" />
      <div className="quick-questions-skeleton">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-card" aria-hidden="true" />
        ))}
      </div>
    </div>
  </section>
);

export const StatsSkeleton = () => (
  <section
    className="stats-section skeleton-section"
    aria-busy="true"
    aria-label="Loading statistics"
  >
    <div className="stats-container">
      <div className="skeleton skeleton-stat-large" aria-hidden="true" />
      <div className="skeleton skeleton-stat-small" aria-hidden="true" />
      <div className="skeleton skeleton-stat-small" aria-hidden="true" />
      <div className="skeleton skeleton-stat-medium" aria-hidden="true" />
    </div>
  </section>
);

const WalletCardSkeleton = () => (
  <div className="wallet-card skeleton-card-wrapper" aria-hidden="true">
    <div className="skeleton skeleton-badge" style={{ width: '80px' }} />
    <div className="skeleton-content">
      <div className="skeleton skeleton-circle" style={{ width: '48px', height: '48px' }} />
      <div className="skeleton skeleton-text" style={{ width: '90%' }} />
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
    </div>
    <div className="skeleton skeleton-chart" />
    <div className="skeleton-footer">
      <div className="skeleton skeleton-text" style={{ width: '80px' }} />
      <div className="skeleton-reactions">
        <div className="skeleton skeleton-reaction" />
        <div className="skeleton skeleton-reaction" />
        <div className="skeleton skeleton-reaction" />
      </div>
    </div>
  </div>
);

export const WalletShocksSkeleton = () => (
  <section
    className="wallet-shocks-section skeleton-section"
    aria-busy="true"
    aria-label="Loading wallet shocks"
  >
    <div className="wallet-shocks-container">
      <div className="skeleton skeleton-heading" aria-hidden="true" />
      <div className="state-tabs-skeleton">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton skeleton-tab" aria-hidden="true" />
        ))}
      </div>
      <div className="wallet-cards-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <WalletCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </section>
);

export const CostDriversSkeleton = () => (
  <section
    className="cost-drivers-section skeleton-section"
    aria-busy="true"
    aria-label="Loading cost drivers"
  >
    <div className="cost-drivers-container">
      <div className="skeleton skeleton-heading" aria-hidden="true" />
      <div className="drivers-skeleton">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="driver-skeleton" aria-hidden="true">
            <div className="skeleton skeleton-label" />
            <div className="skeleton skeleton-bar" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const BudgetImpactSkeleton = () => (
  <section
    className="budget-impact-section skeleton-section"
    aria-busy="true"
    aria-label="Loading budget impact"
  >
    <div className="budget-impact-container">
      <div className="skeleton skeleton-heading" aria-hidden="true" />
      <div className="comparison-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="comparison-card-skeleton" aria-hidden="true">
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-amount" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const PriceMapSkeleton = () => (
  <section
    className="price-map-section skeleton-section"
    aria-busy="true"
    aria-label="Loading price map"
  >
    <div className="price-map-container">
      <div className="skeleton skeleton-heading" aria-hidden="true" />
      <div className="map-skeleton" aria-hidden="true" />
    </div>
  </section>
);

export const SocialPostsSkeleton = () => (
  <section
    className="social-posts-section skeleton-section"
    aria-busy="true"
    aria-label="Loading social posts"
  >
    <div className="social-posts-container">
      <div className="skeleton skeleton-heading" aria-hidden="true" />
      <div className="posts-skeleton">
        {[1, 2, 3].map((i) => (
          <div key={i} className="post-skeleton" aria-hidden="true">
            <div className="post-header-skeleton">
              <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }} />
              <div className="skeleton skeleton-text" style={{ width: '120px' }} />
            </div>
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            <div className="post-engagement-skeleton">
              <div className="skeleton skeleton-text" style={{ width: '60px' }} />
              <div className="skeleton skeleton-text" style={{ width: '60px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const CTASkeleton = () => (
  <section
    className="cta-section skeleton-section"
    aria-busy="true"
    aria-label="Loading call to action"
  >
    <div className="cta-container">
      <div className="skeleton skeleton-title" style={{ width: '60%' }} aria-hidden="true" />
      <div className="skeleton skeleton-text" style={{ width: '80%' }} aria-hidden="true" />
      <div className="skeleton skeleton-button" aria-hidden="true" />
    </div>
  </section>
);

export default {
  HeroSkeleton,
  StatsSkeleton,
  WalletShocksSkeleton,
  CostDriversSkeleton,
  BudgetImpactSkeleton,
  PriceMapSkeleton,
  SocialPostsSkeleton,
  CTASkeleton,
};
