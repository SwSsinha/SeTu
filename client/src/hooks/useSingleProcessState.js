// Hook: manages core single-process form state (Module 2 step 2.1)
import { useState, useCallback } from 'react';

export const INITIAL_STATUS = 'idle'; // idle | running | done | error

export function useSingleProcessState() {
  const [url, setUrl] = useState('');
  const [lang, setLang] = useState('en');
  const [status, setStatus] = useState(INITIAL_STATUS);
  const [audioSrc, setAudioSrc] = useState(null); // object URL or remote URL
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setUrl('');
    setLang('en');
    setStatus(INITIAL_STATUS);
    setAudioSrc(null);
    setError(null);
  }, []);

  return {
    // state
    url, lang, status, audioSrc, error,
    // setters
    setUrl, setLang, setStatus, setAudioSrc, setError,
    // helpers
    reset,
  };
}
