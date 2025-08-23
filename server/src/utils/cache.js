// Simple in-memory cache for processed article audio results.
// Keyed by a hash of (url + lang + voice).
// For hackathon purposes we keep everything in RAM with optional TTL.

const crypto = require('crypto');

const store = new Map(); // key -> { meta, audioBuffer, createdAt, lastAccess }

const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour
const MAX_ITEMS = 100; // prevent unbounded growth

function makeKey({ url, lang, voice }) {
  const raw = `${url}\n${lang || ''}\n${voice || ''}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function getCached(params) {
  const key = makeKey(params);
  const entry = store.get(key);
  if (!entry) return { hit: false, key };
  // TTL check
  if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
    store.delete(key);
    return { hit: false, key };
  }
  entry.lastAccess = Date.now();
  return { hit: true, key, entry };
}

function setCached(params, data, { ttl = DEFAULT_TTL_MS } = {}) {
  const key = makeKey(params);
  // Evict if oversized
  if (store.size >= MAX_ITEMS) {
    // naive eviction: oldest lastAccess
    let oldestKey; let oldestTs = Infinity;
    for (const [k, v] of store.entries()) {
      if (v.lastAccess < oldestTs) { oldestTs = v.lastAccess; oldestKey = k; }
    }
    if (oldestKey) store.delete(oldestKey);
  }
  store.set(key, { ...data, createdAt: Date.now(), lastAccess: Date.now(), ttl });
  return key;
}

function stats() {
  return {
    items: store.size,
  };
}

module.exports = { getCached, setCached, stats, makeKey };
