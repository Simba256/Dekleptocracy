# Phase 8: Analytics & Insights

## Overview

This phase focuses on implementing comprehensive analytics to understand user behavior, track key metrics, enable A/B testing, and gather insights for continuous improvement.

## Goals

1. Implement user behavior tracking
2. Set up conversion funnel analysis
3. Enable A/B testing framework
4. Create internal analytics dashboard
5. Track Core Web Vitals
6. Implement user feedback collection

---

## Analytics Strategy

### Key Metrics to Track

| Category | Metric | Purpose |
|----------|--------|---------|
| **Engagement** | Page views, session duration | Content interest |
| **Engagement** | Scroll depth | Content consumption |
| **Engagement** | Section visibility time | Feature interest |
| **Conversion** | Chatbot usage | Primary CTA |
| **Conversion** | Report downloads | Secondary CTA |
| **Conversion** | State selections | Personalization |
| **Performance** | Core Web Vitals | User experience |
| **Behavior** | Search queries | User intent |
| **Behavior** | Map interactions | Feature engagement |

---

## Implementation

### 1. Analytics Context

```jsx
// src/context/AnalyticsContext.jsx
import { createContext, useContext, useCallback, useEffect } from 'react';

const AnalyticsContext = createContext(null);

export const AnalyticsProvider = ({ children }) => {
  // Initialize analytics on mount
  useEffect(() => {
    // Initialize GA4
    if (window.gtag) {
      window.gtag('config', process.env.REACT_APP_GA_ID, {
        page_path: window.location.pathname
      });
    }

    // Initialize custom analytics
    initCustomAnalytics();
  }, []);

  // Track page view
  const trackPageView = useCallback((path, title) => {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title
      });
    }

    // Custom analytics
    sendEvent('page_view', { path, title });
  }, []);

  // Track custom event
  const trackEvent = useCallback((eventName, properties = {}) => {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }

    // Custom analytics
    sendEvent(eventName, properties);
  }, []);

  // Track user action
  const trackAction = useCallback((action, category, label, value) => {
    trackEvent('user_action', {
      action,
      category,
      label,
      value
    });
  }, [trackEvent]);

  // Track conversion
  const trackConversion = useCallback((conversionType, value) => {
    trackEvent('conversion', {
      conversion_type: conversionType,
      value
    });
  }, [trackEvent]);

  // Track timing
  const trackTiming = useCallback((category, variable, value) => {
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        event_category: category,
        name: variable,
        value: Math.round(value)
      });
    }
  }, []);

  return (
    <AnalyticsContext.Provider value={{
      trackPageView,
      trackEvent,
      trackAction,
      trackConversion,
      trackTiming
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
};

// Custom analytics backend
const sendEvent = async (eventName, properties) => {
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        userId: getUserId()
      })
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
};
```

### 2. Scroll Tracking Hook

```jsx
// src/hooks/useScrollTracking.js
import { useEffect, useRef, useCallback } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';

export const useScrollTracking = (sectionName) => {
  const { trackEvent } = useAnalytics();
  const sectionRef = useRef(null);
  const hasTracked = useRef({
    visible: false,
    '25%': false,
    '50%': false,
    '75%': false,
    '100%': false
  });
  const visibleTime = useRef(0);
  const visibleStart = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Track first visibility
            if (!hasTracked.current.visible) {
              hasTracked.current.visible = true;
              trackEvent('section_visible', { section: sectionName });
            }

            // Start timing
            visibleStart.current = Date.now();

            // Track scroll depth within section
            const ratio = entry.intersectionRatio;
            if (ratio >= 0.25 && !hasTracked.current['25%']) {
              hasTracked.current['25%'] = true;
              trackEvent('scroll_depth', { section: sectionName, depth: '25%' });
            }
            if (ratio >= 0.50 && !hasTracked.current['50%']) {
              hasTracked.current['50%'] = true;
              trackEvent('scroll_depth', { section: sectionName, depth: '50%' });
            }
            if (ratio >= 0.75 && !hasTracked.current['75%']) {
              hasTracked.current['75%'] = true;
              trackEvent('scroll_depth', { section: sectionName, depth: '75%' });
            }
            if (ratio >= 1.0 && !hasTracked.current['100%']) {
              hasTracked.current['100%'] = true;
              trackEvent('scroll_depth', { section: sectionName, depth: '100%' });
            }
          } else if (visibleStart.current) {
            // Calculate time visible
            visibleTime.current += Date.now() - visibleStart.current;
            visibleStart.current = null;
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1.0] }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();

      // Track total visible time on unmount
      if (visibleTime.current > 1000) {
        trackEvent('section_time', {
          section: sectionName,
          timeMs: visibleTime.current
        });
      }
    };
  }, [sectionName, trackEvent]);

  return sectionRef;
};
```

### 3. Core Web Vitals Tracking

```jsx
// src/utils/webVitals.js
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export const initWebVitals = (trackEvent) => {
  const reportMetric = (metric) => {
    const body = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating, // 'good', 'needs-improvement', 'poor'
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType
    };

    // Send to analytics
    trackEvent('web_vital', body);

    // Also send to Google Analytics
    if (window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true
      });
    }

    // Log for debugging
    console.log(`[Web Vital] ${metric.name}: ${metric.value} (${metric.rating})`);
  };

  onCLS(reportMetric);
  onFID(reportMetric);
  onFCP(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
  onINP(reportMetric);
};
```

### 4. A/B Testing Framework

```jsx
// src/hooks/useABTest.js
import { useState, useEffect } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';

const AB_TESTS = {
  'hero-cta': {
    variants: ['ask-ai', 'explore-data', 'see-impact'],
    weights: [0.34, 0.33, 0.33]
  },
  'state-selector-position': {
    variants: ['hero', 'sticky-header', 'floating'],
    weights: [0.5, 0.25, 0.25]
  },
  'social-proof-style': {
    variants: ['cards', 'carousel', 'testimonials'],
    weights: [0.34, 0.33, 0.33]
  }
};

export const useABTest = (testName) => {
  const { trackEvent } = useAnalytics();
  const [variant, setVariant] = useState(null);

  useEffect(() => {
    const test = AB_TESTS[testName];
    if (!test) {
      console.warn(`Unknown A/B test: ${testName}`);
      return;
    }

    // Check for existing assignment
    const storageKey = `ab_test_${testName}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      setVariant(stored);
      return;
    }

    // Assign new variant
    const random = Math.random();
    let cumulative = 0;
    let selectedVariant = test.variants[0];

    for (let i = 0; i < test.variants.length; i++) {
      cumulative += test.weights[i];
      if (random < cumulative) {
        selectedVariant = test.variants[i];
        break;
      }
    }

    // Store assignment
    localStorage.setItem(storageKey, selectedVariant);
    setVariant(selectedVariant);

    // Track assignment
    trackEvent('ab_test_assigned', {
      test: testName,
      variant: selectedVariant
    });
  }, [testName, trackEvent]);

  // Track conversion
  const trackConversion = (conversionType) => {
    trackEvent('ab_test_conversion', {
      test: testName,
      variant,
      conversion: conversionType
    });
  };

  return { variant, trackConversion };
};

// Usage
const HeroSection = () => {
  const { variant, trackConversion } = useABTest('hero-cta');

  const handleCTAClick = () => {
    trackConversion('cta_click');
    // ... navigation logic
  };

  return (
    <section className="hero">
      {variant === 'ask-ai' && (
        <button onClick={handleCTAClick}>Ask AI Now</button>
      )}
      {variant === 'explore-data' && (
        <button onClick={handleCTAClick}>Explore the Data</button>
      )}
      {variant === 'see-impact' && (
        <button onClick={handleCTAClick}>See Your Impact</button>
      )}
    </section>
  );
};
```

### 5. Backend Analytics API

```javascript
// server/routes/analyticsRoutes.js
import express from 'express';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { aggregateMetrics } from '../services/analyticsService.js';

const router = express.Router();

// Record event
router.post('/event', async (req, res) => {
  try {
    const { event, properties, timestamp, sessionId, userId } = req.body;

    await AnalyticsEvent.create({
      event,
      properties,
      timestamp: new Date(timestamp),
      sessionId,
      userId,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      referrer: req.headers.referer
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false });
  }
});

// Get dashboard metrics
router.get('/dashboard', async (req, res) => {
  const { startDate, endDate, granularity = 'day' } = req.query;

  try {
    const metrics = await aggregateMetrics({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      granularity
    });

    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get funnel analysis
router.get('/funnel', async (req, res) => {
  const { startDate, endDate, steps } = req.query;

  try {
    const funnelSteps = steps.split(',');
    const funnel = await analyzeFunnel(funnelSteps, {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });

    res.json({ success: true, funnel });
  } catch (error) {
    console.error('Funnel error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get A/B test results
router.get('/ab-tests/:testName', async (req, res) => {
  const { testName } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const results = await getABTestResults(testName, {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error('A/B test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

### 6. Analytics Dashboard Component

```jsx
// src/components/admin/AnalyticsDashboard/index.jsx
import { useState, useEffect } from 'react';
import { LineChart, BarChart, FunnelChart } from '../charts';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const response = await fetch(
        `/api/analytics/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();
      setMetrics(data.metrics);
      setLoading(false);
    };

    fetchMetrics();
  }, [dateRange]);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <MetricCard
          title="Page Views"
          value={metrics.pageViews}
          change={metrics.pageViewsChange}
        />
        <MetricCard
          title="Unique Visitors"
          value={metrics.uniqueVisitors}
          change={metrics.visitorsChange}
        />
        <MetricCard
          title="Avg. Session Duration"
          value={formatDuration(metrics.avgSessionDuration)}
          change={metrics.durationChange}
        />
        <MetricCard
          title="Chatbot Usage"
          value={metrics.chatbotSessions}
          change={metrics.chatbotChange}
        />
      </div>

      {/* Traffic Chart */}
      <div className="chart-section">
        <h2>Traffic Over Time</h2>
        <LineChart
          data={metrics.trafficTimeline}
          xKey="date"
          yKey="pageViews"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="chart-section">
        <h2>Conversion Funnel</h2>
        <FunnelChart
          data={[
            { step: 'Page View', count: metrics.pageViews },
            { step: 'State Selected', count: metrics.stateSelections },
            { step: 'Search Performed', count: metrics.searches },
            { step: 'Chatbot Opened', count: metrics.chatbotOpens },
            { step: 'Report Downloaded', count: metrics.downloads }
          ]}
        />
      </div>

      {/* Section Engagement */}
      <div className="chart-section">
        <h2>Section Engagement</h2>
        <BarChart
          data={metrics.sectionEngagement}
          xKey="section"
          yKey="avgTimeSeconds"
        />
      </div>

      {/* A/B Test Results */}
      <div className="chart-section">
        <h2>A/B Test Results</h2>
        <ABTestResults tests={metrics.abTests} />
      </div>
    </div>
  );
};
```

### 7. User Feedback Collection

```jsx
// src/components/common/FeedbackWidget/index.jsx
import { useState } from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';
import './FeedbackWidget.css';

const FeedbackWidget = () => {
  const { trackEvent } = useAnalytics();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    trackEvent('feedback_submitted', {
      rating,
      hasComment: feedback.length > 0,
      page: window.location.pathname
    });

    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating,
        feedback,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      })
    });

    setSubmitted(true);
    setTimeout(() => setIsOpen(false), 2000);
  };

  if (!isOpen) {
    return (
      <button
        className="feedback-trigger"
        onClick={() => {
          setIsOpen(true);
          trackEvent('feedback_opened');
        }}
      >
        Feedback
      </button>
    );
  }

  if (submitted) {
    return (
      <div className="feedback-widget">
        <p>Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="feedback-widget">
      <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>

      <h3>How useful was this page?</h3>

      <div className="rating-buttons">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            className={`rating-btn ${rating === value ? 'selected' : ''}`}
            onClick={() => setRating(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <textarea
        placeholder="Any additional feedback? (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />

      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={!rating}
      >
        Submit Feedback
      </button>
    </div>
  );
};

export default FeedbackWidget;
```

---

## Implementation Steps

### Step 1: Analytics Setup (Day 1)

- [ ] Set up Google Analytics 4
- [ ] Create AnalyticsContext
- [ ] Implement basic event tracking
- [ ] Add page view tracking
- [ ] Test analytics flow

### Step 2: Engagement Tracking (Day 2)

- [ ] Implement scroll tracking
- [ ] Add section visibility tracking
- [ ] Track click events
- [ ] Track search queries
- [ ] Add time on page tracking

### Step 3: Web Vitals (Day 2-3)

- [ ] Install web-vitals library
- [ ] Implement CWV tracking
- [ ] Set up CWV dashboard
- [ ] Add alerting for poor scores

### Step 4: A/B Testing (Day 3-4)

- [ ] Create A/B testing framework
- [ ] Implement variant assignment
- [ ] Track test conversions
- [ ] Build test results dashboard

### Step 5: Backend Analytics (Day 4-5)

- [ ] Create analytics API routes
- [ ] Implement event storage
- [ ] Build aggregation queries
- [ ] Create funnel analysis

### Step 6: Dashboard (Day 5-6)

- [ ] Build analytics dashboard
- [ ] Add key metrics cards
- [ ] Create charts/visualizations
- [ ] Add date range filters

### Step 7: Feedback (Day 6-7)

- [ ] Create feedback widget
- [ ] Implement feedback API
- [ ] Add feedback dashboard
- [ ] Set up feedback notifications

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Event tracking coverage | 90%+ of user actions |
| Web Vitals collection | 95%+ of page loads |
| A/B test statistical significance | 95% confidence |
| Dashboard load time | < 2 seconds |
| Feedback response rate | > 5% |

---

## Next Steps

After completing Phase 8:
1. Proceed to Phase 9 (Admin & CMS)
2. Analytics enables:
   - Data-driven content decisions
   - Feature prioritization
   - Performance optimization
