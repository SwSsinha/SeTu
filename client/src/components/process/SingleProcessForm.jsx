import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

// Static single process form (Module 1) – logic & hooks will be wired in later steps.
export default function SingleProcessForm() {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Single Process</h1>
        <p className="text-sm text-muted-foreground">Enter a URL to generate summary, translation & audio.</p>
      </div>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="url">Source URL</Label>
          <Input id="url" placeholder="https://example.com/article" />
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled size="sm">Process (disabled placeholder)</Button>
          <Button type="button" variant="secondary" size="sm" disabled>Reset</Button>
        </div>
      </form>
    </Card>
  );
}
// Will host the primary single URL submission form (Modules 1-4)
export function SingleProcessForm() { return null; }
