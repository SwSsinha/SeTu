// Hook: manages core single-process form state (Module 2 step 2.1)
import { useState, useCallback } from 'react';

export const INITIAL_STATUS = 'idle'; // idle | loading | done | error

export function useSingleProcessState() {
  const [url, setUrl] = useState('');
  const [lang, setLang] = useState('en');
  const [status, setStatus] = useState(INITIAL_STATUS);
  const [audioSrc, setAudioSrc] = useState(null); // object URL or remote URL
  const [audioBlob, setAudioBlob] = useState(null);
  const [phases, setPhases] = useState([]); // timeline phases from /timeline endpoint
  const [summary, setSummary] = useState('');
  const [resultId, setResultId] = useState(null);
  const [runId, setRunId] = useState(null);
  const [partial, setPartial] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  const [ttsProvider, setTtsProvider] = useState(null);
  const [totalMs, setTotalMs] = useState(0);
  const [retries, setRetries] = useState({ portia: 0, translation: 0, tts: 0 });
  const [headers, setHeaders] = useState({});
  const [translationChars, setTranslationChars] = useState(0);
  const [summaryChars, setSummaryChars] = useState(0);
  const [voices, setVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voice, setVoice] = useState('');
  const [inFlightKey, setInFlightKey] = useState(null);
  const [historyMap, setHistoryMap] = useState({}); // key -> { ts }
  const [history, setHistory] = useState([]); // server+local merged history entries (later steps)
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    if (audioSrc) {
      try { URL.revokeObjectURL(audioSrc); } catch {}
    }
    setUrl('');
    setLang('en');
    setStatus(INITIAL_STATUS);
    setAudioSrc(null);
    setAudioBlob(null);
  setPhases([]);
  setSummary('');
  setResultId(null);
  setRunId(null);
  setPartial(false);
  setCacheHit(false);
  setTtsProvider(null);
  setTotalMs(0);
  setRetries({ portia: 0, translation: 0, tts: 0 });
  setHeaders({});
  setTranslationChars(0);
  setSummaryChars(0);
  setVoices([]);
  setVoicesLoading(false);
  setVoice('');
  setInFlightKey(null);
  setHistoryMap({});
  setHistory([]);
    setError(null);
  }, [audioSrc]);

  return {
    // state
  url, lang, status, audioSrc, audioBlob, phases, summary, resultId, runId, partial, cacheHit, ttsProvider, totalMs, retries, headers, translationChars, summaryChars, voices, voicesLoading, voice, inFlightKey, historyMap, history, error,
    // setters
  setUrl, setLang, setStatus, setAudioSrc, setAudioBlob, setPhases, setSummary, setResultId, setRunId, setPartial, setCacheHit, setTtsProvider, setTotalMs, setRetries, setHeaders, setTranslationChars, setSummaryChars, setVoices, setVoicesLoading, setVoice, setInFlightKey, setHistoryMap, setHistory, setError,
    // helpers
    reset,
  };
}
