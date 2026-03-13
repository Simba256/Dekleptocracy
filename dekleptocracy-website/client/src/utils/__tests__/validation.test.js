import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  isValidEmail,
  isValidPassword,
  isValidUrl,
  sanitizeSearchQuery,
} from '../validation';

describe('validation utilities', () => {
  describe('sanitizeInput', () => {
    it('trims whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('enforces max length', () => {
      expect(sanitizeInput('hello world', 5)).toBe('hello');
    });

    it('uses default max length when not specified', () => {
      const longString = 'a'.repeat(15000);
      expect(sanitizeInput(longString).length).toBe(10000);
    });

    it('returns empty string for non-string types', () => {
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput({})).toBe('');
      expect(sanitizeInput([])).toBe('');
    });

    it('handles empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('handles string with only whitespace', () => {
      expect(sanitizeInput('   ')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('no spaces@domain.com')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('rejects null and undefined', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
    });

    it('rejects non-string types', () => {
      expect(isValidEmail(123)).toBe(false);
      expect(isValidEmail({})).toBe(false);
    });

    it('trims whitespace before validation', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
    });
  });

  describe('isValidPassword', () => {
    it('accepts 8+ character passwords', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('exactlyeight')).toBe(true);
    });

    it('rejects short passwords', () => {
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidPassword('')).toBe(false);
    });

    it('rejects null and undefined', () => {
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
    });

    it('rejects non-string types', () => {
      expect(isValidPassword(12345678)).toBe(false);
      expect(isValidPassword({})).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('accepts http URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('accepts https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('rejects other protocols', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidUrl('file:///etc/passwd')).toBe(false);
    });

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });

    it('rejects null and undefined', () => {
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(undefined)).toBe(false);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('removes angle brackets', () => {
      expect(sanitizeSearchQuery('<script>')).toBe('script');
      expect(sanitizeSearchQuery('hello<world>')).toBe('helloworld');
    });

    it('enforces max length', () => {
      const longQuery = 'a'.repeat(600);
      expect(sanitizeSearchQuery(longQuery).length).toBe(500);
    });

    it('trims whitespace', () => {
      expect(sanitizeSearchQuery('  hello  ')).toBe('hello');
    });

    it('returns empty string for null and undefined', () => {
      expect(sanitizeSearchQuery(null)).toBe('');
      expect(sanitizeSearchQuery(undefined)).toBe('');
    });

    it('returns empty string for non-string types', () => {
      expect(sanitizeSearchQuery(123)).toBe('');
      expect(sanitizeSearchQuery({})).toBe('');
    });

    it('handles empty string', () => {
      expect(sanitizeSearchQuery('')).toBe('');
    });

    it('preserves safe characters', () => {
      expect(sanitizeSearchQuery('hello world 123')).toBe('hello world 123');
    });
  });
});
