/**
 * Web Vitals tracking utility
 * Measures Core Web Vitals and logs them locally
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import { logMetric } from './monitoring';

/**
 * Initialize Web Vitals tracking
 * Measures Core Web Vitals and logs them to localStorage
 */
export const initWebVitals = () => {
  // Cumulative Layout Shift
  onCLS((metric) => logMetric('CLS', metric.value, { rating: metric.rating }));

  // First Contentful Paint
  onFCP((metric) => logMetric('FCP', metric.value, { rating: metric.rating }));

  // Largest Contentful Paint
  onLCP((metric) => logMetric('LCP', metric.value, { rating: metric.rating }));

  // Time to First Byte
  onTTFB((metric) => logMetric('TTFB', metric.value, { rating: metric.rating }));

  // Interaction to Next Paint (replaces FID)
  onINP((metric) => logMetric('INP', metric.value, { rating: metric.rating }));
};
