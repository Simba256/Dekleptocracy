/**
 * Get the correct API URL based on environment
 * Uses production URL when deployed, localhost for development
 */
export const getApiUrl = () => {
  // If we're on a non-localhost domain (production/preview), use the production backend URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return import.meta.env.VITE_API_URL_PRODUCTION || 'https://node-server-production-7f39.up.railway.app';
  }
  // For local development
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

// Export a constant for components that need a static value
export const API_URL = getApiUrl();

export default API_URL;
