// Manages submission + high level status (stub)
import { useState } from 'react'
import type { Status, ProcessResult } from '@/types'
import { processArticle, fetchResultMeta } from '@/services/api'

export function useProcess(initialLang = 'hi') {
  const [url, setUrl] = useState('')
  const [lang, setLang] = useState(initialLang)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [resultId, setResultId] = useState<string | null>(null)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessResult | null>(null)

  async function submit() {
    if (!url.trim()) return
    setStatus('loading'); setError(null)
    try {
      const r = await processArticle({ url, targetLang: lang })
      setResultId(r.resultId || null)
      setAudioSrc(r.audioUrl || (r.resultId ? `/api/result/${r.resultId}/audio` : null))
      // If only preview summary, attempt full summary fetch
      if (r.resultId) {
        const meta = await fetchResultMeta(r.resultId)
        setResult({ ...r, ...meta })
      } else {
        setResult(r)
      }
      setStatus('success')
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Request failed')
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle'); setError(null); setResultId(null); setAudioSrc(null); setResult(null)
  }

  return { url, setUrl, lang, setLang, status, error, resultId, audioSrc, result, submit, reset }
}
