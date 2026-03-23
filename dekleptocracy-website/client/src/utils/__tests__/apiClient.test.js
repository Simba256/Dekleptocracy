import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../apiUrl', () => ({
  getApiUrl: vi.fn(() => 'http://localhost:5000'),
}));

vi.mock('../auth', () => ({
  getToken: vi.fn(),
  silentRefresh: vi.fn(),
  logout: vi.fn(),
}));

import { apiClient } from '../apiClient';
import { getToken, silentRefresh, logout } from '../auth';

describe('apiClient', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  const mockResponse = (status = 200, body = {}) => ({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });

  describe('URL handling', () => {
    it('prepends API_URL to relative paths', async () => {
      getToken.mockReturnValue(null);
      fetch.mockResolvedValue(mockResponse(200));

      await apiClient('/api/data');

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/data', expect.any(Object));
    });

    it('uses full URL as-is for absolute URLs', async () => {
      getToken.mockReturnValue(null);
      fetch.mockResolvedValue(mockResponse(200));

      await apiClient('https://external.api.com/data');

      expect(fetch).toHaveBeenCalledWith('https://external.api.com/data', expect.any(Object));
    });
  });

  describe('headers', () => {
    it('adds Authorization header when token exists', async () => {
      getToken.mockReturnValue('test-token');
      fetch.mockResolvedValue(mockResponse(200));

      await apiClient('/api/data');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('does not add Authorization header when no token exists', async () => {
      getToken.mockReturnValue(null);
      fetch.mockResolvedValue(mockResponse(200));

      await apiClient('/api/data');

      const callHeaders = fetch.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty('Authorization');
    });

    it('sets Content-Type to application/json by default', async () => {
      getToken.mockReturnValue(null);
      fetch.mockResolvedValue(mockResponse(200));

      await apiClient('/api/data');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('does not set Content-Type for FormData body', async () => {
      getToken.mockReturnValue(null);
      fetch.mockResolvedValue(mockResponse(200));
      const formData = new FormData();

      await apiClient('/api/upload', { body: formData });

      const callHeaders = fetch.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty('Content-Type');
    });

    it('preserves custom headers passed in options', async () => {
      getToken.mockReturnValue(null);
      fetch.mockResolvedValue(mockResponse(200));

      await apiClient('/api/data', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });
  });

  describe('401 token refresh', () => {
    it('attempts silentRefresh on 401 when token exists', async () => {
      getToken.mockReturnValueOnce('expired-token').mockReturnValueOnce('new-token');
      silentRefresh.mockResolvedValue(true);
      fetch
        .mockResolvedValueOnce(mockResponse(401))
        .mockResolvedValueOnce(mockResponse(200, { data: 'success' }));

      await apiClient('/api/data');

      expect(silentRefresh).toHaveBeenCalledTimes(1);
    });

    it('retries request with new token after successful refresh', async () => {
      getToken.mockReturnValueOnce('expired-token').mockReturnValueOnce('new-token');
      silentRefresh.mockResolvedValue(true);
      fetch.mockResolvedValueOnce(mockResponse(401)).mockResolvedValueOnce(mockResponse(200));

      await apiClient('/api/data');

      expect(fetch).toHaveBeenCalledTimes(2);
      const retryHeaders = fetch.mock.calls[1][1].headers;
      expect(retryHeaders.Authorization).toBe('Bearer new-token');
    });

    it('calls logout and redirects when refresh fails', async () => {
      getToken.mockReturnValue('expired-token');
      silentRefresh.mockResolvedValue(false);
      fetch.mockResolvedValue(mockResponse(401));

      await apiClient('/api/data');

      expect(logout).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('/chatbot/login');
    });

    it('returns the 401 response when refresh fails', async () => {
      getToken.mockReturnValue('expired-token');
      silentRefresh.mockResolvedValue(false);
      const unauthorizedResponse = mockResponse(401);
      fetch.mockResolvedValue(unauthorizedResponse);

      const result = await apiClient('/api/data');

      expect(result).toBe(unauthorizedResponse);
    });

    it('does not attempt refresh on 401 without token', async () => {
      getToken.mockReturnValue(null);
      fetch.mockResolvedValue(mockResponse(401));

      await apiClient('/api/data');

      expect(silentRefresh).not.toHaveBeenCalled();
      expect(logout).not.toHaveBeenCalled();
    });
  });

  describe('non-401 responses', () => {
    it('does not attempt refresh on non-401 errors', async () => {
      getToken.mockReturnValue('valid-token');
      fetch.mockResolvedValue(mockResponse(500));

      const result = await apiClient('/api/data');

      expect(silentRefresh).not.toHaveBeenCalled();
      expect(result.status).toBe(500);
    });

    it('returns successful responses directly', async () => {
      getToken.mockReturnValue('valid-token');
      const successResponse = mockResponse(200, { data: 'ok' });
      fetch.mockResolvedValue(successResponse);

      const result = await apiClient('/api/data');

      expect(result).toBe(successResponse);
    });

    it('passes through request options to fetch', async () => {
      getToken.mockReturnValue(null);
      fetch.mockResolvedValue(mockResponse(200));

      await apiClient('/api/data', { method: 'POST', body: JSON.stringify({ key: 'value' }) });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' }),
        }),
      );
    });
  });
});
