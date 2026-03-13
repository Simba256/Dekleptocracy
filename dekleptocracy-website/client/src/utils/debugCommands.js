/**
 * Debug Commands Utility
 * Exposes debugging commands on window object in development mode
 */

import { getMetrics, clearMetrics } from './monitoring';
import { getErrors, clearErrors } from './errorLogger';

/**
 * Initialize debug commands on window object
 * Only available in development mode
 */
export const initDebugCommands = () => {
  if (!import.meta.env.DEV) return;

  window.__DEKLEPTOCRACY_DEBUG__ = {
    getMetrics,
    clearMetrics,
    getErrors,
    clearErrors,

    /**
     * Pretty print all stored metrics
     */
    showMetrics: () => {
      const metrics = getMetrics();
      console.table(metrics);
      return `${metrics.length} metrics stored`;
    },

    /**
     * Pretty print all stored errors
     */
    showErrors: () => {
      const errors = getErrors();
      console.table(errors);
      return `${errors.length} errors stored`;
    },

    /**
     * Show Web Vitals summary with latest values
     */
    showVitals: () => {
      const metrics = getMetrics();
      const vitals = ['CLS', 'FCP', 'LCP', 'TTFB', 'INP'];
      const latest = {};

      metrics.forEach(m => {
        if (vitals.includes(m.name)) {
          latest[m.name] = { value: m.value, rating: m.rating };
        }
      });

      console.table(latest);
      return latest;
    },

    /**
     * Show API health metrics
     */
    showAPIHealth: () => {
      const metrics = getMetrics();
      const apiMetrics = metrics.filter(m => m.name === 'api_health' || m.name === 'api_request');
      console.table(apiMetrics);
      return `${apiMetrics.length} API metrics`;
    },

    /**
     * Clear all stored data
     */
    clearAll: () => {
      clearMetrics();
      clearErrors();
      return 'All debug data cleared';
    }
  };

  console.log('[Dev] Debug commands available: window.__DEKLEPTOCRACY_DEBUG__');
};
