/**
 * Simple in-memory TTL cache
 * No external dependencies. Max entries with oldest-eviction on overflow.
 */

const MAX_ENTRIES = 200;

class MemoryCache {
  constructor() {
    this._store = new Map(); // key -> { value, expiresAt }
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    // Evict oldest entry if at capacity (and we're adding a new key)
    if (!this._store.has(key) && this._store.size >= MAX_ENTRIES) {
      const oldestKey = this._store.keys().next().value;
      this._store.delete(oldestKey);
    }
    this._store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key) {
    return this._store.delete(key);
  }

  clear() {
    this._store.clear();
  }

  get size() {
    return this._store.size;
  }
}

// Singleton instance shared across the app
const cache = new MemoryCache();

export default cache;
export { MemoryCache };
