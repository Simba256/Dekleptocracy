import { getApiUrl } from './apiUrl';
import { getToken, silentRefresh, logout } from './auth';

let isRefreshing = false;
let refreshPromise = null;

/**
 * Authenticated fetch wrapper with automatic token refresh on 401
 * @param {string} url - Full URL or path (if path, API_URL is prepended)
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiClient = async (url, options = {}) => {
  const API_URL = getApiUrl();
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

  const token = getToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't override Content-Type for FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response = await fetch(fullUrl, { ...options, headers });

  // On 401, attempt silent refresh and retry once
  if (response.status === 401 && token) {
    // Deduplicate concurrent refresh attempts
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = silentRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;

    if (refreshed) {
      // Retry with new token
      const newToken = getToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(fullUrl, { ...options, headers });
    } else {
      // Refresh failed — log out
      logout();
      window.location.href = '/chatbot/login';
      return response;
    }
  }

  return response;
};

export default apiClient;
