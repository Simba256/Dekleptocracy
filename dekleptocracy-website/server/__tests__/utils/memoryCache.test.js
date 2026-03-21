import { describe, it, expect, beforeEach, vi } from 'vitest';
import cache, { MemoryCache } from '../../utils/memoryCache.js';

describe('MemoryCache', () => {
  beforeEach(() => {
    cache.clear();
  });

  describe('set/get', () => {
    it('should store and retrieve a value', () => {
      cache.set('key1', { data: 'hello' }, 60000);
      expect(cache.get('key1')).toEqual({ data: 'hello' });
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing keys', () => {
      cache.set('key1', 'first', 60000);
      cache.set('key1', 'second', 60000);
      expect(cache.get('key1')).toBe('second');
    });
  });

  describe('TTL expiry', () => {
    it('should return undefined after TTL expires', () => {
      vi.useFakeTimers();
      try {
        cache.set('expiring', 'value', 1000); // 1 second TTL
        expect(cache.get('expiring')).toBe('value');

        vi.advanceTimersByTime(1001);
        expect(cache.get('expiring')).toBeUndefined();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should still return value before TTL expires', () => {
      vi.useFakeTimers();
      try {
        cache.set('key', 'value', 5000);
        vi.advanceTimersByTime(4999);
        expect(cache.get('key')).toBe('value');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('max entries eviction', () => {
    it('should evict oldest entry when max capacity is reached', () => {
      const smallCache = new MemoryCache();
      // Fill up to max (200 entries)
      for (let i = 0; i < 200; i++) {
        smallCache.set(`key-${i}`, i, 60000);
      }
      expect(smallCache.size).toBe(200);

      // Adding one more should evict the first entry
      smallCache.set('key-new', 'new', 60000);
      expect(smallCache.size).toBe(200);
      expect(smallCache.get('key-0')).toBeUndefined(); // evicted
      expect(smallCache.get('key-new')).toBe('new');
      expect(smallCache.get('key-1')).toBe(1); // still there
    });
  });

  describe('delete', () => {
    it('should delete a specific key', () => {
      cache.set('to-delete', 'value', 60000);
      expect(cache.get('to-delete')).toBe('value');

      cache.delete('to-delete');
      expect(cache.get('to-delete')).toBeUndefined();
    });

    it('should return false for missing keys', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('a', 1, 60000);
      cache.set('b', 2, 60000);
      cache.set('c', 3, 60000);
      expect(cache.size).toBe(3);

      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });
  });
});
