// Authentication utilities
import { getApiUrl } from './apiUrl';

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

/**
 * Decode a JWT token without verification (client-side only)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[DEV] Error decoding token:', error);
    }
    return null;
  }
};

/**
 * Check if a token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired or invalid
 */
const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const expirationTime = decoded.exp * 1000;
  return Date.now() >= expirationTime;
};

/**
 * Check if user is authenticated (token exists and is not expired)
 * @returns {boolean} True if user has a valid, non-expired token
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  if (isTokenExpired(token)) {
    // Don't clear yet — the refresh token might still be valid
    // The apiClient will handle silent refresh on next API call
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && !isTokenExpired(refreshToken)) {
      return true;
    }
    clearAuth();
    return false;
  }

  return true;
};

/**
 * Get the current user from localStorage
 * @returns {object|null} User object or null
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[DEV] Error parsing user data:', error);
    }
    return null;
  }
};

/**
 * Get the authentication token
 * @returns {string|null} Token or null
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Get the refresh token
 * @returns {string|null} Refresh token or null
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

/**
 * Clear authentication data and redirect
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

/**
 * Set authentication data
 * @param {string} token - JWT access token
 * @param {object} user - User object
 * @param {string} [refreshToken] - JWT refresh token (optional for backward compat)
 */
export const setAuth = (token, user, refreshToken) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

/**
 * Verify token with backend
 * @returns {Promise<boolean>} True if token is valid
 */
export const verifyToken = async () => {
  const token = getToken();
  if (!token) {
    return false;
  }

  const API_URL = getApiUrl();

  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try silent refresh before giving up
        const refreshed = await silentRefresh();
        if (refreshed) {
          return true;
        }
        logout();
      }
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[DEV] Token verification error:', error);
    }
    logout();
    return false;
  }
};

/**
 * Attempt a silent token refresh
 * @returns {Promise<boolean>} True if refresh succeeded
 */
export const silentRefresh = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const API_URL = getApiUrl();

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Setup automatic token refresh before expiry
 * @param {function} refreshCallback - Callback to execute when token needs refresh
 * @returns {number|null} Timer ID for cleanup, or null if no valid token
 */
export const setupTokenRefresh = (refreshCallback) => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return null;

    const expiresIn = payload.exp * 1000 - Date.now();
    const refreshBuffer = 60 * 1000; // 1 minute before expiry (shorter for 15m tokens)

    if (expiresIn > refreshBuffer) {
      return setTimeout(async () => {
        const refreshed = await silentRefresh();
        if (refreshed) {
          // Set up next refresh cycle
          setupTokenRefresh(refreshCallback);
        }
        refreshCallback?.();
      }, expiresIn - refreshBuffer);
    } else {
      // Token about to expire — refresh now
      silentRefresh().then((refreshed) => {
        if (!refreshed) {
          refreshCallback?.();
        }
      });
    }
  } catch {
    // Token parsing failed
  }
  return null;
};

/**
 * Clear expired tokens on app initialization
 * @returns {boolean} True if valid token exists, false otherwise
 */
export const initAuthCheck = () => {
  const token = getToken();
  if (token && isTokenExpired(token)) {
    // Check if refresh token is still valid
    const refreshToken = getRefreshToken();
    if (refreshToken && !isTokenExpired(refreshToken)) {
      return true; // Will be refreshed on next API call
    }
    clearAuth();
    return false;
  }
  return !!token;
};
