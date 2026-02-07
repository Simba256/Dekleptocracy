# Phase 3: Performance Optimization

## Overview

This phase focuses on optimizing the landing page for speed, reducing bundle size, improving Core Web Vitals, and ensuring a smooth user experience on all devices and network conditions.

**Prerequisites:** Phase 1 (Data Integration) and Phase 2 (Component Architecture) are complete.

## Goals

1. Achieve Lighthouse Performance score of 90+
2. Reduce Time to Interactive (TTI) to under 3 seconds
3. Minimize bundle size to under 200KB gzipped
4. Implement efficient caching strategies
5. Optimize images and assets
6. Reduce API requests from multiple to single aggregated call

---

## Current State Analysis (Post Phase 1 & 2)

### What's Already Optimized

| Improvement | Location | Impact |
|-------------|----------|--------|
| Modular components | Home/index.jsx (61 lines) | Fast initial parse |
| Centralized state | HomepageContext | No prop drilling |
| Parallel API fetching | fetchAllHomepageData | Reduced waterfall |
| Reusable components | components/* | Smaller bundle per section |

### Remaining Performance Issues

| Issue | Location | Impact |
|-------|----------|--------|
| No code splitting | Single bundle | Large initial load |
| Large CSS file | Home.css (42KB) | Render blocking |
| External images | Unsplash URLs | No optimization, no lazy load |
| Inline SVG (200+ lines) | PriceMapSection | Large DOM, no lazy load |
| No route-level splitting | App.jsx | All pages loaded upfront |
| Multiple API calls | 3+ endpoints | Network overhead |
| No caching layer | API responses | Repeated fetches on navigation |

### Current API Call Pattern

```
Page Load
    ├── /api/homepage/wallet-shocks ──────────────┐
    ├── /api/homepage/cost-drivers ───────────────┼── Parallel (client-side)
    ├── /api/homepage/stats ──────────────────────┤
    ├── /api/homepage/state-comparison ───────────┤
    ├── /api/homepage/social-posts ───────────────┤
    └── /api/homepage/quick-questions ────────────┘

Target: Single /api/homepage/all request
```

---

## Target State

### Performance Targets

| Metric | Current (Est.) | Target |
|--------|----------------|--------|
| Lighthouse Performance | 65-75 | 90+ |
| First Contentful Paint (FCP) | 1.5-2.5s | < 1.2s |
| Largest Contentful Paint (LCP) | 2.5-4s | < 2.5s |
| Time to Interactive (TTI) | 3-5s | < 3s |
| Cumulative Layout Shift (CLS) | 0.1-0.2 | < 0.1 |
| Total Blocking Time (TBT) | 200-400ms | < 150ms |
| Bundle Size (gzipped) | ~300KB | < 200KB |
| API Requests (homepage) | 6+ | 1 |

---

## Implementation Priority

### High Priority (Do First)

1. **Route-based code splitting** - Biggest impact, lowest effort
2. **Aggregated API endpoint** - Single request instead of 6+
3. **Image lazy loading** - Native loading="lazy" + Intersection Observer
4. **Section lazy loading** - Load below-fold sections on scroll

### Medium Priority

5. **Bundle analysis & tree shaking** - Remove unused code
6. **Memoization** - Prevent unnecessary re-renders
7. **Skeleton loading** - Better perceived performance

### Lower Priority (Future)

8. Service Worker caching
9. Critical CSS extraction
10. Image CDN/optimization service

---

## Optimization Strategies

### 1. Route-Based Code Splitting

Update App.jsx to lazy load all pages:

```jsx
// src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load all pages
const Home = lazy(() => import('./pages/Home'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Reports = lazy(() => import('./pages/Reports'));
const StateReport = lazy(() => import('./pages/StateReport'));
const Insights = lazy(() => import('./pages/Insights'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const CreateAccount = lazy(() => import('./pages/CreateAccount'));
const Login = lazy(() => import('./pages/Login'));
const Survey = lazy(() => import('./pages/Survey'));
const Topics = lazy(() => import('./pages/Topics'));
const HouseholdExpense = lazy(() => import('./pages/HouseholdExpense'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Profile = lazy(() => import('./pages/Profile'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CopyrightPolicy = lazy(() => import('./pages/CopyrightPolicy'));
const DataPolicy = lazy(() => import('./pages/DataPolicy'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const Help = lazy(() => import('./pages/Help'));
const Services = lazy(() => import('./pages/Services'));

function AppContent() {
  const location = useLocation();
  const hiddenFooterRoutes = ['/chatbot', '/chatbot/debug'];
  const shouldHideFooter = hiddenFooterRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<LoadingSpinner fullPage message="Loading..." />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          {/* ... rest of routes ... */}
        </Routes>
      </Suspense>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
```

### 2. Section-Based Lazy Loading with Intersection Observer

```jsx
// src/hooks/useLazySection.js
import { useState, useEffect, useRef } from 'react';

export function useLazySection(options = {}) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Load 200px before visible
        threshold: 0,
        ...options
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, hasLoaded };
}
```

Update Home/index.jsx to use lazy sections:

```jsx
// src/pages/Home/index.jsx
import { lazy, Suspense } from 'react';
import { HomepageProvider, useHomepage } from '../../context/HomepageContext';
import { HeroSection } from './sections/HeroSection';
import { StatsSection } from './sections/StatsSection';
import ProductImpactModal from '../../components/modals/ProductImpactModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './Home.css';

// Lazy load below-fold sections
const WalletShocksSection = lazy(() => import('./sections/WalletShocksSection'));
const CostDriversSection = lazy(() => import('./sections/CostDriversSection'));
const BudgetImpactSection = lazy(() => import('./sections/BudgetImpactSection'));
const PriceMapSection = lazy(() => import('./sections/PriceMapSection'));
const SocialPostsSection = lazy(() => import('./sections/SocialPostsSection'));
const CTASection = lazy(() => import('./sections/CTASection'));

const SectionSkeleton = ({ height = '400px' }) => (
  <div className="section-skeleton" style={{ height, background: '#f3f4f6' }} />
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
      {/* Critical path - load immediately */}
      <HeroSection />
      <StatsSection />

      {/* Below fold - lazy load */}
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
```

### 3. Aggregated API Endpoint

Create a single endpoint that returns all homepage data:

```javascript
// server/routes/homepageRoutes.js

/**
 * GET /api/homepage/all
 * Single aggregated endpoint for all homepage data
 * Reduces round trips from 6+ to 1
 */
router.get('/all', optionalAuth, async (req, res) => {
  try {
    const state = req.query.state || 'nationwide';
    const period = req.query.period || 'YoY';

    // Parallel database queries - all at once
    const [
      shocks,
      drivers,
      stats,
      comparisons,
      socialPosts,
      quickQuestions,
      timelineConfig
    ] = await Promise.all([
      WalletShock.find(state === 'nationwide' ? {} : { state })
        .sort('-dataDate')
        .limit(4)
        .lean(),
      CostDriver.find(state === 'nationwide' ? {} : { state })
        .sort('displayOrder')
        .lean(),
      StatsSummary.find({}).lean(),
      StateComparison.find(state === 'nationwide' ? {} : { state })
        .sort('category')
        .lean(),
      SocialPost.find({ approved: true })
        .sort('-postedAt')
        .limit(3)
        .lean(),
      QuickQuestion.find({ active: true })
        .sort('-priority')
        .limit(3)
        .lean(),
      TimelineConfig.findOne({ active: true }).lean()
    ]);

    // Group stats by type
    const groupedStats = {
      lobbying: stats.find(s => s.statType === 'lobbying'),
      consumerCost: stats.find(s => s.statType === 'consumerCost'),
      contributions: stats.find(s => s.statType === 'contributions'),
      tariffRevenue: stats.find(s => s.statType === 'tariffRevenue')
    };

    res.json({
      success: true,
      state,
      period,
      data: {
        walletShocks: shocks,
        costDrivers: drivers,
        stats: groupedStats,
        stateComparisons: comparisons,
        socialPosts: socialPosts,
        quickQuestions: quickQuestions,
        timelineConfig: timelineConfig
      }
    });
  } catch (error) {
    console.error('Error fetching aggregated homepage data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

Update the API client to use the aggregated endpoint:

```javascript
// client/src/api/homepage.js

/**
 * Fetch all homepage data in a single request
 */
export async function fetchAllHomepageData(state = 'nationwide', period = 'YoY') {
  const headers = getAuthHeaders();

  const response = await fetch(
    `${API_URL}/api/homepage/all?state=${encodeURIComponent(state)}&period=${period}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch homepage data');
  }

  const result = await response.json();
  return result.data;
}
```

### 4. Enhanced Context with SWR-like Caching

Update HomepageContext to cache data and avoid refetching:

```jsx
// Add to HomepageContext.jsx

// Cache for API responses
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// In fetchData function:
const fetchData = useCallback(async (isRefresh = false) => {
  const cacheKey = `homepage-${state.selectedState}-${state.timePeriod}`;

  // Check cache first (unless forcing refresh)
  if (!isRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      dispatch({ type: ActionTypes.SET_ALL_DATA, payload: cached });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      return;
    }
  }

  // ... fetch logic ...

  // Cache the response
  setCachedData(cacheKey, data);
}, [state.selectedState, state.timePeriod]);
```

### 5. Image Optimization

Add native lazy loading to all images:

```jsx
// Update SocialPostsSection.jsx and other sections with images
<img
  src={post.image}
  alt="Post"
  className="post-image"
  loading="lazy"
  decoding="async"
  width="600"
  height="400"
/>
```

Create an OptimizedImage component for more control:

```jsx
// src/components/common/OptimizedImage/index.jsx
import { useState } from 'react';
import './OptimizedImage.css';

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // For Unsplash images, add size parameters
  const optimizedSrc = src.includes('unsplash.com')
    ? `${src}&w=${width}&q=80&fm=webp`
    : src;

  return (
    <div
      className={`optimized-image ${className} ${isLoaded ? 'loaded' : ''}`}
      style={{ width, height }}
    >
      {!isLoaded && !hasError && (
        <div className="optimized-image__placeholder" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        style={{ opacity: isLoaded ? 1 : 0 }}
      />
    </div>
  );
}

export default OptimizedImage;
```

### 6. Bundle Optimization (Vite Config)

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - always needed
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
        }
      }
    },
    // Warn if chunks exceed 500KB
    chunkSizeWarningLimit: 500,
    // Enable minification
    minify: 'esbuild',
    // Generate source maps for debugging
    sourcemap: true,
  },
  // Optimize deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});
```

### 7. Skeleton Components

```jsx
// src/components/common/Skeleton/index.jsx
import './Skeleton.css';

export function Skeleton({ width, height, variant = 'rect', className = '' }) {
  return (
    <div
      className={`skeleton skeleton--${variant} ${className}`}
      style={{ width, height }}
    />
  );
}

export function WalletShockCardSkeleton() {
  return (
    <div className="wallet-card-skeleton">
      <Skeleton width="80px" height="24px" variant="badge" />
      <div className="wallet-card-skeleton__content">
        <Skeleton width="48px" height="48px" variant="circle" />
        <Skeleton width="100%" height="20px" />
        <Skeleton width="80%" height="16px" />
      </div>
      <Skeleton width="100%" height="80px" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card-skeleton">
      <Skeleton width="120px" height="16px" />
      <Skeleton width="80px" height="32px" />
      <Skeleton width="100%" height="60px" />
    </div>
  );
}

export default Skeleton;
```

```css
/* src/components/common/Skeleton/Skeleton.css */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.skeleton--circle {
  border-radius: 50%;
}

.skeleton--badge {
  border-radius: 12px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.wallet-card-skeleton,
.stat-card-skeleton {
  padding: 16px;
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wallet-card-skeleton__content {
  display: flex;
  align-items: center;
  gap: 12px;
}
```

### 8. Preloading & Resource Hints

Update index.html:

```html
<!-- index.html -->
<head>
  <!-- Preconnect to API server -->
  <link rel="preconnect" href="http://localhost:5000" crossorigin>

  <!-- DNS prefetch for external resources -->
  <link rel="dns-prefetch" href="https://images.unsplash.com">
  <link rel="dns-prefetch" href="https://i.pravatar.cc">

  <!-- Preload fonts if using custom fonts -->
  <!-- <link rel="preload" href="/fonts/GeistVF.woff2" as="font" type="font/woff2" crossorigin> -->
</head>
```

---

## Implementation Steps

### Step 1: Measure Baseline

```bash
# Run Lighthouse audit
npx lighthouse http://localhost:5173 --output=html --output-path=./lighthouse-before.html

# Analyze bundle size
npm run build -- --report
```

- [ ] Record Lighthouse scores (Performance, FCP, LCP, TTI, CLS)
- [ ] Document current bundle size
- [ ] Note number of API requests on page load

### Step 2: Route-Based Code Splitting

- [ ] Update App.jsx with lazy imports
- [ ] Add Suspense with LoadingSpinner fallback
- [ ] Test all routes still work
- [ ] Verify bundle is now split

### Step 3: Aggregated API Endpoint

- [ ] Add `/api/homepage/all` endpoint to homepageRoutes.js
- [ ] Update `fetchAllHomepageData` in api/homepage.js
- [ ] Update HomepageContext to use new endpoint
- [ ] Test data still loads correctly
- [ ] Remove old parallel fetch calls

### Step 4: Section Lazy Loading

- [ ] Update Home/index.jsx with lazy imports for below-fold sections
- [ ] Add SectionSkeleton component
- [ ] Test sections load on scroll
- [ ] Verify no layout shift

### Step 5: Image Optimization

- [ ] Add `loading="lazy"` to all img tags
- [ ] Create OptimizedImage component
- [ ] Update SocialPostsSection to use OptimizedImage
- [ ] Add width/height to prevent CLS

### Step 6: Add Caching to Context

- [ ] Add cache Map to HomepageContext
- [ ] Check cache before fetching
- [ ] Set 5-minute TTL
- [ ] Test cache works on state changes

### Step 7: Bundle Optimization

- [ ] Update vite.config.js with manual chunks
- [ ] Run bundle analyzer
- [ ] Remove any unused dependencies
- [ ] Verify smaller bundle size

### Step 8: Final Testing

- [ ] Re-run Lighthouse audit
- [ ] Compare before/after scores
- [ ] Test on throttled network (Slow 3G)
- [ ] Test on mobile device
- [ ] Document improvements

---

## Files to Modify

| File | Changes |
|------|---------|
| `client/src/App.jsx` | Add lazy imports, Suspense wrapper |
| `client/src/pages/Home/index.jsx` | Lazy load below-fold sections |
| `server/routes/homepageRoutes.js` | Add `/all` aggregated endpoint |
| `client/src/api/homepage.js` | Update to use `/all` endpoint |
| `client/src/context/HomepageContext.jsx` | Add response caching |
| `client/src/hooks/useLazySection.js` | New file - Intersection Observer hook |
| `client/src/components/common/Skeleton/` | New directory - skeleton components |
| `client/src/components/common/OptimizedImage/` | New directory - image component |
| `vite.config.js` | Add manual chunks config |
| `index.html` | Add preconnect/dns-prefetch hints |

---

## Success Metrics

| Metric | Before (Est.) | Target | Priority |
|--------|---------------|--------|----------|
| Lighthouse Performance | 65-75 | 90+ | High |
| LCP | 2.5-4s | < 2.5s | High |
| TTI | 3-5s | < 3s | High |
| API Requests | 6+ | 1 | High |
| Bundle Size | ~300KB | < 200KB | Medium |
| CLS | 0.1-0.2 | < 0.1 | Medium |

---

## Deferred to Future

These optimizations add complexity and are better saved for later:

1. **Service Worker** - Adds offline support but complex to maintain
2. **Critical CSS Extraction** - Diminishing returns, build complexity
3. **Image CDN** - Requires infrastructure setup
4. **React Query** - Heavy dependency, current caching is sufficient

---

## Next Steps

After completing Phase 3:
1. Run final Lighthouse audit and document results
2. Proceed to Phase 4 (User Experience)
3. Performance gains enable:
   - Smoother animations
   - More interactive features
   - Richer content without slowdown
