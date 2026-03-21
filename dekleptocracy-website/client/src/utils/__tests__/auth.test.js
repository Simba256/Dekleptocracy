import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  clearAuth,
  isAuthenticated,
  getCurrentUser,
  getToken,
  logout,
  setAuth,
  verifyToken,
  setupTokenRefresh,
  initAuthCheck,
} from '../auth';

// Helper to create a valid JWT token
const createToken = (payload, expiresInSeconds = 3600) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = btoa(
    JSON.stringify({
      ...payload,
      exp: now + expiresInSeconds,
      iat: now,
    }),
  );
  const signature = btoa('fake-signature');
  return `${header}.${fullPayload}.${signature}`;
};

// Helper to create an expired token
const createExpiredToken = () => {
  return createToken({ sub: '123' }, -3600); // Expired 1 hour ago
};

describe('auth utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getToken', () => {
    it('returns null when no token exists', () => {
      expect(getToken()).toBeNull();
    });

    it('returns token when it exists', () => {
      localStorage.setItem('token', 'test-token');
      expect(getToken()).toBe('test-token');
    });
  });

  describe('setAuth', () => {
    it('stores token and user to localStorage', () => {
      const user = { id: '123', email: 'test@example.com' };
      setAuth('test-token', user);

      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
    });
  });

  describe('clearAuth', () => {
    it('removes token and user from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '123' }));

      clearAuth();

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('logout', () => {
    it('removes token and user from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '123' }));

      logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no token exists', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('returns false when token is expired', () => {
      localStorage.setItem('token', createExpiredToken());
      expect(isAuthenticated()).toBe(false);
    });

    it('returns true for valid non-expired token', () => {
      localStorage.setItem('token', createToken({ sub: '123' }));
      expect(isAuthenticated()).toBe(true);
    });

    it('clears expired token from storage', () => {
      localStorage.setItem('token', createExpiredToken());
      isAuthenticated();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('returns false for malformed token', () => {
      localStorage.setItem('token', 'invalid-token');
      expect(isAuthenticated()).toBe(false);
    });

    it('returns false for token without exp claim', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256' }));
      const payload = btoa(JSON.stringify({ sub: '123' })); // No exp
      const signature = btoa('sig');
      localStorage.setItem('token', `${header}.${payload}.${signature}`);
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when no user exists', () => {
      expect(getCurrentUser()).toBeNull();
    });

    it('parses and returns user object from localStorage', () => {
      const user = { id: '123', email: 'test@example.com' };
      localStorage.setItem('user', JSON.stringify(user));
      expect(getCurrentUser()).toEqual(user);
    });

    it('returns null on parse error', () => {
      localStorage.setItem('user', 'invalid-json');
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('initAuthCheck', () => {
    it('returns false when no token exists', () => {
      expect(initAuthCheck()).toBe(false);
    });

    it('clears expired tokens and returns false', () => {
      localStorage.setItem('token', createExpiredToken());
      expect(initAuthCheck()).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('returns true for valid token', () => {
      localStorage.setItem('token', createToken({ sub: '123' }));
      expect(initAuthCheck()).toBe(true);
    });
  });

  describe('setupTokenRefresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns null when no token exists', () => {
      const callback = vi.fn();
      expect(setupTokenRefresh(callback)).toBeNull();
    });

    it('returns null for expired token', () => {
      localStorage.setItem('token', createExpiredToken());
      const callback = vi.fn();
      expect(setupTokenRefresh(callback)).toBeNull();
    });

    it('returns null for token without exp', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256' }));
      const payload = btoa(JSON.stringify({ sub: '123' }));
      const signature = btoa('sig');
      localStorage.setItem('token', `${header}.${payload}.${signature}`);

      const callback = vi.fn();
      expect(setupTokenRefresh(callback)).toBeNull();
    });

    it('schedules callback before expiry', () => {
      // Token expires in 10 minutes
      localStorage.setItem('token', createToken({ sub: '123' }, 600));

      const callback = vi.fn();
      const timerId = setupTokenRefresh(callback);

      expect(timerId).not.toBeNull();
      expect(callback).not.toHaveBeenCalled();

      // Fast forward to just before the refresh time (5 min buffer)
      vi.advanceTimersByTime(4 * 60 * 1000);
      expect(callback).not.toHaveBeenCalled();

      // Fast forward past refresh time
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(callback).toHaveBeenCalledTimes(1);

      clearTimeout(timerId);
    });

    it('returns null if token expires within buffer period', () => {
      // Token expires in 3 minutes (less than 5 min buffer)
      localStorage.setItem('token', createToken({ sub: '123' }, 180));

      const callback = vi.fn();
      expect(setupTokenRefresh(callback)).toBeNull();
    });

    it('handles null callback gracefully', () => {
      localStorage.setItem('token', createToken({ sub: '123' }, 600));
      const timerId = setupTokenRefresh(null);
      expect(timerId).not.toBeNull();

      // Should not throw when timer fires
      vi.advanceTimersByTime(10 * 60 * 1000);
      clearTimeout(timerId);
    });
  });

  describe('verifyToken', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns false when no token exists', async () => {
      expect(await verifyToken()).toBe(false);
    });

    it('returns true when backend verification succeeds', async () => {
      localStorage.setItem('token', 'valid-token');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      expect(await verifyToken()).toBe(true);
    });

    it('returns false when backend returns non-200', async () => {
      localStorage.setItem('token', 'invalid-token');
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      expect(await verifyToken()).toBe(false);
    });

    it('clears auth on 401 response', async () => {
      localStorage.setItem('token', 'expired-token');
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await verifyToken();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('returns false and logs out on network error', async () => {
      localStorage.setItem('token', 'valid-token');
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      expect(await verifyToken()).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('returns false when success is not true', async () => {
      localStorage.setItem('token', 'valid-token');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });

      expect(await verifyToken()).toBe(false);
    });
  });
});
