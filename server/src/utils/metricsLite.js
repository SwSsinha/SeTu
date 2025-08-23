// Lightweight in-memory metrics counters
// Not a full Prometheus setup; hackathon-friendly.

const metrics = {
  totalRuns: 0,
  cacheHits: 0,
  totalScrapeMs: 0,
  scrapeRuns: 0,
  totalTranslateMs: 0,
  translateRuns: 0,
  totalTtsMs: 0,
  ttsRuns: 0,
  partialTranslations: 0,
  totalAudioBytes: 0,
  ttsFailures: 0,
};

function recordRun({ cacheHit, partial, audioBytes, phases = [] }) {
  metrics.totalRuns += 1;
  if (cacheHit) metrics.cacheHits += 1;
  if (partial) metrics.partialTranslations += 1;
  if (audioBytes) metrics.totalAudioBytes += audioBytes;
  // Phase timings
  for (const p of phases) {
    if (!p || !p.name || typeof p.ms !== 'number') continue;
    if (p.name === 'scrape') { metrics.totalScrapeMs += p.ms; metrics.scrapeRuns += 1; }
    if (p.name === 'translate') { metrics.totalTranslateMs += p.ms; metrics.translateRuns += 1; if (p.status === 'error') metrics.partialTranslations += 1; }
    if (p.name === 'tts') { metrics.totalTtsMs += p.ms; metrics.ttsRuns += 1; if (p.status === 'error') metrics.ttsFailures += 1; }
  }
}

function snapshot() {
  return {
    totalRuns: metrics.totalRuns,
    cacheHits: metrics.cacheHits,
    cacheHitRate: metrics.totalRuns ? +(metrics.cacheHits / metrics.totalRuns).toFixed(3) : 0,
    partialTranslations: metrics.partialTranslations,
    avgScrapeMs: metrics.scrapeRuns ? Math.round(metrics.totalScrapeMs / metrics.scrapeRuns) : 0,
    avgTranslateMs: metrics.translateRuns ? Math.round(metrics.totalTranslateMs / metrics.translateRuns) : 0,
    avgTtsMs: metrics.ttsRuns ? Math.round(metrics.totalTtsMs / metrics.ttsRuns) : 0,
    avgAudioBytes: metrics.totalRuns ? Math.round(metrics.totalAudioBytes / metrics.totalRuns) : 0,
    ttsFailures: metrics.ttsFailures,
  };
}

module.exports = { recordRun, snapshot };
