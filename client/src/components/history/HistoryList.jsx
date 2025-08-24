import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/apiClient';
import { HistoryItem } from './HistoryItem';
import { Button } from '../ui/button';

export function HistoryList({ history, setHistory, onSelect, setHistoryMap }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const serverEntries = await apiClient.fetchHistory({ limit: 50, debug: true });
        let localEntries = [];
        try { const raw = localStorage.getItem('setu.historyEntries'); if (raw) localEntries = JSON.parse(raw); } catch {}
        if (!Array.isArray(localEntries)) localEntries = [];
        // Deduplicate: prefer server entry, key by runId || resultId || url+lang+voice+ts
        const map = new Map();
        const add = (e, source) => {
          const k = e.runId || e.resultId || `${e.url}|${e.lang}|${e.voice||''}`;
            if (map.has(k)) return;
          map.set(k, { ...e, source });
        };
        serverEntries.forEach(e => add(e, 'server'));
        localEntries.forEach(e => add(e, 'local'));
        const merged = Array.from(map.values())
          .sort((a,b) => (b.ts || 0) - (a.ts || 0))
          .slice(0, 100);
        if (!cancelled) setHistory(merged);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load history');
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [setHistory]);

  function clearLocalHistory() {
    if (!window.confirm('Clear local history? This will remove locally stored entries.')) return;
    try {
      localStorage.removeItem('setu.history');
      localStorage.removeItem('setu.historyEntries');
    } catch {}
    if (setHistoryMap) setHistoryMap({});
    // Keep server entries (source === 'server')
    const remaining = history.filter(h => h.source === 'server');
    setHistory(remaining);
  }

  return (
    <div className="space-y-2" aria-label="History section">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">History</h2>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={clearLocalHistory}
          disabled={history.length === 0 || !history.some(h => h.source === 'local')}
          aria-label="Clear local history"
          className="h-6 px-2 text-[11px]"
        >
          Clear
        </Button>
      </div>
      {/* 14.3: Local cache hit ratio from merged history */}
      {history.length > 0 && (
        (() => {
          const withCacheFlag = history.filter(h => typeof h.cacheHit === 'boolean');
          if (withCacheFlag.length === 0) return null;
          const hits = withCacheFlag.filter(h => h.cacheHit).length;
          const ratio = (hits / withCacheFlag.length) * 100;
          return <p className="text-[11px] text-muted-foreground">Cache hit ratio: <span className="font-mono">{hits}</span>/<span className="font-mono">{withCacheFlag.length}</span> ({ratio.toFixed(1)}%)</p>;
        })()
      )}
      {loading && (
        <div className="space-y-2" aria-hidden="true">
          {Array.from({ length: 4 }).map((_,i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-muted/40" />
          ))}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!loading && !error && history.length === 0 && (
        <p className="text-xs text-muted-foreground">No recent runs.</p>
      )}
      <ul className="space-y-2">
        {history.map(h => (
          <li key={h.runId || h.resultId || h.url + h.ts}>
            <HistoryItem entry={h} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  );
}
