import Layout from './components/layout/Layout';
import { ThemeProvider } from './context/ThemeProvider';
import SingleProcessForm from './components/process/SingleProcessForm';
import { HistoryList } from './components/history/HistoryList';
import { useSingleProcessState } from './hooks/useSingleProcessState';

// App with base layout shell (Step 1.2) – static placeholders only.
export default function App() {
  // Provide a top-level instance of the hook so history list can access combined state
  const state = useSingleProcessState();
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
  return (
    <ThemeProvider>
      <Layout>
        <div className="grid gap-8 md:grid-cols-[1fr_300px] items-start">
          <div className="space-y-6">
            <SingleProcessForm externalState={state} />
          </div>
          <div className="space-y-6">
            <HistoryList history={state.history} setHistory={state.setHistory} setHistoryMap={state.setHistoryMap} onSelect={handleHistorySelect} />
          </div>
        </div>
      </Layout>
    </ThemeProvider>
  );
}
