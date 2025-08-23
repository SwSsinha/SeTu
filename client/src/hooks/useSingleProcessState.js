// Hook: manages core single-process form state (Module 2 step 2.1)
import { useState, useCallback } from 'react';

export const INITIAL_STATUS = 'idle'; // idle | loading | done | error

export function useSingleProcessState() {
  const [url, setUrl] = useState('');
  const [lang, setLang] = useState('en');
  const [status, setStatus] = useState(INITIAL_STATUS);
  const [audioSrc, setAudioSrc] = useState(null); // object URL or remote URL
  const [audioBlob, setAudioBlob] = useState(null);
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
    setError(null);
  }, [audioSrc]);

  return {
    // state
  url, lang, status, audioSrc, audioBlob, error,
    // setters
  setUrl, setLang, setStatus, setAudioSrc, setAudioBlob, setError,
    // helpers
    reset,
  };
}
