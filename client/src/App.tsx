import { useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function App() {
  // Core state hooks
  const [url, setUrl] = useState<string>('')
  const [lang, setLang] = useState<string>('hi')
  const [status, setStatus] = useState<Status>('idle')
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      // Placeholder success handling; detailed wiring (resultId, audio, timeline) comes in later steps
      if (response.status === 200) {
        setStatus('success')
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
        <Card>
          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="url">Article URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang">Target Language</Label>
              <Input
                id="lang"
                placeholder="e.g. en, es, fr"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              />
            </div>
            <div className="pt-2">
              <Button className="w-full" onClick={handleSubmit}>
                {status === 'loading' ? 'Processing…' : 'Process'}
              </Button>
            </div>
          </form>
        </Card>
      </section>
      <footer className="mt-auto pb-4 text-xs text-slate-600">Backend ready • Frontend shell in progress</footer>
    </main>
  )
}
