import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/apiClient';
import { Badge } from '../ui/badge';

export function HistoryList({ history, setHistory, onSelect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const entries = await apiClient.fetchHistory({ limit: 30, debug: true });
        if (!cancelled) setHistory(entries);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load history');
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [setHistory]);

  return (
    <div className="space-y-2" aria-label="History section">
      <h2 className="text-sm font-semibold tracking-tight">History</h2>
      {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!loading && !error && history.length === 0 && (
        <p className="text-xs text-muted-foreground">No recent runs.</p>
      )}
      <ul className="space-y-2">
        {history.map(h => (
          <li key={h.runId || h.resultId}>
            <button
              type="button"
              onClick={() => onSelect?.(h)}
              className="w-full text-left border rounded-md p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] truncate" title={h.url}>{h.url}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {h.cacheHit && <Badge variant="outline">Cache</Badge>}
                  {h.partial && <Badge variant="secondary">Partial</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <span>{h.lang}</span>
                {h.voice && <span>{h.voice}</span>}
                {typeof h.durationMs === 'number' && <span>{h.durationMs}ms</span>}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
