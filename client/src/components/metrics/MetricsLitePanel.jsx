import { useEffect, useState, useRef } from 'react';
import { apiClient } from '../../lib/apiClient';

export function MetricsLitePanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [auto, setAuto] = useState(true); // 14.5 toggle
  const timerRef = useRef(null);

  async function load() {
    try { setError(null); const d = await apiClient.fetchMetricsLite(); setData(d); }
    catch (e) { setError(e.message || 'Failed metrics'); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (auto) {
      timerRef.current = setInterval(load, 30000);
      return () => { clearInterval(timerRef.current); };
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [auto]);

  return (
    <div className="border rounded-md p-3 space-y-2" aria-label="Metrics lite panel">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-tight">Metrics</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="text-[11px] underline"
          >Refresh</button>
          <label className="flex items-center gap-1 text-[11px] cursor-pointer">
            <input type="checkbox" checked={auto} onChange={(e)=> setAuto(e.target.checked)} /> auto
          </label>
        </div>
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      {!error && !data && (
        <div className="grid grid-cols-2 gap-2" aria-hidden="true">
          {Array.from({ length: 8 }).map((_,i)=>(<div key={i} className="h-4 rounded bg-muted/40 animate-pulse" />))}
        </div>
      )}
      {data && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <div>runs: <span className="font-mono">{data.totalRuns}</span></div>
          <div>cache hits: <span className="font-mono">{data.cacheHits}</span></div>
          <div>hit rate: <span className="font-mono">{(data.cacheHitRate*100).toFixed(1)}%</span></div>
          <div>partials: <span className="font-mono">{data.partialTranslations}</span></div>
          <div>avg scrape: <span className="font-mono">{data.avgScrapeMs}ms</span></div>
          <div>avg translate: <span className="font-mono">{data.avgTranslateMs}ms</span></div>
          <div>avg tts: <span className="font-mono">{data.avgTtsMs}ms</span></div>
          <div>avg bytes: <span className="font-mono">{data.avgAudioBytes}</span></div>
          <div>tts fails: <span className="font-mono">{data.ttsFailures}</span></div>
          <div>updated: <span className="font-mono">{new Date(data.ts||Date.now()).toLocaleTimeString()}</span></div>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground leading-snug">Approximate, resets on backend restart.</p>
    </div>
  );
}
