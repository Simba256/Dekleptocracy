import { VALIDATION } from './constants';

/**
 * Sanitize user input - trim and enforce max length
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input, maxLength = VALIDATION.MAX_INPUT_LENGTH) => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return VALIDATION.EMAIL_REGEX.test(email.trim());
};

/**
 * Validate password meets requirements
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets minimum length
 */
export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
};

/**
 * Validate URL is safe (http/https only)
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid http/https URL
 */
export const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitize search query - trim, enforce length, remove dangerous characters
 * @param {string} query - Raw search query
 * @returns {string} Sanitized query
 */
export const sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return '';
  return query.trim().slice(0, VALIDATION.MAX_SEARCH_LENGTH).replace(/[<>]/g, '');
};
