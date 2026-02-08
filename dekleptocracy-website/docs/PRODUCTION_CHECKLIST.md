# Production Checklist

**Status**: Pre-Production (Domain Not Finalized)
**Last Updated**: February 8, 2026

This checklist covers all steps required before and after moving to the production domain.

---

## Pre-Production Tasks

### Domain Setup
- [ ] Finalize production domain name
- [ ] Purchase domain from registrar
- [ ] Configure DNS records (A, CNAME, TXT for verification)
- [ ] Set up SSL certificate (usually automatic with Vercel/Railway)

### Environment Configuration
- [ ] Update `BASE_URL` in `client/src/components/common/SEO/index.jsx`
- [ ] Update `BASE_URL` in `server/routes/seoRoutes.js`
- [ ] Update all hardcoded `dekleptocracy.vercel.app` references to production domain
- [ ] Update `client/index.html` meta tags with production domain
- [ ] Update `FRONTEND_URL` in server `.env`
- [ ] Update CORS allowed origins in `server/index.js`

### Files to Update with Production Domain
```
client/src/components/common/SEO/index.jsx    → const BASE_URL = 'https://YOUR_DOMAIN.com'
server/routes/seoRoutes.js                    → const BASE_URL = 'https://YOUR_DOMAIN.com'
client/index.html                             → og:url, twitter:url, canonical
server/.env                                   → FRONTEND_URL=https://YOUR_DOMAIN.com
```

---

## SEO Verification Steps

### Google Search Console
- [ ] Go to https://search.google.com/search-console
- [ ] Add property for production domain
- [ ] Verify domain ownership (DNS TXT record or HTML file)
- [ ] Submit sitemap: `https://YOUR_DOMAIN.com/sitemap.xml`
- [ ] Request indexing for homepage
- [ ] Monitor for crawl errors

### Bing Webmaster Tools
- [ ] Go to https://www.bing.com/webmasters
- [ ] Add site and verify ownership
- [ ] Submit sitemap
- [ ] Review SEO recommendations

### Social Media Debuggers
- [ ] Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
  - Enter production URL
  - Click "Scrape Again" to refresh cache
  - Verify og:title, og:description, og:image display correctly
- [ ] Twitter Card Validator: https://cards-dev.twitter.com/validator
  - Enter production URL
  - Verify card preview looks correct
- [ ] LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
  - Test how links will appear when shared

### Structured Data Validation
- [ ] Google Rich Results Test: https://search.google.com/test/rich-results
  - Test homepage for WebSite schema
  - Test /help for FAQ schema
  - Test /insights articles for Article schema
  - Test /reports/state-report for Dataset schema
- [ ] Schema.org Validator: https://validator.schema.org/
  - Validate JSON-LD markup

---

## Performance & Security

### Lighthouse Audits
- [ ] Run Lighthouse on production domain
- [ ] Performance score target: 70+
- [ ] Accessibility score target: 90+
- [ ] Best Practices score target: 90+
- [ ] SEO score target: 95+

### Security Headers
- [ ] Verify Helmet.js headers are applied
- [ ] Check Content-Security-Policy
- [ ] Verify HTTPS redirect is working
- [ ] Test for mixed content warnings

### SSL/TLS
- [ ] Verify SSL certificate is valid
- [ ] Check certificate expiration date
- [ ] Test with SSL Labs: https://www.ssllabs.com/ssltest/

---

## Analytics Setup (Phase 8)

### Google Analytics 4
- [ ] Create GA4 property for production domain
- [ ] Add measurement ID to environment variables
- [ ] Implement gtag.js or react-ga4
- [ ] Set up conversion events
- [ ] Configure data retention settings

### Privacy Compliance
- [ ] Add cookie consent banner (if required for your region)
- [ ] Update Privacy Policy with analytics disclosure
- [ ] Implement "Do Not Track" respect (optional)

---

## Monitoring & Alerts

### Uptime Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure alerts for downtime
- [ ] Monitor both frontend (Vercel) and backend (Railway)

### Error Tracking
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure source maps for production
- [ ] Set up alert thresholds

### Log Management
- [ ] Configure Railway logs retention
- [ ] Set up log aggregation if needed

---

## DNS & CDN Configuration

### Vercel (Frontend)
- [ ] Add custom domain in Vercel dashboard
- [ ] Configure DNS CNAME record pointing to `cname.vercel-dns.com`
- [ ] Verify SSL is provisioned
- [ ] Set up redirects (www → non-www or vice versa)

### Railway (Backend API)
- [ ] Add custom domain for API (e.g., api.YOUR_DOMAIN.com)
- [ ] Configure DNS records
- [ ] Update client API URLs to use custom domain
- [ ] Verify CORS works with new domain

---

## Final Verification

### Functional Testing
- [ ] Test all main user flows on production domain
- [ ] Verify API endpoints work correctly
- [ ] Test authentication flow (Google OAuth)
- [ ] Test state report generation
- [ ] Test chatbot functionality

### SEO Verification
- [ ] Verify robots.txt is accessible: `https://YOUR_DOMAIN.com/robots.txt`
- [ ] Verify sitemap.xml is accessible: `https://YOUR_DOMAIN.com/sitemap.xml`
- [ ] Check meta tags render correctly (view page source)
- [ ] Verify canonical URLs point to production domain
- [ ] Test social sharing preview

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Android)

---

## Post-Launch

### Week 1
- [ ] Monitor Google Search Console for indexing progress
- [ ] Check for any 404 errors or crawl issues
- [ ] Monitor server performance and errors
- [ ] Gather initial user feedback

### Week 2-4
- [ ] Review search rankings for target keywords
- [ ] Analyze traffic sources in analytics
- [ ] Optimize pages based on performance data
- [ ] Address any reported issues

### Ongoing
- [ ] Monthly SEO audit
- [ ] Quarterly security review
- [ ] Regular dependency updates
- [ ] Monitor Core Web Vitals

---

## Quick Reference: Current URLs

| Service | Current URL | Production URL |
|---------|-------------|----------------|
| Frontend | https://dekleptocracy.vercel.app | TBD |
| Node Server | https://node-server-production-7f39.up.railway.app | TBD |
| MCP Server | https://dekleptocracy-production.up.railway.app | TBD |
| Sitemap | /sitemap.xml | /sitemap.xml |
| Robots | /robots.txt | /robots.txt |

---

## Notes

- Current setup uses `dekleptocracy.vercel.app` as placeholder
- All SEO infrastructure is in place and working
- Domain change requires updating ~5 files (listed above)
- Railway and Vercel both support custom domains on free/paid plans
