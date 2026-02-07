import { lazy, Suspense } from 'react';
import { HomepageProvider, useHomepage } from '../../context/HomepageContext';
import { HeroSection } from './sections/HeroSection';
import { StatsSection } from './sections/StatsSection';
import ProductImpactModal from '../../components/modals/ProductImpactModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './Home.css';

// Lazy load below-fold sections for better initial load performance
const WalletShocksSection = lazy(() => import('./sections/WalletShocksSection').then(m => ({ default: m.WalletShocksSection })));
const CostDriversSection = lazy(() => import('./sections/CostDriversSection').then(m => ({ default: m.CostDriversSection })));
const BudgetImpactSection = lazy(() => import('./sections/BudgetImpactSection').then(m => ({ default: m.BudgetImpactSection })));
const PriceMapSection = lazy(() => import('./sections/PriceMapSection').then(m => ({ default: m.PriceMapSection })));
const SocialPostsSection = lazy(() => import('./sections/SocialPostsSection').then(m => ({ default: m.SocialPostsSection })));
const CTASection = lazy(() => import('./sections/CTASection').then(m => ({ default: m.CTASection })));

// Skeleton placeholder for lazy-loaded sections
const SectionSkeleton = ({ height = '400px' }) => (
  <div
    className="section-skeleton"
    style={{
      height,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
      borderRadius: '8px',
      margin: '20px 0'
    }}
  />
);

function HomeContent() {
  const { state, actions } = useHomepage();
  const { loading, error, showImpactModal, impactModalProduct } = state;

  if (loading) {
    return <LoadingSpinner fullPage message="Loading homepage data..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={`Error loading data: ${error}`}
        onRetry={() => window.location.reload()}
        fullPage
      />
    );
  }

  return (
    <div className="home-page">
      {/* Critical above-fold sections - load immediately */}
      <HeroSection />
      <StatsSection />

      {/* Below-fold sections - lazy loaded for better performance */}
      <Suspense fallback={<SectionSkeleton height="600px" />}>
        <WalletShocksSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="500px" />}>
        <CostDriversSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="400px" />}>
        <BudgetImpactSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="700px" />}>
        <PriceMapSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="500px" />}>
        <SocialPostsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="300px" />}>
        <CTASection />
      </Suspense>

      <ProductImpactModal
        isOpen={showImpactModal}
        product={impactModalProduct || 'Housing'}
        onClose={actions.hideImpactModal}
      />
    </div>
  );
}

function Home() {
  return (
    <HomepageProvider>
      <HomeContent />
    </HomepageProvider>
  );
}

export default Home;
