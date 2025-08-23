import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSingleProcessState } from '../../hooks/useSingleProcessState';
import { apiClient } from '../../lib/apiClient';

// Static single process form (Step 1.3) – only structure, no logic yet.
export default function SingleProcessForm() {
  const {
    url, lang, status, audioSrc, error,
    setUrl, setLang, setStatus, setAudioSrc, setError,
  } = useSingleProcessState();

  const disabled = status === 'loading';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url || disabled) return;
    setError(null);
    setAudioSrc(null);
  setStatus('loading');
    try {
      const { objectUrl } = await apiClient.postProcess({ url, lang });
      setAudioSrc(objectUrl);
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
            <Button type="submit" disabled={disabled || !url} aria-disabled={disabled || !url}>
              {status === 'loading' ? 'Processing...' : 'Process'}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">{String(error)}</p>
          )}
          {audioSrc && (
            <div className="pt-2">
              <audio src={audioSrc} controls className="w-full" />
            </div>
          )}
        </fieldset>
      </form>
    </Card>
  );
}
