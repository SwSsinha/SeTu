import { useState, useMemo } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { apiClient } from '../../lib/apiClient';

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

		const [bundleResp, setBundleResp] = useState(null);
		const [bundleError, setBundleError] = useState(null);
		const [lang, setLang] = useState('hi');
		const [voice, setVoice] = useState(''); // optional entry (left blank for now – enhancement later)

		async function handleSubmit(e) {
		e.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
			setBundleResp(null); setBundleError(null);
		try {
				const resp = await apiClient.postProcessBundle({ urls: limited, lang, voice: voice || undefined });
				setBundleResp(resp);
				await onSubmit?.({ urls: limited, response: resp });
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
					{bundleError && <p className="text-[11px] text-destructive">{bundleError}</p>}
					{bundleResp && (
						<div className="mt-4 text-[11px] space-y-1">
							<p>runId: <span className="font-mono">{bundleResp.runId || '—'}</span> resultId: <span className="font-mono">{bundleResp.resultId || '—'}</span>{bundleResp.cacheHit && ' (cache)'}{bundleResp.partial && ' (partial)'}</p>
							<p>bundle: count={bundleResp.bundle?.count} failed={Array.isArray(bundleResp.bundle?.failed) ? bundleResp.bundle.failed.length : 0}</p>
						</div>
					)}
		</form>
	);
}
