import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSingleProcessState } from '../../hooks/useSingleProcessState';
import { apiClient } from '../../lib/apiClient';
import { Spinner } from '../shared/Spinner';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useEffect, useState, useRef } from 'react';

// Static single process form (Step 1.3) – only structure, no logic yet.
export default function SingleProcessForm({ externalState }) {
  const state = externalState || useSingleProcessState();
  const {
  url, lang, status, audioSrc, audioBlob, phases, summary, resultId, runId, partial, cacheHit, ttsProvider, totalMs, retries, headers, translationChars, summaryChars, voices, voicesLoading, voice, inFlightKey, historyMap, error, resultMeta,
  setUrl, setLang, setStatus, setAudioSrc, setAudioBlob, setPhases, setSummary, setResultId, setRunId, setPartial, setCacheHit, setTtsProvider, setTotalMs, setRetries, setHeaders, setTranslationChars, setSummaryChars, setVoices, setVoicesLoading, setVoice, setInFlightKey, setHistoryMap, setError, setResultMeta, reset,
  } = state;

  const disabled = status === 'loading';
  // Step 13.4: AbortController for in-flight request
  const abortRef = useRef(null);
  // Keep last submission payload for retry (13.3)
  const lastRequestRef = useRef(null);
  const urlTrimmed = url.trim();

  const presetLangs = ['hi','en','es'];
  const isCustomLang = lang && !presetLangs.includes(lang);
  const [customLang, setCustomLang] = useState(isCustomLang ? lang : '');
  const activeSelectValue = isCustomLang ? 'custom' : (lang || 'en');
  const customLangTrimmed = customLang.trim();
  const customLangValid = !isCustomLang || (/^[a-z-]{2,5}$/.test(customLangTrimmed) && customLangTrimmed.length>0);
  const canSubmit = !disabled && urlTrimmed.length > 0 && customLangValid;

  function isValidHttpUrl(str) {
    try { const u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
  }
  const urlValid = urlTrimmed.length === 0 ? true : isValidHttpUrl(urlTrimmed);
  const showUrlError = urlTrimmed.length > 0 && !urlValid;
  const showLangError = activeSelectValue === 'custom' && customLang.length > 0 && !customLangValid;

  // Sync custom language field if parent updates lang externally (history repopulation)
  useEffect(() => {
    if (!presetLangs.includes(lang)) {
      setCustomLang(lang);
    } else if (presetLangs.includes(lang) && customLang) {
      // Clear stale custom value when switching back to preset
      setCustomLang('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (disabled) return;
    if (!urlTrimmed) {
      setError('URL is required');
      setStatus('error');
      return;
    }
    const effectiveLang = isCustomLang ? customLangTrimmed : lang;
    const key = `${urlTrimmed}|${effectiveLang}|${voice}`;
    if (inFlightKey && inFlightKey === key) {
      return; // duplicate in-flight
    }
    setInFlightKey(key);
    lastRequestRef.current = { url: urlTrimmed, effectiveLang, voice };
    // Abort any prior
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} }
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setAudioSrc(null);
  setStatus('loading');
    try {
      // Timeline endpoint – includes phases, summary, totalMs (Step 4.6 adds totalMs usage)
  const { objectUrl, blob, phases: ph, summary: sum, resultId: rid, runId: rrun, partial: part, cacheHit: cHit, totalMs: tot, retries: rtries, headers: hdrs, translationChars: tChars, summaryChars: sChars, json } = await apiClient.postProcessTimeline({ url: urlTrimmed, lang: effectiveLang, voice, signal: controller.signal });
  if (objectUrl) setAudioSrc(objectUrl);
  if (blob) setAudioBlob(blob);
  setPhases(ph);
  setSummary(sum);
  setResultId(rid);
  setPartial(part);
  setTotalMs(tot);
  if (json?.ttsProvider) setTtsProvider(json.ttsProvider);
  if (rrun) setRunId(rrun);
  if (typeof cHit === 'boolean') setCacheHit(cHit);
  if (rtries) setRetries(rtries);
  if (hdrs) setHeaders(hdrs);
  if (typeof tChars === 'number') setTranslationChars(tChars);
  if (typeof sChars === 'number') setSummaryChars(sChars);
      setStatus('done');
      // Fetch result metadata (Step 9.1)
      if (rid) {
        apiClient.fetchResultMeta(rid).then(meta => {
          setResultMeta(meta);
        }).catch(()=>{});
      }
      // Record history entry
      try {
        const now = Date.now();
        const next = { ...historyMap, [key]: { ts: now } };
        setHistoryMap(next);
        localStorage.setItem('setu.history', JSON.stringify(next));
        // Extended local history entries for server merge (step 8.2)
        let summaryPreview = '';
        if (sum && typeof sum === 'string' && sum.length > 0) {
          summaryPreview = sum.slice(0, 120);
        } else if (hdrs && hdrs['x-summary-preview']) {
          try { summaryPreview = decodeURIComponent(hdrs['x-summary-preview']); } catch { summaryPreview = hdrs['x-summary-preview']; }
        }
        const entry = {
          runId: rrun || null,
          resultId: rid || null,
          url: urlTrimmed,
          lang: effectiveLang,
          voice: voice || null,
          partial: !!part,
          cacheHit: !!cHit,
          durationMs: tot || 0,
          summaryPreview: summaryPreview || null,
          ts: now,
          source: 'local'
        };
        let localArr = [];
        try { localArr = JSON.parse(localStorage.getItem('setu.historyEntries') || '[]'); if (!Array.isArray(localArr)) localArr = []; } catch { localArr = []; }
        localArr.unshift(entry);
        // cap to 100
        if (localArr.length > 100) localArr.length = 100;
        localStorage.setItem('setu.historyEntries', JSON.stringify(localArr));
      } catch {}
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('idle');
        setError('Cancelled'); // Step 13.5
      } else {
        // Step 13.1/13.2 classification & guidance
        let guidance = '';
        const statusCode = err.status;
        if (statusCode) {
          if (statusCode >= 400 && statusCode < 500) {
            guidance = 'Client/validation issue. Check URL and language.';
          } else if (statusCode >= 500) {
            guidance = 'Upstream/server issue. You can retry shortly.';
          }
          if (err.phase === 'translate') {
            guidance = 'Translation failed. If partial translation was produced earlier, retry may succeed or produce partial audio.';
          } else if (err.phase === 'tts') {
            guidance = 'TTS failed. Retry will re-run all phases (no granular TTS-only retry).';
          } else if (err.phase === 'scrape') {
            guidance = 'Scrape failed. The site may block requests or be temporarily unavailable.';
          }
        }
        const msg = err.message || 'Failed';
        setError(guidance ? `${msg} – ${guidance}` : msg);
        setStatus('error');
      }
    } finally {
      setInFlightKey(null);
      abortRef.current = null;
    }
  }

  // 13.3 Retry last failed (full request re-run) explanation via function
  function handleRetryLast() {
    if (status === 'loading') return;
    const last = lastRequestRef.current;
    if (!last) return;
    // Re-hydrate form values (in case changed) then submit
    setUrl(last.url);
    setLang(last.effectiveLang || lang);
    handleSubmit(new Event('submit'));
  }

  function handleCancel() {
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
  }

  // Load persisted history once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('setu.history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setHistoryMap(parsed);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute age for current key
  const effectiveLang = isCustomLang ? customLangTrimmed : lang;
  const currentKey = `${urlTrimmed}|${effectiveLang}|${voice}`;
  let lastAgeMs = null;
  if (historyMap[currentKey]) {
    lastAgeMs = Date.now() - historyMap[currentKey].ts;
  }

  // Fetch voices on mount (Step 6.1)
  useEffect(() => {
    let cancelled = false;
    setVoicesLoading(true);
    apiClient.fetchVoices().then(list => {
      if (cancelled) return;
      setVoices(list);
      // Load persisted voice preference
      try {
        const saved = localStorage.getItem('setu.voice');
        if (saved && list.includes(saved)) {
          setVoice(saved);
          return;
        }
      } catch {}
      if (!voice && list.length > 0) setVoice(list[0]);
    }).catch(err => {
      if (!cancelled) console.warn('voices fetch failed', err);
    }).finally(() => { if (!cancelled) setVoicesLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist voice selection
  useEffect(() => {
    if (voice) {
      try { localStorage.setItem('setu.voice', voice); } catch {}
    }
  }, [voice]);

  // Load persisted language preference (Step 6.5)
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('setu.lang');
      if (savedLang && /^[a-z-]{2,5}$/.test(savedLang)) {
        setLang(savedLang);
        if (!presetLangs.includes(savedLang)) setCustomLang(savedLang);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist language when valid (Step 6.5)
  useEffect(() => {
    const effective = isCustomLang ? customLangTrimmed : lang;
    if (effective && /^[a-z-]{2,5}$/.test(effective)) {
      try { localStorage.setItem('setu.lang', effective); } catch {}
    }
  }, [lang, isCustomLang, customLangTrimmed]);

  // TTL countdown (Step 9.2)
  const [ttlMs, setTtlMs] = useState(null);
  useEffect(() => {
    if (status !== 'done' || !resultMeta || typeof resultMeta.ttlRemaining !== 'number') { setTtlMs(null); return; }
    setTtlMs(resultMeta.ttlRemaining);
    let raf; let last = performance.now();
    function tick(ts) {
      const delta = ts - last; last = ts;
      setTtlMs(prev => (prev === null ? null : Math.max(0, prev - delta)));
      if (ttlMs === 0) return; // stop when zero
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [status, resultMeta]);

  return (
    <Card className="p-6 space-y-4" role="region" aria-labelledby="single-process-heading">
      <div>
        <h1 id="single-process-heading" className="text-2xl font-bold tracking-tight">Single Process</h1>
        <p className="text-sm text-muted-foreground">Enter a URL to generate summary, translation & audio.</p>
      </div>
      {/* Example URLs (Step 7.1) */}
      <div className="flex flex-wrap gap-2" aria-label="Example URLs">
        <Button type="button" variant="outline" size="sm" onClick={() => setUrl('https://en.wikipedia.org/wiki/Artificial_intelligence')}>
          Try AI (Wikipedia)
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setUrl('https://www.un.org/en/climatechange/what-is-climate-change')}>
          Try Climate (UN)
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setUrl('https://www.britannica.com/technology/blockchain')}>
          Try Blockchain
        </Button>
      </div>
  <form className="space-y-5" aria-describedby="single-process-desc" onSubmit={handleSubmit} noValidate>
        <p id="single-process-desc" className="sr-only">Provide source URL and select target language to process content.</p>
        <fieldset className="space-y-5" disabled={disabled} aria-busy={disabled} aria-live="polite">
          <legend className="sr-only">Processing inputs</legend>
          <div className="space-y-2">
            <Label htmlFor="url">Source URL</Label>
            <Input
              id="url"
              placeholder="https://example.com/article"
              aria-required="true"
              aria-invalid={showUrlError}
              className={showUrlError ? 'border-destructive focus:ring-destructive' : undefined}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {showUrlError && (
              <p className="text-[11px] mt-1 text-destructive" role="alert">Enter a valid http(s) URL.</p>
            )}
            {lastAgeMs !== null && !showUrlError && (
              <p className="text-[11px] text-muted-foreground">Last processed {(lastAgeMs/1000).toFixed(1)}s ago</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              value={activeSelectValue}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'custom') {
                  setLang(customLangTrimmed || '');
                } else {
                  setLang(v);
                  setCustomLang('');
                }
              }}
              aria-label="Target language"
            >
              {presetLangs.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
              <option value="custom">Custom…</option>
            </select>
            {activeSelectValue === 'custom' && (
              <div className="pt-1 space-y-1">
                <Input
                  id="custom-lang"
                  placeholder="e.g. fr"
                  aria-label="Custom language code"
                  value={customLang}
                  onChange={(e) => { setCustomLang(e.target.value); setLang(e.target.value.trim()); }}
                  aria-invalid={!customLangValid}
                />
                <p className="text-[11px] text-muted-foreground" id="custom-lang-help">
                  2–5 lowercase letters (optionally hyphen). Examples: fr, de, pt-br
                </p>
                {showLangError && (
                  <p className="text-[11px] text-destructive" role="alert">Invalid code format.</p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <select
              id="voice"
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              value={voice}
              onChange={(e)=> setVoice(e.target.value)}
              aria-label="Voice selection"
            >
              {voicesLoading && <option value="" disabled>Loading voices…</option>}
              {!voicesLoading && voices.length === 0 && <option value="" disabled>No voices</option>}
              {!voicesLoading && voices.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button type="submit" disabled={!canSubmit || showUrlError || showLangError || (inFlightKey !== null && status==='loading')} aria-disabled={!canSubmit || showUrlError || showLangError || (inFlightKey !== null && status==='loading')}>
              {status === 'loading' && (
                <>
                  <Spinner className="mr-2" size={16} />
                  Processing…
                </>
              )}
              {status !== 'loading' && 'Process'}
            </Button>
            {status === 'loading' && (
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            {status === 'error' && lastRequestRef.current && (
              <Button type="button" variant="outline" onClick={handleRetryLast}>
                Retry Last
              </Button>
            )}
          </div>
        </fieldset>
      </form>
    {error && (
        <div className="mt-4">
          <Alert
            variant="destructive"
            title="Submission failed"
            actions={[
              {
                label: 'Retry',
                variant: 'secondary',
        onClick: () => { setStatus('idle'); setError(null); }
              },
              {
                label: 'Try Again',
                variant: 'outline',
                onClick: () => { reset(); }
              }
            ]}
          >
            {String(error)}
      {error === 'Cancelled' && <p className="mt-1 text-[11px] text-muted-foreground">Request aborted locally (no server work may have completed).</p>}
      {status === 'error' && lastRequestRef.current && <p className="mt-1 text-[11px] text-muted-foreground">Retry re-runs full pipeline; granular phase-only retry not supported.</p>}
          </Alert>
        </div>
      )}
      {status === 'loading' && (
        <div className="mt-4" aria-label="Processing progress">
          <div className="h-2 w-full rounded bg-muted overflow-hidden relative">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Processing…</p>
        </div>
      )}
  {status === 'done' && audioSrc && (
        <div className="mt-6 space-y-3" aria-label="Result audio section">
          <div className="flex items-center gap-2">
            <audio src={audioSrc} controls className="w-full" aria-label="Generated audio" />
            {resultId && (
              <a
                href={`/api/result/${resultId}/audio`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline text-muted-foreground hover:text-primary whitespace-nowrap"
                aria-label="Open audio in new tab"
              >
                Open
              </a>
            )}
          </div>
          {cacheHit && (
            <div>
              <Badge variant="outline" aria-label="Served from cache">Served from cache</Badge>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground tabular-nums" aria-label="Identifiers">runId: <span className="font-mono">{runId || '—'}</span>{resultId && <> · resultId: <span className="font-mono">{resultId}</span></>}{cacheHit && ' · cacheHit'}</p>
          <div className="text-[11px] text-muted-foreground tabular-nums flex flex-wrap gap-x-3 gap-y-1" aria-label="Retries breakdown">
            <span>Retries:</span>
            <span title="Portia scrape retries" className={retries.portia ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>Portia <span className="font-mono">{retries.portia}</span></span>
            <span title="Translation retries" className={retries.translation ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>Translation <span className="font-mono">{retries.translation}</span></span>
            <span title="TTS retries" className={retries.tts ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>TTS <span className="font-mono">{retries.tts}</span></span>
            <span
              role="button"
              tabIndex={0}
              aria-label="Show raw response headers JSON"
              className="cursor-help underline decoration-dotted"
              title={(() => {
                try { return JSON.stringify(headers, null, 2); } catch { return 'headers unavailable'; }
              })()}
            >headers</span>
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums" aria-label="Total processing time">time: <span className="font-mono">{totalMs}ms</span> (<span className="font-mono">{(totalMs/1000).toFixed(2)}s</span>)</p>
          {resultMeta && typeof ttlMs === 'number' && (
            <p className="text-[11px] text-muted-foreground tabular-nums" aria-label="TTL remaining">
              ttl: <span className="font-mono">{Math.ceil(ttlMs/1000)}s</span>{' '}
              <span className="opacity-70">({(ttlMs/1000).toFixed(1)}s)</span>
            </p>
          )}
          <p className="text-[11px] text-muted-foreground tabular-nums" aria-label="Character counts">chars: translation <span className="font-mono">{translationChars}</span>{summaryChars ? <> · summary <span className="font-mono">{summaryChars}</span></> : null}</p>
          {/* Progress / duration representation */}
          {phases?.length > 0 && totalMs > 0 && (
            <div className="space-y-1" aria-label="Total processing duration">
              <div className="h-2 w-full rounded bg-muted overflow-hidden flex">
                {phases.filter(p=>typeof p.ms==='number').map((p) => {
                  const pct = Math.max(2, Math.round((p.ms / totalMs) * 100));
                  const color = p.name === 'scrape' ? 'bg-blue-500' : p.name === 'summary' ? 'bg-indigo-500' : p.name === 'translate' ? 'bg-amber-500' : p.name === 'tts' ? 'bg-emerald-500' : 'bg-primary';
                  return <div key={p.name} className={`${color} h-full`} style={{ width: pct + '%' }} title={`${p.name} ${p.ms}ms`} />;
                })}
              </div>
              <p className="text-[11px] text-muted-foreground tabular-nums">Total {totalMs}ms</p>
            </div>
          )}
      {summary && (
            <div className="border rounded-md p-3 bg-muted/30 space-y-2" aria-label="Summary text">
      <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-medium">Summary</h2>
                {partial && <Badge variant="secondary">Partial</Badge>}
    {cacheHit && <Badge variant="outline">Cache Hit</Badge>}
        {ttsProvider === 'fallback' && <Badge variant="destructive">Fallback TTS</Badge>}
              </div>
              <p className="text-sm leading-snug whitespace-pre-line">
                {summary}
              </p>
            </div>
          )}
          {phases?.length > 0 && (
            <div className="border rounded-md p-3 bg-muted/30">
              <h2 className="text-sm font-medium mb-2">Phases</h2>
              <ul className="space-y-1 text-xs">
                {phases.map((p) => (
                  <li key={p.name} className="flex items-center justify-between">
                    <span className="font-mono">{p.name}</span>
                    <span className="flex items-center gap-2">
                      <span
                        className={
                          p.status === 'success'
                            ? 'text-green-600 dark:text-green-400'
                            : p.status === 'error'
                              ? 'text-destructive'
                              : 'text-amber-600'
                        }
                      >
                        {p.status}
                      </span>
                      {typeof p.ms === 'number' && <span className="tabular-nums text-muted-foreground">{p.ms}ms</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!audioSrc) return;
                const a = document.createElement('a');
                a.href = audioSrc;
                a.download = `setu_${lang}.mp3`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
            >
              Download
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!audioSrc) return;
                try {
                  await navigator.clipboard.writeText(audioSrc);
                } catch {
                  // fallback: create temporary input
                  const tmp = document.createElement('input');
                  tmp.value = audioSrc;
                  document.body.appendChild(tmp);
                  tmp.select();
                  document.execCommand('copy');
                  tmp.remove();
                }
              }}
              aria-label="Copy audio link to clipboard"
            >
              Copy Link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const debug = {
                  runId,
                  resultId,
                  url,
                  lang,
                  voice,
                  partial,
                  cacheHit,
                  ttsProvider,
                  totalMs,
                  retries,
                  translationChars,
                  summaryChars,
                  phases,
                  headers,
                  resultMeta,
                  summary,
                };
                const text = JSON.stringify(debug, null, 2);
                try { await navigator.clipboard.writeText(text); } catch {
                  const tmp = document.createElement('textarea');
                  tmp.value = text; document.body.appendChild(tmp); tmp.select(); document.execCommand('copy'); tmp.remove();
                }
              }}
              aria-label="Copy debug JSON"
            >
              Copy Debug JSON
            </Button>
            <Button type="button" variant="secondary" onClick={reset} size="sm">Translate Another</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
