import Layout from './components/layout/Layout';
import { ThemeProvider } from './context/ThemeProvider';
import SingleProcessForm from './components/process/SingleProcessForm';
import { MultiLangForm } from './components/batch/MultiLangForm';
import { BundleForm } from './components/batch/BundleForm';
import { HistoryList } from './components/history/HistoryList';
import { useSingleProcessState } from './hooks/useSingleProcessState';
import { useEffect, useState } from 'react';

// App with base layout shell (Step 1.2) – static placeholders only.
export default function App() {
  // Provide a top-level instance of the hook so history list can access combined state
  const state = useSingleProcessState();
  const [mode, setMode] = useState('single'); // single | multi | bundle (Step 10.1)
  // History selection -> repopulate form fields (Module 8 step 8.4)
  function handleHistorySelect(entry) {
    if (!entry) return;
    const { url, lang, voice } = entry;
    if (url) state.setUrl(url);
    if (lang) state.setLang(lang);
    if (voice) {
      // Ensure voice exists in list so the select shows it
      if (state.voices && !state.voices.includes(voice)) {
        state.setVoices(prev => (prev && prev.includes(voice)) ? prev : [...(prev||[]), voice]);
      }
      state.setVoice(voice);
    }
    // Clear prior result/output specific state but keep inputs & preferences
    state.setStatus('idle');
    state.setAudioSrc(null); state.setAudioBlob(null);
    state.setPhases([]); state.setSummary(''); state.setResultId(null); state.setRunId(null);
    state.setPartial(false); state.setCacheHit(false); state.setTtsProvider(null);
    state.setTotalMs(0); state.setRetries({ portia: 0, translation: 0, tts: 0 });
    state.setHeaders({}); state.setTranslationChars(0); state.setSummaryChars(0);
    state.setError(null);
    // If we have a cached result id, pull audio directly (step 8.5)
    if (entry.resultId) {
      state.setStatus('loading');
      (async () => {
        try {
          const { blob, objectUrl } = await import('./lib/apiClient').then(m => m.apiClient.fetchResultAudio(entry.resultId));
          if (objectUrl) state.setAudioSrc(objectUrl);
          if (blob) state.setAudioBlob(blob);
          state.setResultId(entry.resultId);
          if (entry.runId) state.setRunId(entry.runId);
          state.setCacheHit(entry.cacheHit || false);
          if (typeof entry.durationMs === 'number') state.setTotalMs(entry.durationMs);
          state.setStatus('done');
        } catch (e) {
          state.setError(e.message || 'Audio load failed');
          state.setStatus('error');
        }
      })();
    }
    // Focus URL input for quick resubmission
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        const el = document.getElementById('url');
        if (el) el.focus();
      });
    }
  }
  // Step 12.5: Deep link parsing (#share=...) – switch to bundle mode
  useEffect(() => {
    function parseFragment() {
      const hash = window.location.hash || '';
      const m = hash.match(/#share=([^&]+)/);
      if (m && m[1]) {
        try {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
          if (decoded && decoded.type === 'bundlePodcast') {
            setMode('bundle');
            // (Optional) could set some prefill state via context or localStorage
            try { localStorage.setItem('setu.lastShare', JSON.stringify(decoded)); } catch {}
          }
        } catch {}
      }
    }
    parseFragment();
    window.addEventListener('hashchange', parseFragment);
    return () => window.removeEventListener('hashchange', parseFragment);
  }, []);

  return (
    <ThemeProvider>
      <Layout>
        <div className="grid gap-8 md:grid-cols-[1fr_300px] items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Mode:</span>
              <div className="inline-flex rounded-md border overflow-hidden">
                {[
                  { key: 'single', label: 'Single' },
                  { key: 'multi', label: 'Multi-Lang' },
                  { key: 'bundle', label: 'Bundle' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMode(opt.key)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode===opt.key ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'} ${opt.key !== 'bundle' ? 'border-r' : ''}`}
                    aria-pressed={mode===opt.key}
                    aria-label={`Switch to ${opt.label} mode`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {mode === 'single' && <SingleProcessForm externalState={state} />}
            {mode === 'multi' && (
              <div className="border rounded-md p-6 text-sm text-muted-foreground">
                <p className="mb-2 font-medium">Multi-Language Mode (Coming Soon)</p>
                <MultiLangForm />
              </div>
            )}
            {mode === 'bundle' && (
              <div className="border rounded-md p-6 text-sm text-muted-foreground">
                <p className="mb-2 font-medium">Bundle Mode (Coming Soon)</p>
                <BundleForm />
              </div>
            )}
          </div>
          <div className="space-y-6">
            <HistoryList history={state.history} setHistory={state.setHistory} setHistoryMap={state.setHistoryMap} onSelect={handleHistorySelect} />
          </div>
        </div>
      </Layout>
    </ThemeProvider>
  );
}
