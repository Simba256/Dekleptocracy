# Phase 7: SEO & Discoverability

## Overview

This phase focuses on improving search engine optimization, enabling better content discovery, and implementing technical SEO best practices for the landing page.

## Goals

1. Achieve high rankings for target keywords
2. Implement dynamic meta tags and Open Graph
3. Add structured data (JSON-LD)
4. Create state-specific landing pages
5. Generate dynamic sitemap
6. Implement server-side rendering for SEO

---

## Current State Analysis

### SEO Issues

| Issue | Impact | Priority |
|-------|--------|----------|
| Client-side rendering only | Search engines may not index content | High |
| Static meta tags | Same title/description for all content | High |
| No structured data | Missing rich snippets | Medium |
| Single URL for all states | No state-specific rankings | Medium |
| No sitemap | Crawler inefficiency | Medium |
| Missing Open Graph | Poor social sharing | Low |

---

## Target Keywords

### Primary Keywords

| Keyword | Search Volume | Difficulty | Current Rank |
|---------|---------------|------------|--------------|
| tariff impact on prices | 1,200/mo | Medium | Not ranked |
| consumer price increases | 2,400/mo | High | Not ranked |
| lobbying impact consumers | 800/mo | Low | Not ranked |
| state price comparison | 1,600/mo | Medium | Not ranked |
| grocery prices by state | 3,200/mo | Medium | Not ranked |

### Long-tail Keywords

- "how do tariffs affect grocery prices"
- "why are prices higher in [state]"
- "government policy impact on household budget"
- "compare cost of living by state"

---

## Implementation Strategies

### 1. Server-Side Rendering (SSR)

```javascript
// next.config.js (if migrating to Next.js)
// OR server/middleware/ssr.js for current setup

import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from '../client/src/App';

export const ssrMiddleware = async (req, res, next) => {
  // Only SSR for specific routes
  const ssrRoutes = ['/', '/insights', '/reports'];

  if (!ssrRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  try {
    // Fetch data for the page
    const pageData = await fetchPageData(req.path, req.query);

    // Render React to string
    const appHtml = renderToString(
      <StaticRouter location={req.url}>
        <App initialData={pageData} />
      </StaticRouter>
    );

    // Get meta tags for this page
    const metaTags = generateMetaTags(req.path, pageData);

    // Inject into HTML template
    const html = htmlTemplate
      .replace('<!--app-->', appHtml)
      .replace('<!--meta-->', metaTags)
      .replace('<!--initial-data-->', JSON.stringify(pageData));

    res.send(html);
  } catch (error) {
    console.error('SSR error:', error);
    next(); // Fall back to client-side rendering
  }
};
```

### 2. Dynamic Meta Tags

```javascript
// server/utils/metaTags.js

const BASE_URL = process.env.BASE_URL || 'https://dekleptocracy.com';

export const generateMetaTags = (path, data = {}) => {
  const defaults = {
    title: 'Dekleptocracy - See How Policy Impacts Your Wallet',
    description: 'Discover how government decisions, tariffs, and lobbying affect your everyday prices. Compare costs across states and track policy impacts.',
    image: `${BASE_URL}/images/og-default.jpg`,
    url: `${BASE_URL}${path}`,
    type: 'website'
  };

  let meta = { ...defaults };

  // State-specific pages
  if (path.startsWith('/state/')) {
    const state = data.stateName || path.split('/')[2];
    meta = {
      ...meta,
      title: `${state} Price Impact - How Policy Affects Your Budget | Dekleptocracy`,
      description: `See how tariffs and government policies impact prices in ${state}. Compare grocery, fuel, and utility costs to national averages.`,
      image: `${BASE_URL}/images/states/${state.toLowerCase()}.jpg`,
      url: `${BASE_URL}/state/${state.toLowerCase()}`
    };
  }

  // Product impact pages
  if (path.startsWith('/impact/')) {
    const product = data.productName || path.split('/')[2];
    meta = {
      ...meta,
      title: `${product} Price Impact - Tariff & Policy Effects | Dekleptocracy`,
      description: `Track how ${product} prices have changed due to tariffs and policies. See the breakdown of what's driving your costs.`,
      url: `${BASE_URL}/impact/${product.toLowerCase()}`
    };
  }

  return `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}">

    <!-- Open Graph -->
    <meta property="og:type" content="${meta.type}">
    <meta property="og:url" content="${meta.url}">
    <meta property="og:title" content="${meta.title}">
    <meta property="og:description" content="${meta.description}">
    <meta property="og:image" content="${meta.image}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${meta.url}">
    <meta name="twitter:title" content="${meta.title}">
    <meta name="twitter:description" content="${meta.description}">
    <meta name="twitter:image" content="${meta.image}">

    <!-- Canonical -->
    <link rel="canonical" href="${meta.url}">
  `;
};
```

### 3. Structured Data (JSON-LD)

```javascript
// server/utils/structuredData.js

export const generateStructuredData = (type, data) => {
  const schemas = {
    homepage: () => ({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Dekleptocracy',
      'applicationCategory': 'Finance',
      'description': 'Track how government policies and tariffs impact consumer prices',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'operatingSystem': 'Web',
      'author': {
        '@type': 'Organization',
        'name': 'Dekleptocracy',
        'url': 'https://dekleptocracy.com'
      }
    }),

    priceData: (data) => ({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      'name': `${data.category} Price Data - ${data.state}`,
      'description': `Consumer price index data for ${data.category} in ${data.state}`,
      'creator': {
        '@type': 'Organization',
        'name': 'Bureau of Labor Statistics'
      },
      'dateModified': data.lastUpdated,
      'temporalCoverage': data.dateRange,
      'spatialCoverage': {
        '@type': 'Place',
        'name': data.state
      }
    }),

    faq: (faqs) => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    }),

    article: (data) => ({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      'headline': data.title,
      'description': data.description,
      'image': data.image,
      'datePublished': data.publishedAt,
      'dateModified': data.updatedAt,
      'author': {
        '@type': 'Organization',
        'name': 'Dekleptocracy'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Dekleptocracy',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://dekleptocracy.com/logo.png'
        }
      }
    }),

    breadcrumb: (items) => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url
      }))
    })
  };

  const schema = schemas[type]?.(data);
  if (!schema) return '';

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
};
```

### 4. State-Specific Landing Pages

```javascript
// server/routes/stateRoutes.js
import express from 'express';
import { generateMetaTags } from '../utils/metaTags.js';
import { generateStructuredData } from '../utils/structuredData.js';

const router = express.Router();

const US_STATES = [
  { code: 'CA', name: 'California', slug: 'california' },
  { code: 'TX', name: 'Texas', slug: 'texas' },
  // ... all 50 states
];

// Generate state pages
router.get('/state/:state', async (req, res) => {
  const { state } = req.params;
  const stateData = US_STATES.find(s => s.slug === state.toLowerCase());

  if (!stateData) {
    return res.status(404).send('State not found');
  }

  // Fetch state-specific data
  const [walletShocks, comparisons, stats] = await Promise.all([
    WalletShock.find({ state: stateData.name }).limit(10),
    StateComparison.find({ state: stateData.name }),
    StatsSummary.find({ state: stateData.name })
  ]);

  const pageData = {
    stateName: stateData.name,
    stateCode: stateData.code,
    walletShocks,
    comparisons,
    stats,
    lastUpdated: new Date()
  };

  const metaTags = generateMetaTags(`/state/${state}`, pageData);
  const structuredData = generateStructuredData('priceData', {
    category: 'Consumer Prices',
    state: stateData.name,
    lastUpdated: new Date().toISOString(),
    dateRange: '2024/2025'
  });

  // Render page with SEO content
  res.render('state', {
    ...pageData,
    metaTags,
    structuredData
  });
});

export default router;
```

### 5. Dynamic Sitemap

```javascript
// server/routes/sitemapRoutes.js
import express from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';
import { createGzip } from 'zlib';

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');

  try {
    const smStream = new SitemapStream({ hostname: 'https://dekleptocracy.com' });
    const pipeline = smStream.pipe(createGzip());

    // Static pages
    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    smStream.write({ url: '/about', changefreq: 'monthly', priority: 0.5 });
    smStream.write({ url: '/chatbot', changefreq: 'weekly', priority: 0.8 });
    smStream.write({ url: '/insights', changefreq: 'daily', priority: 0.9 });
    smStream.write({ url: '/reports', changefreq: 'weekly', priority: 0.7 });

    // State pages
    const states = await getActiveStates();
    for (const state of states) {
      smStream.write({
        url: `/state/${state.slug}`,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: state.lastUpdated
      });
    }

    // Product/category pages
    const categories = await getActiveCategories();
    for (const category of categories) {
      smStream.write({
        url: `/impact/${category.slug}`,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: category.lastUpdated
      });
    }

    // Report pages
    const reports = await getPublishedReports();
    for (const report of reports) {
      smStream.write({
        url: `/reports/${report.slug}`,
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: report.updatedAt
      });
    }

    smStream.end();

    const sitemap = await streamToPromise(pipeline);
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Sitemap index for large sites
router.get('/sitemap-index.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>https://dekleptocracy.com/sitemap-main.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </sitemap>
      <sitemap>
        <loc>https://dekleptocracy.com/sitemap-states.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </sitemap>
      <sitemap>
        <loc>https://dekleptocracy.com/sitemap-reports.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </sitemap>
    </sitemapindex>`;

  res.send(sitemapIndex);
});

export default router;
```

### 6. Robots.txt

```javascript
// server/routes/robotsRoutes.js
import express from 'express';

const router = express.Router();

router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /profile/

# Sitemaps
Sitemap: https://dekleptocracy.com/sitemap.xml

# Crawl delay
Crawl-delay: 1
  `.trim());
});

export default router;
```

### 7. React Helmet for Client-Side

```jsx
// src/components/common/SEO/index.jsx
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
  structuredData
}) => {
  const siteTitle = 'Dekleptocracy';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = 'See how policy impacts your wallet';
  const defaultImage = '/images/og-default.jpg';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image || defaultImage} />
      {url && <meta property="og:url" content={url} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />

      {/* Canonical */}
      {url && <link rel="canonical" href={url} />}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

// Usage in page component
const StatePage = ({ state }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${state.name} Price Impact`
  };

  return (
    <>
      <SEO
        title={`${state.name} Price Impact`}
        description={`See how tariffs affect prices in ${state.name}`}
        url={`https://dekleptocracy.com/state/${state.slug}`}
        structuredData={structuredData}
      />
      <StateContent state={state} />
    </>
  );
};
```

---

## Implementation Steps

### Step 1: Meta Tags Setup (Day 1)

- [ ] Create meta tag generator utility
- [ ] Set up dynamic meta tags for routes
- [ ] Add Open Graph tags
- [ ] Add Twitter Card tags
- [ ] Test with social sharing debuggers

### Step 2: Structured Data (Day 2)

- [ ] Implement JSON-LD generator
- [ ] Add homepage schema
- [ ] Add FAQ schema
- [ ] Add dataset schemas
- [ ] Validate with Google's testing tool

### Step 3: State Pages (Day 2-3)

- [ ] Create state route handler
- [ ] Build state page template
- [ ] Generate state-specific content
- [ ] Add internal linking
- [ ] Test all 50 states

### Step 4: Sitemap (Day 3)

- [ ] Implement dynamic sitemap generation
- [ ] Add sitemap index for scaling
- [ ] Set up automatic updates
- [ ] Submit to Google Search Console
- [ ] Configure robots.txt

### Step 5: SSR/SSG (Day 4-5)

- [ ] Evaluate SSR options (Next.js vs Express)
- [ ] Implement server-side rendering
- [ ] Set up hydration
- [ ] Test with JavaScript disabled
- [ ] Optimize for Core Web Vitals

### Step 6: Testing & Monitoring (Day 6-7)

- [ ] Set up Google Search Console
- [ ] Configure Bing Webmaster Tools
- [ ] Run Lighthouse SEO audits
- [ ] Test structured data
- [ ] Monitor indexing status

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse SEO Score | 95+ |
| Pages indexed | 100% of public pages |
| Rich snippets showing | Yes |
| State pages ranked | Top 10 for state-specific queries |
| Organic traffic growth | 50% in 3 months |

---

## Next Steps

After completing Phase 7:
1. Proceed to Phase 8 (Analytics & Insights)
2. SEO improvements enable:
   - Traffic measurement
   - User journey tracking
   - Conversion optimization
