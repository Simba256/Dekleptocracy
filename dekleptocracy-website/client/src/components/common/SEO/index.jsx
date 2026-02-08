import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://dekleptocracy.vercel.app';

/**
 * SEO Component for managing meta tags and structured data
 *
 * @param {Object} props
 * @param {string} props.title - Page title (will be appended with site name)
 * @param {string} props.description - Meta description
 * @param {string} props.image - Open Graph image URL
 * @param {string} props.url - Canonical URL path (e.g., '/about')
 * @param {string} props.type - Open Graph type (default: 'website')
 * @param {Object} props.structuredData - JSON-LD structured data object
 * @param {string} props.keywords - Meta keywords
 * @param {boolean} props.noindex - Set to true to prevent indexing
 */
const SEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
  structuredData,
  keywords,
  noindex = false
}) => {
  const siteName = 'Dekleptocracy';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Track Policy Impact on Your Wallet`;

  const defaultDescription = 'Discover how government decisions, tariffs, and lobbying affect your everyday prices. Compare costs across states and track policy impacts on your household budget.';
  const defaultImage = `${BASE_URL}/og-image.jpg`;

  const metaDescription = description || defaultDescription;
  const metaImage = image?.startsWith('http') ? image : `${BASE_URL}${image || '/og-image.jpg'}`;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

// Pre-built structured data generators
export const generateWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Dekleptocracy',
  url: BASE_URL,
  description: 'Track how government policies and tariffs impact consumer prices',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/insights?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
});

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Dekleptocracy',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  sameAs: []
});

export const generateWebAppSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Dekleptocracy',
  applicationCategory: 'FinanceApplication',
  description: 'Track how government policies and tariffs impact consumer prices across all 50 US states',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  operatingSystem: 'Web Browser',
  author: {
    '@type': 'Organization',
    name: 'Dekleptocracy'
  }
});

export const generateBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${BASE_URL}${item.path}`
  }))
});

export const generateArticleSchema = (article) => ({
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: article.title,
  description: article.description || article.excerpt,
  image: article.image,
  datePublished: article.publishedAt,
  dateModified: article.updatedAt || article.publishedAt,
  author: {
    '@type': 'Organization',
    name: 'Dekleptocracy'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Dekleptocracy',
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/logo.png`
    }
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${BASE_URL}${article.url}`
  }
});

export const generateFAQSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

export const generateStateReportSchema = (state, data) => ({
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: `${state} Economic Impact Data`,
  description: `Consumer price and policy impact data for ${state}`,
  creator: {
    '@type': 'Organization',
    name: 'Dekleptocracy'
  },
  dateModified: new Date().toISOString(),
  spatialCoverage: {
    '@type': 'Place',
    name: state,
    geo: {
      '@type': 'GeoCoordinates',
      addressCountry: 'US'
    }
  },
  variableMeasured: [
    'Consumer Price Index',
    'Gas Prices',
    'Electricity Prices',
    'Food Prices',
    'Tariff Impact'
  ]
});

export default SEO;
