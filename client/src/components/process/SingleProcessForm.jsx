import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSingleProcessState } from '../../hooks/useSingleProcessState';
import { apiClient } from '../../lib/apiClient';
import { Spinner } from '../shared/Spinner';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useEffect, useState } from 'react';

// Static single process form (Step 1.3) – only structure, no logic yet.
export default function SingleProcessForm({ externalState }) {
  const state = externalState || useSingleProcessState();
  const {
    url, lang, status, audioSrc, audioBlob, phases, summary, resultId, runId, partial, cacheHit, ttsProvider, totalMs, retries, headers, translationChars, summaryChars, voices, voicesLoading, voice, inFlightKey, historyMap, error,
    setUrl, setLang, setStatus, setAudioSrc, setAudioBlob, setPhases, setSummary, setResultId, setRunId, setPartial, setCacheHit, setTtsProvider, setTotalMs, setRetries, setHeaders, setTranslationChars, setSummaryChars, setVoices, setVoicesLoading, setVoice, setInFlightKey, setHistoryMap, setError, reset,
  } = state;

  const disabled = status === 'loading';
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
    setError(null);
    setAudioSrc(null);
  setStatus('loading');
    try {
      // Timeline endpoint – includes phases, summary, totalMs (Step 4.6 adds totalMs usage)
  const effectiveLang = isCustomLang ? customLangTrimmed : lang;
  const { objectUrl, blob, phases: ph, summary: sum, resultId: rid, runId: rrun, partial: part, cacheHit: cHit, totalMs: tot, retries: rtries, headers: hdrs, translationChars: tChars, summaryChars: sChars, json } = await apiClient.postProcessTimeline({ url: urlTrimmed, lang: effectiveLang, voice });
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
      // Record history entry
      try {
        const now = Date.now();
        const next = { ...historyMap, [key]: { ts: now } };
        setHistoryMap(next);
        localStorage.setItem('setu.history', JSON.stringify(next));
        // Extended local history entries for server merge (step 8.2)
        const entry = {
          runId: rrun || null,
          resultId: rid || null,
          url: urlTrimmed,
          lang: effectiveLang,
          voice: voice || null,
          partial: !!part,
          cacheHit: !!cHit,
          durationMs: tot || 0,
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
      setError(err.message || 'Failed');
      setStatus('error');
    } finally {
      setInFlightKey(null);
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
          <div>
            <Button type="submit" disabled={!canSubmit || showUrlError || showLangError || (inFlightKey !== null && status==='loading')} aria-disabled={!canSubmit || showUrlError || showLangError || (inFlightKey !== null && status==='loading')}>
              {status === 'loading' && (
                <>
                  <Spinner className="mr-2" size={16} />
                  Processing…
                </>
              )}
              {status !== 'loading' && 'Process'}
            </Button>
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
          <audio src={audioSrc} controls className="w-full" aria-label="Generated audio" />
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
            <Button type="button" variant="secondary" onClick={reset} size="sm">Translate Another</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
