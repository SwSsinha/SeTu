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
  const [ttsProvider, setTtsProvider] = useState(null);
  const [totalMs, setTotalMs] = useState(0);
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
  setTtsProvider(null);
  setTotalMs(0);
    setError(null);
  }, [audioSrc]);

  return {
    // state
  url, lang, status, audioSrc, audioBlob, phases, summary, resultId, runId, partial, ttsProvider, totalMs, error,
    // setters
  setUrl, setLang, setStatus, setAudioSrc, setAudioBlob, setPhases, setSummary, setResultId, setRunId, setPartial, setTtsProvider, setTotalMs, setError,
    // helpers
    reset,
  };
}
