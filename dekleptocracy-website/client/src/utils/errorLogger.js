/**
 * Error Logging Utility
 * Stores errors locally in localStorage for debugging
 */

import { STORAGE_KEYS } from './constants';
import { logMetric } from './monitoring';

const MAX_ERRORS = 20;

/**
 * Log an error locally for debugging
 * @param {Error} error - The error to log
 * @param {Object} context - Additional context about the error
 */
export const logError = (error, context = {}) => {
  const entry = {
    message: error.message || String(error),
    stack: error.stack?.slice(0, 500), // Truncate stack
    timestamp: Date.now(),
    path: window.location.pathname,
    userAgent: navigator.userAgent?.slice(0, 100),
    ...context,
  };

  // Always log in dev
  if (import.meta.env.DEV) {
    console.error('[Error Logger]', error, context);
  }

  // Store locally
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.ERRORS) || '[]');
    stored.push(entry);
    if (stored.length > MAX_ERRORS) stored.shift();
    localStorage.setItem(STORAGE_KEYS.ERRORS, JSON.stringify(stored));
  } catch {
    // Silent fail
  }

  // Also log as metric
  logMetric('error', 1, { type: error.name || 'Error' });
};

/**
 * Get stored errors for debugging
 * @returns {Array} Array of error entries
 */
export const getErrors = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ERRORS) || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear stored errors
 */
export const clearErrors = () => {
  localStorage.removeItem(STORAGE_KEYS.ERRORS);
};
