import Layout from './components/layout/Layout';
import { Card } from './components/ui/card';
import { Label } from './components/ui/label';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';

// App with base layout shell (Step 1.2) – static placeholders only.
export default function App() {
  return (
    <Layout>
      <div className="space-y-6">
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
      </div>
    </Layout>
  );
}
