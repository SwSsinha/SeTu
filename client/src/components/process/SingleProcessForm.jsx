import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

// Static single process form (Step 1.3) – only structure, no logic yet.
export default function SingleProcessForm() {
  return (
    <Card className="p-6 space-y-4" role="region" aria-labelledby="single-process-heading">
      <div>
        <h1 id="single-process-heading" className="text-2xl font-bold tracking-tight">Single Process</h1>
        <p className="text-sm text-muted-foreground">Enter a URL to generate summary, translation & audio.</p>
      </div>
      <form className="space-y-5" aria-describedby="single-process-desc" onSubmit={(e) => e.preventDefault()} noValidate>
        <p id="single-process-desc" className="sr-only">Provide source URL and select target language to process content.</p>
        <fieldset className="space-y-5" disabled>
          <legend className="sr-only">Processing inputs</legend>
          <div className="space-y-2">
            <Label htmlFor="url">Source URL</Label>
            <Input id="url" placeholder="https://example.com/article" aria-required="true" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              defaultValue="en"
              aria-label="Target language"
            >
              <option value="en">English</option>
              <option value="hi">Hindi (hi)</option>
              <option value="bn">Bengali (bn)</option>
              <option value="es">Spanish (es)</option>
            </select>
          </div>
          <div>
            <Button type="submit" disabled aria-disabled="true">Process</Button>
          </div>
        </fieldset>
      </form>
    </Card>
  );
}
