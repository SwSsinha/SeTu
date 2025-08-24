import { useState, useMemo } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

// Step 11.1: multiline URL input (limit 5)
export function BundleForm({ onSubmit }) {
	const [urlsText, setUrlsText] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const MAX = 5;

	const lines = useMemo(() => urlsText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0), [urlsText]);
	const limited = lines.slice(0, MAX);
	const hasOverflow = lines.length > limited.length;
	function isValidUrl(str) {
		try { const u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
	}
	const invalids = limited.filter(l => !isValidUrl(l));
	const canSubmit = limited.length > 0 && invalids.length === 0 && !submitting;

	async function handleSubmit(e) {
		e.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
		try {
			await onSubmit?.({ urls: limited }); // API call implemented next step 11.2
		} finally { setSubmitting(false); }
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit} noValidate>
			<div className="space-y-2">
				<Label htmlFor="bundle-urls">URLs (one per line, up to {MAX})</Label>
				<textarea
					id="bundle-urls"
					className="w-full h-40 border border-border rounded-md bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
					placeholder={`https://example.com/article-1\nhttps://example.com/article-2`}
					value={urlsText}
					onChange={(e)=> setUrlsText(e.target.value)}
					aria-describedby="bundle-urls-help"
				/>
				<p id="bundle-urls-help" className="text-[11px] text-muted-foreground">
					{limited.length}/{MAX} valid lines considered{hasOverflow && ' (extra lines ignored)'}
				</p>
				{invalids.length > 0 && (
					<p className="text-[11px] text-destructive">Invalid URLs: {invalids.join(', ')}</p>
				)}
			</div>
			<div>
				<Button type="submit" disabled={!canSubmit} aria-disabled={!canSubmit}>
					{submitting ? 'Preparing…' : 'Prepare Bundle'}
				</Button>
			</div>
		</form>
	);
}
