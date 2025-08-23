// Simple in-memory cache for processed article audio results.
// Keyed by a hash of (url + lang + voice).
// For hackathon purposes we keep everything in RAM with optional TTL.

const crypto = require('crypto');

const store = new Map(); // key -> { meta, audioBuffer, createdAt, lastAccess, ttl, id }
const idToKey = new Map(); // shortId -> key

const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour
const MAX_ITEMS = 100; // prevent unbounded growth

function makeKey({ url, lang, voice }) {
  const raw = `${url}\n${lang || ''}\n${voice || ''}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateShortId() {
  // 6-char base36 id; regenerate if collision
  let id;
  do {
    id = Math.random().toString(36).slice(2, 8);
  } while (idToKey.has(id));
  return id;
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
  // Ensure entry has an id for sharing
  if (!entry.id) {
    entry.id = generateShortId();
    idToKey.set(entry.id, key);
  }
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
  // preserve existing id if already cached (refresh) else generate
  let existing = store.get(key);
  let id = existing?.id || generateShortId();
  store.set(key, { ...data, createdAt: Date.now(), lastAccess: Date.now(), ttl, id });
  idToKey.set(id, key);
  return { key, id };
}

function getById(id) {
  const key = idToKey.get(id);
  if (!key) return null;
  const entry = store.get(key);
  if (!entry) return null;
  // TTL check
  if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
    store.delete(key);
    idToKey.delete(id);
    return null;
  }
  entry.lastAccess = Date.now();
  return { key, entry };
}

function stats() {
  return {
    items: store.size,
  };
}

module.exports = { getCached, setCached, stats, makeKey, getById };
