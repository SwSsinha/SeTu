import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSingleProcessState } from '../../hooks/useSingleProcessState';
import { apiClient } from '../../lib/apiClient';
import { Spinner } from '../shared/Spinner';
import { Alert } from '../ui/alert';

// Static single process form (Step 1.3) – only structure, no logic yet.
export default function SingleProcessForm() {
  const {
    url, lang, status, audioSrc, audioBlob, phases, summary, resultId, partial, error,
    setUrl, setLang, setStatus, setAudioSrc, setAudioBlob, setPhases, setSummary, setResultId, setPartial, setError, reset,
  } = useSingleProcessState();

  const disabled = status === 'loading';
  const urlTrimmed = url.trim();
  const canSubmit = !disabled && urlTrimmed.length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (disabled) return;
    if (!urlTrimmed) {
      setError('URL is required');
      setStatus('error');
      return;
    }
    setError(null);
    setAudioSrc(null);
  setStatus('loading');
    try {
  // Switch to timeline endpoint (Step 4.1)
  const { objectUrl, blob, phases: ph, summary: sum, resultId: rid, partial: part } = await apiClient.postProcessTimeline({ url: urlTrimmed, lang });
  if (objectUrl) setAudioSrc(objectUrl);
  if (blob) setAudioBlob(blob);
  setPhases(ph);
  setSummary(sum);
  setResultId(rid);
  setPartial(part);
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Failed');
      setStatus('error');
    }
  }

  return (
    <Card className="p-6 space-y-4" role="region" aria-labelledby="single-process-heading">
      <div>
        <h1 id="single-process-heading" className="text-2xl font-bold tracking-tight">Single Process</h1>
        <p className="text-sm text-muted-foreground">Enter a URL to generate summary, translation & audio.</p>
      </div>
  <form className="space-y-5" aria-describedby="single-process-desc" onSubmit={handleSubmit} noValidate>
        <p id="single-process-desc" className="sr-only">Provide source URL and select target language to process content.</p>
        <fieldset className="space-y-5" disabled={disabled} aria-busy={disabled} aria-live="polite">
          <legend className="sr-only">Processing inputs</legend>
          <div className="space-y-2">
            <Label htmlFor="url">Source URL</Label>
            <Input id="url" placeholder="https://example.com/article" aria-required="true" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Target language"
            >
              <option value="en">English</option>
              <option value="hi">Hindi (hi)</option>
              <option value="bn">Bengali (bn)</option>
              <option value="es">Spanish (es)</option>
            </select>
          </div>
          <div>
            <Button type="submit" disabled={!canSubmit} aria-disabled={!canSubmit}>
              {status === 'loading' && (
                <>
                  <Spinner className="mr-2" size={16} />
                  Processing…
                </>
              )}
              {status !== 'loading' && 'Process'}
            </Button>
          </div>
        </fieldset>
      </form>
      {error && (
        <div className="mt-4">
          <Alert
            variant="destructive"
            title="Submission failed"
            actions={[
              {
                label: 'Retry',
                variant: 'secondary',
                onClick: () => { setStatus('idle'); setError(null); }
              },
              {
                label: 'Try Again',
                variant: 'outline',
                onClick: () => { reset(); }
              }
            ]}
          >
            {String(error)}
          </Alert>
        </div>
      )}
      {status === 'done' && audioSrc && (
        <div className="mt-6 space-y-3" aria-label="Result audio section">
          <audio src={audioSrc} controls className="w-full" aria-label="Generated audio" />
          {summary && (
            <div className="border rounded-md p-3 bg-muted/30" aria-label="Summary text">
              <h2 className="text-sm font-medium mb-2">Summary</h2>
              <p className="text-sm leading-snug whitespace-pre-line">
                {summary}
              </p>
            </div>
          )}
          {phases?.length > 0 && (
            <div className="border rounded-md p-3 bg-muted/30">
              <h2 className="text-sm font-medium mb-2">Phases</h2>
              <ul className="space-y-1 text-xs">
                {phases.map((p) => (
                  <li key={p.name} className="flex items-center justify-between">
                    <span className="font-mono">{p.name}</span>
                    <span className="flex items-center gap-2">
                      <span
                        className={
                          p.status === 'success'
                            ? 'text-green-600 dark:text-green-400'
                            : p.status === 'error'
                              ? 'text-destructive'
                              : 'text-amber-600'
                        }
                      >
                        {p.status}
                      </span>
                      {typeof p.ms === 'number' && <span className="tabular-nums text-muted-foreground">{p.ms}ms</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!audioSrc) return;
                const a = document.createElement('a');
                a.href = audioSrc;
                a.download = `setu_${lang}.mp3`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
            >
              Download
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!audioSrc) return;
                try {
                  await navigator.clipboard.writeText(audioSrc);
                } catch {
                  // fallback: create temporary input
                  const tmp = document.createElement('input');
                  tmp.value = audioSrc;
                  document.body.appendChild(tmp);
                  tmp.select();
                  document.execCommand('copy');
                  tmp.remove();
                }
              }}
              aria-label="Copy audio link to clipboard"
            >
              Copy Link
            </Button>
            <Button type="button" variant="secondary" onClick={reset} size="sm">Translate Another</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
