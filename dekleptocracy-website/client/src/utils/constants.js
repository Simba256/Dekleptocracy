/**
 * Application Constants
 * Single source of truth for magic strings and configuration values
 */

// ============================================
// Local Storage Keys
// ============================================
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  USER_PROFILE: 'user_profile',
  USER_PREFERENCES: 'user_preferences',
  CHAT_HISTORY: 'dekleptocracy_chat_history',
  /** Legacy key for backward compatibility with preferences.js */
  USER_PREFERENCES_LEGACY: 'dekleptocracy_user_preferences',
  /** Monitoring metrics storage */
  METRICS: 'dekleptocracy_metrics',
  /** Error log storage */
  ERRORS: 'dekleptocracy_errors',
};

// ============================================
// Cache Configuration
// ============================================
export const CACHE_CONFIG = {
  /** Default cache TTL in milliseconds (5 minutes) */
  DEFAULT_TTL_MS: 5 * 60 * 1000,
  /** Short cache TTL in milliseconds (1 minute) */
  SHORT_TTL_MS: 1 * 60 * 1000,
  /** Long cache TTL in milliseconds (30 minutes) */
  LONG_TTL_MS: 30 * 60 * 1000,
};

// ============================================
// API Endpoints
// ============================================
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  GOOGLE_AUTH: '/api/auth/google',
  LOGOUT: '/api/auth/logout',

  // User
  USER_PROFILE: '/api/user/profile',
  USER_PREFERENCES: '/api/user/preferences',

  // Data
  HOMEPAGE_DATA: '/api/homepage-data',
  CHATBOT: '/api/chatbot',
  STATES: '/api/states',
};

// ============================================
// UI Configuration
// ============================================
export const UI_CONFIG = {
  /** Maximum chat messages to display before pagination */
  MAX_CHAT_MESSAGES: 100,
  /** Debounce delay for search inputs (ms) */
  SEARCH_DEBOUNCE_MS: 300,
  /** Animation duration for modals (ms) */
  MODAL_ANIMATION_MS: 300,
  /** Toast notification display duration (ms) */
  TOAST_DURATION_MS: 5000,
};

// ============================================
// Validation Patterns
// ============================================
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 2,
  USERNAME_MAX_LENGTH: 50,
  MAX_INPUT_LENGTH: 10000,
  MAX_SEARCH_LENGTH: 500,
  MAX_MESSAGE_LENGTH: 50000,
};

// ============================================
// HTTP Status Codes
// ============================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

// ============================================
// Route Paths
// ============================================
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  REPORTS: '/reports',
  INSIGHTS: '/insights',
  CHATBOT: '/chatbot',
  LOGIN: '/chatbot/login',
  CREATE_ACCOUNT: '/chatbot/create-account',
  PROFILE: '/profile',
  SURVEY: '/survey',
  TERMS: '/terms-of-service',
  PRIVACY: '/privacy-policy',
};

// ============================================
// Auth Configuration
// ============================================
export const AUTH_CONFIG = {
  /** Buffer time in seconds before token expiry to consider it expired */
  TOKEN_EXPIRY_BUFFER_SECONDS: 60,
};

// ============================================
// Error Messages
// ============================================
export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  GOOGLE_SIGNIN_FAILED: 'Google sign-in failed. Please try again.',
};
