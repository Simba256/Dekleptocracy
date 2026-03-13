// Authentication utilities
import { getApiUrl } from './apiUrl';

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Decode a JWT token without verification (client-side only)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
const decodeToken = (token) => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (base64url encoded)
    const payload = parts[1];
    // Handle base64url encoding (replace - with + and _ with /)
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

  // exp is in seconds, Date.now() is in milliseconds
  // Add 60 second buffer to handle clock skew
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

  // Check if token is expired
  if (isTokenExpired(token)) {
    // Clear expired token and user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
 * Clear authentication data
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Set authentication data
 * @param {string} token - JWT token
 * @param {object} user - User object
 */
export const setAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Token is invalid or expired
      if (response.status === 401) {
        // Clear invalid token
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
    // If backend is not reachable or there's an error, deny access
    // This ensures security - user must have valid token verified by backend
    logout();
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
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry

    if (expiresIn > refreshBuffer) {
      return setTimeout(() => {
        refreshCallback?.();
      }, expiresIn - refreshBuffer);
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
    clearAuth();
    return false;
  }
  return !!token;
};
