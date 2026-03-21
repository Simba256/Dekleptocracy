/**
 * Homepage API Client
 * Centralized API functions for all homepage endpoints
 */

import { API_URL } from '../utils/apiUrl';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper for API error handling
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Fetch wallet shocks for a specific state
 * @param {string} state - State name or 'nationwide'
 * @param {number} limit - Number of shocks to fetch (default: 4)
 * @param {string} sortBy - Sort order: 'date', 'change', 'abs-change'
 */
export const fetchWalletShocks = async (state = 'nationwide', limit = 4, sortBy = 'date') => {
  const response = await fetch(
    `${API_URL}/api/homepage/wallet-shocks?state=${encodeURIComponent(state)}&limit=${limit}&sortBy=${sortBy}`,
    { headers: getAuthHeaders() },
  );
  return handleResponse(response);
};

/**
 * Fetch cost drivers for a specific state and time period
 * @param {string} state - State name or 'nationwide'
 * @param {string} period - Time period: 'YoY', '3 months', '30 days'
 */
export const fetchCostDrivers = async (state = 'nationwide', period = 'YoY') => {
  const response = await fetch(
    `${API_URL}/api/homepage/cost-drivers?state=${encodeURIComponent(state)}&period=${encodeURIComponent(period)}`,
    { headers: getAuthHeaders() },
  );
  return handleResponse(response);
};

/**
 * Fetch stats summary for a specific state
 * @param {string} state - State name or 'nationwide'
 */
export const fetchStats = async (state = 'nationwide') => {
  const response = await fetch(`${API_URL}/api/homepage/stats?state=${encodeURIComponent(state)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Fetch state comparison data
 * @param {string} state - State name or 'nationwide'
 */
export const fetchStateComparison = async (state = 'nationwide') => {
  const response = await fetch(
    `${API_URL}/api/homepage/state-comparison?state=${encodeURIComponent(state)}`,
    { headers: getAuthHeaders() },
  );
  return handleResponse(response);
};

/**
 * Fetch product impact data
 * @param {string} product - Product name to search
 * @param {string} state - State name or 'nationwide'
 */
export const fetchProductImpact = async (product, state = 'nationwide') => {
  const params = new URLSearchParams();
  if (product) params.append('product', product);
  if (state) params.append('state', state);

  const response = await fetch(`${API_URL}/api/homepage/product-impact?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Fetch social posts for the conversation section
 * @param {number} limit - Number of posts to fetch (default: 6)
 * @param {string} state - Optional state filter
 */
export const fetchSocialPosts = async (limit = 6, state = null) => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (state) params.append('state', state);

  const response = await fetch(`${API_URL}/api/homepage/social-posts?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Fetch map data for heat map
 */
export const fetchMapData = async () => {
  const response = await fetch(`${API_URL}/api/homepage/map-data`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

/**
 * Fetch nearby shocks for a location
 * @param {string} state - State name or 'nationwide'
 * @param {number} limit - Number of shocks (default: 5)
 */
export const fetchNearbyShocks = async (state = 'nationwide', limit = 5) => {
  const response = await fetch(
    `${API_URL}/api/homepage/nearby-shocks?state=${encodeURIComponent(state)}&limit=${limit}`,
    { headers: getAuthHeaders() },
  );
  return handleResponse(response);
};

/**
 * Fetch quick questions for the search box
 * @param {number} limit - Number of questions (default: 3)
 * @param {string} state - Optional state for personalization
 */
export const fetchQuickQuestions = async (limit = 3, state = null) => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (state) params.append('state', state);

  const response = await fetch(`${API_URL}/api/homepage/quick-questions?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Track quick question click
 * @param {string} questionId - Question ID
 */
export const trackQuestionClick = async (questionId) => {
  const response = await fetch(`${API_URL}/api/homepage/quick-questions/${questionId}/click`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Fetch featured states
 */
export const fetchFeaturedStates = async () => {
  const response = await fetch(`${API_URL}/api/homepage/featured-states`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Fetch timeline configuration
 */
export const fetchTimelineConfig = async () => {
  const response = await fetch(`${API_URL}/api/homepage/timeline-config`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Fetch trending products
 * @param {number} limit - Number of products (default: 5)
 */
export const fetchTrendingProducts = async (limit = 5) => {
  const response = await fetch(`${API_URL}/api/homepage/trending-products?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Fetch available states with data
 */
export const fetchAvailableStates = async () => {
  const response = await fetch(`${API_URL}/api/homepage/available-states`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Add reaction to a wallet shock
 * @param {string} shockId - Wallet shock ID
 * @param {string} reactionType - 'shock', 'angry', or 'sad'
 */
export const addReaction = async (shockId, reactionType) => {
  const response = await fetch(`${API_URL}/api/homepage/wallet-shocks/${shockId}/react`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reactionType }),
  });
  return handleResponse(response);
};

/**
 * Download PDF report
 * @param {string} state - State name
 * @param {string} period - Time period
 */
export const downloadReport = (state = 'nationwide', period = 'YoY') => {
  window.location.href = `${API_URL}/api/homepage/download/report?state=${encodeURIComponent(state)}&period=${period}`;
};

/**
 * Download CSV export
 * @param {string} state - State name
 */
export const downloadCSV = (state = 'nationwide') => {
  window.open(`${API_URL}/api/homepage/download/csv?state=${encodeURIComponent(state)}`, '_blank');
};

/**
 * Fetch all homepage data in a single aggregated request
 * Uses /api/homepage/all endpoint to reduce HTTP round trips from 7 to 1
 * @param {string} state - State name
 * @param {string} timePeriod - Time period
 */
export const fetchAllHomepageData = async (state = 'nationwide', timePeriod = 'YoY') => {
  const params = new URLSearchParams({
    state: state,
    period: timePeriod,
  });

  const response = await fetch(`${API_URL}/api/homepage/all?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  const result = await handleResponse(response);

  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch homepage data');
  }

  return {
    walletShocks: result.data.walletShocks || [],
    costDrivers: result.data.costDrivers || [],
    stats: result.data.stats || {},
    stateComparisons: result.data.stateComparisons || [],
    socialPosts: result.data.socialPosts || [],
    quickQuestions: result.data.quickQuestions || [],
    timelineConfig: result.data.timelineConfig || null,
  };
};

export default {
  fetchWalletShocks,
  fetchCostDrivers,
  fetchStats,
  fetchStateComparison,
  fetchProductImpact,
  fetchSocialPosts,
  fetchMapData,
  fetchNearbyShocks,
  fetchQuickQuestions,
  trackQuestionClick,
  fetchFeaturedStates,
  fetchTimelineConfig,
  fetchTrendingProducts,
  fetchAvailableStates,
  addReaction,
  downloadReport,
  downloadCSV,
  fetchAllHomepageData,
};
