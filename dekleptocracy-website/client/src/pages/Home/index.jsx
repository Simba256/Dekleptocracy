import { lazy, Suspense } from 'react';
import { HomepageProvider, useHomepage } from '../../context/HomepageContext';
import { HeroSection } from './sections/HeroSection';
import { StatsSection } from './sections/StatsSection';
import ProductImpactModal from '../../components/modals/ProductImpactModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import SEO, { generateWebAppSchema, generateWebsiteSchema } from '../../components/common/SEO';
import {
  HeroSkeleton,
  StatsSkeleton,
  WalletShocksSkeleton,
  CostDriversSkeleton,
  BudgetImpactSkeleton,
  PriceMapSkeleton,
  SocialPostsSkeleton,
  CTASkeleton
} from '../../components/skeletons/HomepageSkeleton';
import './Home.css';

// Lazy load below-fold sections for better initial load performance
const WalletShocksSection = lazy(() => import('./sections/WalletShocksSection').then(m => ({ default: m.WalletShocksSection })));
const CostDriversSection = lazy(() => import('./sections/CostDriversSection').then(m => ({ default: m.CostDriversSection })));
const BudgetImpactSection = lazy(() => import('./sections/BudgetImpactSection').then(m => ({ default: m.BudgetImpactSection })));
const PriceMapSection = lazy(() => import('./sections/PriceMapSection').then(m => ({ default: m.PriceMapSection })));
const SocialPostsSection = lazy(() => import('./sections/SocialPostsSection').then(m => ({ default: m.SocialPostsSection })));
const CTASection = lazy(() => import('./sections/CTASection').then(m => ({ default: m.CTASection })));

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

  const structuredData = [
    generateWebsiteSchema(),
    generateWebAppSchema()
  ];

  return (
    <div className="home-page">
      <SEO
        title={null}
        description="Discover how government decisions, tariffs, and lobbying affect your everyday prices. Compare costs across all 50 US states and track policy impacts on your household budget."
        url="/"
        keywords="tariff impact, consumer prices, lobbying, government policy, cost of living, state comparison, grocery prices, fuel prices"
        structuredData={structuredData}
      />
      {/* Critical above-fold sections - load immediately */}
      <HeroSection />
      <StatsSection />

      {/* Below-fold sections - lazy loaded for better performance */}
      <Suspense fallback={<WalletShocksSkeleton />}>
        <WalletShocksSection />
      </Suspense>

      <Suspense fallback={<CostDriversSkeleton />}>
        <CostDriversSection />
      </Suspense>

      <Suspense fallback={<BudgetImpactSkeleton />}>
        <BudgetImpactSection />
      </Suspense>

      <Suspense fallback={<PriceMapSkeleton />}>
        <PriceMapSection />
      </Suspense>

      <Suspense fallback={<SocialPostsSkeleton />}>
        <SocialPostsSection />
      </Suspense>

      <Suspense fallback={<CTASkeleton />}>
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
