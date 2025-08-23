import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import type { Status } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Props {
  url: string
  lang: string
  status: Status
  setUrl: (v: string) => void
  setLang: (v: string) => void
  onSubmit: () => void
  error?: string | null
  resetError: () => void
}

export function ProcessForm({ url, lang, status, setUrl, setLang, onSubmit, error, resetError }: Props) {
  return (
    <Card>
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
        <div className="space-y-2">
          <Label htmlFor="url">Article URL</Label>
          <Input id="url" placeholder="https://example.com/article" value={url} onChange={e => setUrl(e.target.value)} disabled={status==='loading'} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lang">Target Language</Label>
          <Input id="lang" placeholder="e.g. en, es, fr" value={lang} onChange={e => setLang(e.target.value)} disabled={status==='loading'} />
        </div>
        <div className="pt-2">
          <Button className="w-full flex items-center justify-center gap-2" disabled={status==='loading'||!url.trim()} type="submit">
            {status==='loading' && <span className="inline-block h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
            {status==='loading' ? 'Processing…' : 'Process'}
          </Button>
        </div>
        {status==='loading' && (
          <Alert className="mt-4">
            <div className="flex flex-col">
              <AlertTitle>Processing</AlertTitle>
              <AlertDescription>Scraping, translating & generating audio…</AlertDescription>
            </div>
          </Alert>
        )}
        {status==='error' && (
          <Alert variant="destructive" className="mt-4 flex flex-col gap-1">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Something went wrong.'}</AlertDescription>
            <div className="pt-1">
              <Button variant="outline" className="h-8 text-xs" type="button" onClick={resetError}>Try Again</Button>
            </div>
          </Alert>
        )}
        <div className="pt-4 flex flex-wrap gap-2 text-xs">
          <Button variant="outline" className="h-8" type="button" onClick={()=>setUrl('https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules')}>Example: Tech Blog</Button>
          <Button variant="outline" className="h-8" type="button" onClick={()=>setUrl('https://en.wikipedia.org/wiki/Artificial_intelligence')}>Example: News Article</Button>
          <Button variant="outline" className="h-8" type="button" onClick={()=>setUrl('https://arxiv.org/abs/1706.03762')}>Example: Research Post</Button>
        </div>
      </form>
    </Card>
  )
}
