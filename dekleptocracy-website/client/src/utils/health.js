/**
 * API Health Check Utility
 * Provides functions to check API connectivity and track request performance
 */

import { API_URL } from './apiUrl';
import { logMetric } from './monitoring';

/**
 * Check if the API is reachable
 * @returns {Promise<{ok: boolean, latency: number}>}
 */
export const checkAPIHealth = async () => {
  const start = performance.now();

  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'HEAD',
      cache: 'no-store',
    });

    const latency = Math.round(performance.now() - start);
    const ok = response.ok;

    logMetric('api_health', latency, { ok });

    return { ok, latency };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    logMetric('api_health', latency, { ok: false, error: error.message });
    return { ok: false, latency };
  }
};

/**
 * Track API request performance
 * @param {string} endpoint - API endpoint called
 * @param {number} duration - Request duration in ms
 * @param {boolean} success - Whether the request succeeded
 */
export const trackAPIRequest = (endpoint, duration, success) => {
  logMetric('api_request', duration, { endpoint, success });
};
