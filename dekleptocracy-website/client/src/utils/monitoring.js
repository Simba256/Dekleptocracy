/**
 * Lightweight client-side monitoring utility
 * Stores metrics in localStorage for debugging - no external calls
 */

import { STORAGE_KEYS } from './constants';

const MAX_ENTRIES = 50;

/**
 * Store a metric locally
 * @param {string} name - Metric name
 * @param {number|string} value - Metric value
 * @param {Object} metadata - Additional metadata
 */
export const logMetric = (name, value, metadata = {}) => {
  if (typeof window === 'undefined') return;

  const entry = {
    name,
    value,
    timestamp: Date.now(),
    path: window.location.pathname,
    ...metadata,
  };

  // Log in dev
  if (import.meta.env.DEV) {
    console.log(`[Metric] ${name}:`, value, metadata);
  }

  // Store in localStorage (keep last N entries)
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.METRICS) || '[]');
    stored.push(entry);
    if (stored.length > MAX_ENTRIES) stored.shift();
    localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(stored));
  } catch {
    // Silent fail - storage might be full
  }
};

/**
 * Get stored metrics (for debugging)
 * @returns {Array} Array of metric entries
 */
export const getMetrics = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.METRICS) || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear stored metrics
 */
export const clearMetrics = () => {
  localStorage.removeItem(STORAGE_KEYS.METRICS);
};
