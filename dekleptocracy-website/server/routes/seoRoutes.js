import express from 'express';
import Article from '../models/Article.js';

const router = express.Router();

const BASE_URL = 'https://dekleptocracy.vercel.app';

// All US states for sitemap
const US_STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
  'District of Columbia',
];

// Static pages with their properties
const STATIC_PAGES = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/about', changefreq: 'monthly', priority: 0.7 },
  { url: '/services', changefreq: 'monthly', priority: 0.7 },
  { url: '/insights', changefreq: 'daily', priority: 0.9 },
  { url: '/reports', changefreq: 'weekly', priority: 0.8 },
  { url: '/contact', changefreq: 'monthly', priority: 0.5 },
  { url: '/help', changefreq: 'monthly', priority: 0.6 },
  { url: '/privacy-policy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms-of-service', changefreq: 'yearly', priority: 0.3 },
  { url: '/accessibility', changefreq: 'yearly', priority: 0.3 },
  { url: '/data-policy', changefreq: 'yearly', priority: 0.3 },
  { url: '/copyright-policy', changefreq: 'yearly', priority: 0.3 },
];

/**
 * Generate XML sitemap
 * GET /sitemap.xml
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch published articles for dynamic URLs
    let articles = [];
    try {
      articles = await Article.find({ status: 'published' })
        .select('slug updatedAt publishedAt category')
        .sort({ publishedAt: -1 })
        .limit(500)
        .lean();
    } catch (err) {
      console.warn('Could not fetch articles for sitemap:', err.message);
    }

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of STATIC_PAGES) {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Add state report pages
    for (const state of US_STATES) {
      const stateSlug = encodeURIComponent(state);
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/reports/state-report?state=${stateSlug}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += '  </url>\n';
    }

    // Add article pages
    for (const article of articles) {
      const lastmod = (article.updatedAt || article.publishedAt || new Date())
        .toISOString()
        .split('T')[0];
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/insights?slug=${article.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Robots.txt
 * GET /robots.txt
 */
router.get('/robots.txt', (req, res) => {
  const robotsTxt = `# Dekleptocracy Robots.txt
User-agent: *
Allow: /

# Disallow API and private routes
Disallow: /api/
Disallow: /profile/
Disallow: /dashboard/
Disallow: /chatbot/debug

# Allow search engines to find the sitemap
Sitemap: ${BASE_URL}/sitemap.xml

# Crawl delay to be nice to the server
Crawl-delay: 1
`;

  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.send(robotsTxt);
});

/**
 * SEO Health Check
 * GET /api/seo/health
 */
router.get('/api/seo/health', async (req, res) => {
  try {
    const articleCount = await Article.countDocuments({ status: 'published' });

    res.json({
      status: 'ok',
      seo: {
        sitemap: `${BASE_URL}/sitemap.xml`,
        robots: `${BASE_URL}/robots.txt`,
        staticPages: STATIC_PAGES.length,
        statePages: US_STATES.length,
        articlePages: articleCount,
        totalUrls: STATIC_PAGES.length + US_STATES.length + articleCount,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
