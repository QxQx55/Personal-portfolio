'use strict';

// Shared localStorage cache used by github-calendar-custom.js and github.js.
// Loaded before both scripts in index.html.
window.CacheManager = (function () {
  const VERSION = '2.0';

  // Removes all entries this manager wrote, freeing space before a retry.
  function evictStaleEntries() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    for (const k of keys) {
      try {
        const entry = JSON.parse(localStorage.getItem(k));
        if (entry && entry.version === VERSION) localStorage.removeItem(k);
      } catch { /* not our entry */ }
    }
  }

  function set(key, data) {
    const payload = JSON.stringify({ data, timestamp: Date.now(), version: VERSION });
    try {
      localStorage.setItem(key, payload);
    } catch (error) {
      if (error.name !== 'QuotaExceededError') {
        console.warn('Cache write failed:', error.message);
        return;
      }
      evictStaleEntries();
      try {
        localStorage.setItem(key, payload);
      } catch {
        console.warn('Cache write failed: localStorage quota exceeded even after eviction');
      }
    }
  }

  // maxAge (ms) — omit to bypass TTL (useful for fallback / debug reads).
  function get(key, maxAge = Infinity) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp, version } = JSON.parse(cached);

      if (version !== VERSION) {
        clear(key);
        return null;
      }

      if (Date.now() - timestamp > maxAge) {
        clear(key);
        return null;
      }

      return data;
    } catch {
      clear(key);
      return null;
    }
  }

  function getAge(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      return Date.now() - JSON.parse(cached).timestamp;
    } catch {
      return null;
    }
  }

  function clear(key) {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  }

  return { set, get, getAge, clear };
})();
