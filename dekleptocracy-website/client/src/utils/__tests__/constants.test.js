import { describe, it, expect } from 'vitest';
import {
  STORAGE_KEYS,
  CACHE_CONFIG,
  API_ENDPOINTS,
  UI_CONFIG,
  VALIDATION,
  HTTP_STATUS,
  ROUTES,
  AUTH_CONFIG,
  ERROR_MESSAGES,
} from '../constants';

describe('constants', () => {
  describe('STORAGE_KEYS', () => {
    it('exports all required storage keys', () => {
      expect(STORAGE_KEYS).toHaveProperty('TOKEN');
      expect(STORAGE_KEYS).toHaveProperty('USER');
      expect(STORAGE_KEYS).toHaveProperty('USER_PROFILE');
      expect(STORAGE_KEYS).toHaveProperty('USER_PREFERENCES');
      expect(STORAGE_KEYS).toHaveProperty('CHAT_HISTORY');
    });

    it('has string values for all keys', () => {
      Object.values(STORAGE_KEYS).forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('CACHE_CONFIG', () => {
    it('exports cache TTL values', () => {
      expect(CACHE_CONFIG).toHaveProperty('DEFAULT_TTL_MS');
      expect(CACHE_CONFIG).toHaveProperty('SHORT_TTL_MS');
      expect(CACHE_CONFIG).toHaveProperty('LONG_TTL_MS');
    });

    it('has numeric values', () => {
      expect(typeof CACHE_CONFIG.DEFAULT_TTL_MS).toBe('number');
      expect(typeof CACHE_CONFIG.SHORT_TTL_MS).toBe('number');
      expect(typeof CACHE_CONFIG.LONG_TTL_MS).toBe('number');
    });

    it('has correct relative ordering', () => {
      expect(CACHE_CONFIG.SHORT_TTL_MS).toBeLessThan(CACHE_CONFIG.DEFAULT_TTL_MS);
      expect(CACHE_CONFIG.DEFAULT_TTL_MS).toBeLessThan(CACHE_CONFIG.LONG_TTL_MS);
    });
  });

  describe('API_ENDPOINTS', () => {
    it('exports auth endpoints', () => {
      expect(API_ENDPOINTS).toHaveProperty('LOGIN');
      expect(API_ENDPOINTS).toHaveProperty('REGISTER');
      expect(API_ENDPOINTS).toHaveProperty('GOOGLE_AUTH');
      expect(API_ENDPOINTS).toHaveProperty('LOGOUT');
    });

    it('exports user endpoints', () => {
      expect(API_ENDPOINTS).toHaveProperty('USER_PROFILE');
      expect(API_ENDPOINTS).toHaveProperty('USER_PREFERENCES');
    });

    it('exports data endpoints', () => {
      expect(API_ENDPOINTS).toHaveProperty('HOMEPAGE_DATA');
      expect(API_ENDPOINTS).toHaveProperty('CHATBOT');
      expect(API_ENDPOINTS).toHaveProperty('STATES');
    });

    it('all endpoints start with /api/', () => {
      Object.values(API_ENDPOINTS).forEach((endpoint) => {
        expect(endpoint.startsWith('/api/')).toBe(true);
      });
    });
  });

  describe('UI_CONFIG', () => {
    it('exports UI configuration values', () => {
      expect(UI_CONFIG).toHaveProperty('MAX_CHAT_MESSAGES');
      expect(UI_CONFIG).toHaveProperty('SEARCH_DEBOUNCE_MS');
      expect(UI_CONFIG).toHaveProperty('MODAL_ANIMATION_MS');
      expect(UI_CONFIG).toHaveProperty('TOAST_DURATION_MS');
    });

    it('has numeric values', () => {
      Object.values(UI_CONFIG).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });
  });

  describe('VALIDATION', () => {
    it('exports email regex', () => {
      expect(VALIDATION.EMAIL_REGEX).toBeInstanceOf(RegExp);
    });

    it('email regex matches valid emails', () => {
      expect(VALIDATION.EMAIL_REGEX.test('test@example.com')).toBe(true);
      expect(VALIDATION.EMAIL_REGEX.test('user.name@domain.org')).toBe(true);
    });

    it('email regex rejects invalid emails', () => {
      expect(VALIDATION.EMAIL_REGEX.test('invalid')).toBe(false);
      expect(VALIDATION.EMAIL_REGEX.test('@domain.com')).toBe(false);
    });

    it('exports password requirements', () => {
      expect(VALIDATION.PASSWORD_MIN_LENGTH).toBe(8);
    });

    it('exports username requirements', () => {
      expect(VALIDATION.USERNAME_MIN_LENGTH).toBe(2);
      expect(VALIDATION.USERNAME_MAX_LENGTH).toBe(50);
    });

    it('exports input length limits', () => {
      expect(VALIDATION.MAX_INPUT_LENGTH).toBe(10000);
      expect(VALIDATION.MAX_SEARCH_LENGTH).toBe(500);
      expect(VALIDATION.MAX_MESSAGE_LENGTH).toBe(50000);
    });
  });

  describe('HTTP_STATUS', () => {
    it('exports success codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
    });

    it('exports client error codes', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    });

    it('exports server error codes', () => {
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
    });
  });

  describe('ROUTES', () => {
    it('exports main routes', () => {
      expect(ROUTES.HOME).toBe('/');
      expect(ROUTES.ABOUT).toBe('/about');
      expect(ROUTES.CONTACT).toBe('/contact');
      expect(ROUTES.REPORTS).toBe('/reports');
    });

    it('exports auth routes', () => {
      expect(ROUTES.LOGIN).toBe('/chatbot/login');
      expect(ROUTES.CREATE_ACCOUNT).toBe('/chatbot/create-account');
      expect(ROUTES.PROFILE).toBe('/profile');
    });

    it('exports chatbot routes', () => {
      expect(ROUTES.CHATBOT).toBe('/chatbot');
    });

    it('all routes start with /', () => {
      Object.values(ROUTES).forEach((route) => {
        expect(route.startsWith('/')).toBe(true);
      });
    });
  });

  describe('AUTH_CONFIG', () => {
    it('exports token expiry buffer', () => {
      expect(AUTH_CONFIG.TOKEN_EXPIRY_BUFFER_SECONDS).toBe(60);
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('exports error messages', () => {
      expect(ERROR_MESSAGES).toHaveProperty('GENERIC');
      expect(ERROR_MESSAGES).toHaveProperty('NETWORK');
      expect(ERROR_MESSAGES).toHaveProperty('UNAUTHORIZED');
      expect(ERROR_MESSAGES).toHaveProperty('SESSION_EXPIRED');
      expect(ERROR_MESSAGES).toHaveProperty('INVALID_CREDENTIALS');
      expect(ERROR_MESSAGES).toHaveProperty('GOOGLE_SIGNIN_FAILED');
    });

    it('all messages are non-empty strings', () => {
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});
