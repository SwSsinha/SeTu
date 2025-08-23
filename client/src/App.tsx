import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

type Status = 'idle' | 'loading' | 'success' | 'error'

// Step 5.1: Basic History item shape (can evolve in later steps)
interface HistoryItem {
  id: string
  url: string
  targetLang: string
  createdAt: string
  status: Status
  audioUrl?: string
}

export default function App() {
  // Core state hooks
  const [url, setUrl] = useState<string>('')
  const [lang, setLang] = useState<string>('hi')
  const [status, setStatus] = useState<Status>('idle')
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState<number | null>(null)
  const [resultId, setResultId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Step 5.1: History state (hydrated from localStorage on mount)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('setu_history')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setHistory(parsed as HistoryItem[])
        }
      }
    } catch (e) {
      // Silent fail; we'll rebuild history progressively.
      console.warn('Failed to load history from localStorage', e)
    }
  }, [])

  // Load audio duration metadata when audioSrc changes
  useEffect(() => {
    if (!audioSrc) return
    const el = document.createElement('audio')
    const onLoaded = () => {
      if (isFinite(el.duration)) setAudioDuration(el.duration)
    }
    el.addEventListener('loadedmetadata', onLoaded)
    el.src = audioSrc + (audioSrc.includes('?') ? '&' : '?') + 't=' + Date.now()
    return () => el.removeEventListener('loadedmetadata', onLoaded)
  }, [audioSrc])

  // Step 2.3: API call handler (POST /api/process)
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!url.trim()) return
    setStatus('loading')
    setError(null)
    try {
      const response = await axios.post('/api/process', {
        url,
        targetLang: lang,
      })
      // Audio integration with backend resultId
      if (response.status === 200) {
        const { resultId: rid, audioUrl } = response.data || {}
        setResultId(rid || null)
        const resolvedAudio = audioUrl || (rid ? `/api/results/${rid}/audio` : null)
        setAudioSrc(resolvedAudio)
        setStatus('success')
        const newItem: HistoryItem = {
          id: (rid || Date.now()).toString(),
          url,
          targetLang: lang,
          createdAt: new Date().toISOString(),
          status: 'success',
          audioUrl: resolvedAudio || undefined,
        }
        setHistory((prev) => {
          const next = [...prev, newItem]
          try { localStorage.setItem('setu_history', JSON.stringify(next)) } catch {}
          return next
        })
      } else {
        setStatus('error')
        setError('Unexpected response')
      }
    } catch (err: any) {
      setStatus('error')
      setError(err?.response?.data?.error || err.message || 'Request failed')
    }
  }

  return (
    <main className="min-h-screen w-full bg-ink-900 text-slate-100 flex flex-col items-center p-8 gap-8">
      <header className="w-full max-w-5xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">SeTu</h1>
        <div className="text-xs text-slate-500">Module 1 · Static UI Shell</div>
      </header>
  <section className="w-full flex flex-col items-center gap-8">
        {status !== 'success' && (
          <Card>
            <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="url">Article URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang">Target Language</Label>
              <Input
                id="lang"
                placeholder="e.g. en, es, fr"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>
            <div className="pt-2">
              <Button className="w-full flex items-center justify-center gap-2" onClick={handleSubmit} disabled={status === 'loading' || !url.trim()}>
                {status === 'loading' && (
                  <span className="inline-block h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                )}
                {status === 'loading' ? 'Processing…' : 'Process'}
              </Button>
            </div>
            {status === 'loading' && (
              <Alert className="mt-4">
                <div className="flex flex-col">
                  <AlertTitle>Processing</AlertTitle>
                  <AlertDescription>Scraping, translating & generating audio…</AlertDescription>
                </div>
              </Alert>
            )}
              {status === 'error' && (
                <Alert variant="destructive" className="mt-4 flex flex-col gap-1">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error || 'Something went wrong.'}</AlertDescription>
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        setStatus('idle')
                        setError(null)
                      }}
                      className="h-8 text-xs"
                    >
                      Try Again
                    </Button>
                  </div>
                </Alert>
              )}
              {/* Step 4.1: Example buttons (static, no logic yet) */}
              <div className="pt-4 flex flex-wrap gap-2 text-xs">
                <Button
                  variant="outline"
                  className="h-8"
                  onClick={(e) => {
                    e.preventDefault()
                    setUrl('https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules')
                  }}
                >
                  Example: Tech Blog
                </Button>
                <Button
                  variant="outline"
                  className="h-8"
                  onClick={(e) => {
                    e.preventDefault()
                    setUrl('https://en.wikipedia.org/wiki/Artificial_intelligence')
                  }}
                >
                  Example: News Article
                </Button>
                <Button
                  variant="outline"
                  className="h-8"
                  onClick={(e) => {
                    e.preventDefault()
                    setUrl('https://arxiv.org/abs/1706.03762')
                  }}
                >
                  Example: Research Post
                </Button>
              </div>
            </form>
          </Card>
        )}
        {status === 'success' && (
          <Card className="space-y-4 w-full max-w-xl">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Success</h2>
              <p className="text-xs text-slate-400">Your article was processed. {audioDuration && (
                <span className="text-slate-300">Audio {Math.round(audioDuration)}s</span>
              )} {resultId && (
                <span className="text-slate-500">• ID {resultId}</span>
              )}</p>
            </div>
            <div>
              {audioSrc ? (
                <audio controls src={audioSrc} className="w-full" />
              ) : (
                <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded p-3 text-center">
                  Audio not yet attached (will be wired in a later step).
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={!audioSrc}
                onClick={(e) => {
                  e.preventDefault()
                  if (!audioSrc) return
                  const a = document.createElement('a')
                  a.href = audioSrc
                  a.download = 'setu-audio.mp3'
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                }}
              >
                Download
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={!audioSrc}
                onClick={(e) => {
                  e.preventDefault()
                  if (!audioSrc) return
                  const text = `Listen to this translated audio from SeTu: ${audioSrc}`
                  const encoded = encodeURIComponent(text)
                  // Try whatsapp protocol first (mobile), fallback to web API.
                  const waProtocol = `whatsapp://send?text=${encoded}`
                  const waWeb = `https://api.whatsapp.com/send?text=${encoded}`
                  const opened = window.open(waProtocol, '_blank', 'noopener,noreferrer')
                  // Some browsers block / fail protocol handlers on desktop; fallback.
                  setTimeout(() => {
                    if (!opened || opened.closed) {
                      window.open(waWeb, '_blank', 'noopener,noreferrer')
                    }
                  }, 400)
                }}
              >
                Share
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={!audioSrc}
                onClick={async (e) => {
                  e.preventDefault()
                  if (!audioSrc) return
                  try {
                    await navigator.clipboard.writeText(audioSrc)
                  } catch (err) {
                    console.warn('Clipboard copy failed', err)
                  }
                }}
              >
                Copy Link
              </Button>
              <Button
                className="flex-1"
                onClick={(e) => {
                  e.preventDefault()
                  setStatus('idle')
                  setUrl('')
                  setAudioSrc(null)
                  setError(null)
                }}
              >
                Translate Another
              </Button>
            </div>
          </Card>
        )}
        {/* Step 5.3: History List Section */}
        <div className="w-full max-w-5xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-400">History</h3>
            {history.length > 0 && (
              <div className="text-[10px] text-slate-500">{history.length} item{history.length === 1 ? '' : 's'}</div>
            )}
          </div>
          {history.length === 0 && (
            <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded p-4 text-center">No history yet. Process something to see it here.</div>
          )}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => {
              let derivedTitle = 'Article'
              try {
                const u = new URL(item.url)
                const last = u.pathname.split('/').filter(Boolean).pop()
                derivedTitle = last ? decodeURIComponent(last).replace(/[-_]/g, ' ') : u.hostname
              } catch {}
              const title = (item as any).title || derivedTitle
              const disabled = !item.audioUrl
              return (
                <Card key={item.id} className="p-4 flex flex-col gap-2 bg-slate-900/50">
                  <div className="space-y-1 min-h-[48px]">
                    <div className="text-sm font-medium line-clamp-2 break-words">{title}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 flex gap-2">
                      <span>{item.targetLang}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => {
                        e.preventDefault()
                        if (!item.audioUrl) return
                        const audio = new Audio(item.audioUrl)
                        audio.play().catch(() => {})
                      }}
                    >
                      Listen
                    </Button>
                    <Button
                      size="sm"
                      disabled={disabled}
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => {
                        e.preventDefault()
                        if (!item.audioUrl) return
                        const a = document.createElement('a')
                        a.href = item.audioUrl
                        a.download = 'setu-audio.mp3'
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }}
                    >
                      Download
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
      <footer className="mt-auto pb-4 text-xs text-slate-600">Backend ready • Frontend shell in progress</footer>
    </main> 
  )
}
