import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Spinner } from '../shared/Spinner';
import { apiClient } from '../../lib/apiClient';

// Step 10.2: UI for multi-language batch (URL + comma-separated langs + voice selector)
export function MultiLangForm({ onSubmit }) {
	const [url, setUrl] = useState('');
	const [langsRaw, setLangsRaw] = useState('hi, es');
	const [langs, setLangs] = useState([]);
	const [voice, setVoice] = useState('');
	const [voices, setVoices] = useState([]);
	const [voicesLoading, setVoicesLoading] = useState(false);
		const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
		const [results, setResults] = useState([]); // per-language result objects
		const [runId, setRunId] = useState(null);
		const [aggregateSummary, setAggregateSummary] = useState('');

	useEffect(() => {
		const parsed = langsRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
		setLangs(Array.from(new Set(parsed)));
	}, [langsRaw]);

	useEffect(() => {
		let cancelled = false;
		setVoicesLoading(true);
		apiClient.fetchVoices().then(v => { if (!cancelled) { setVoices(v); if (!voice && v[0]) setVoice(v[0]); } }).catch(()=>{}).finally(()=>{ if (!cancelled) setVoicesLoading(false); });
		return () => { cancelled = true; };
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const canSubmit = url.trim().length > 0 && langs.length > 0 && !submitting;

		async function handleSubmit(e) {
		e.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true); setError(null);
		try {
				// Fire batch request (Step 10.3)
				const data = await apiClient.postProcessMulti({ url: url.trim(), langs, voice });
				setRunId(data.runId || null);
				// Store first non-empty summary for aggregate (Step 10.6)
				const firstSummary = data.items.find(i => i.summary)?.summary || '';
				setAggregateSummary(firstSummary);
				// Map into results rows
				const rows = data.items.map(item => {
					let objectUrl = null; let blob = null;
					if (item?.audio?.base64) {
						try {
							const b64 = item.audio.base64;
							const binary = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
							const len = binary.length; const bytes = new Uint8Array(len);
							for (let i=0;i<len;i++) bytes[i] = binary.charCodeAt(i);
							blob = new Blob([bytes], { type: 'audio/mpeg' });
							objectUrl = URL.createObjectURL(blob);
						} catch {}
					}
					return { ...item, status: item.error ? 'error' : 'success', objectUrl, blob };
				});
				setResults(rows);
				await onSubmit?.({ url: url.trim(), langs, voice, data });
		} catch (e2) {
			setError(e2.message || 'Failed');
		} finally { setSubmitting(false); }
	}

	return (
		<form className="space-y-5" onSubmit={handleSubmit} noValidate>
			<div className="space-y-2">
				<Label htmlFor="multi-url">Source URL</Label>
				<Input id="multi-url" placeholder="https://example.com/article" value={url} onChange={e=> setUrl(e.target.value)} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="multi-langs">Languages (comma-separated)</Label>
				<Input id="multi-langs" placeholder="hi, es, fr" value={langsRaw} onChange={e=> setLangsRaw(e.target.value)} />
				<p className="text-[11px] text-muted-foreground">Parsed: {langs.length ? langs.join(', ') : '—'}</p>
			</div>
			<div className="space-y-2">
				<Label htmlFor="multi-voice">Voice</Label>
				<select id="multi-voice" className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" value={voice} onChange={e=> setVoice(e.target.value)}>
					{voicesLoading && <option value="" disabled>Loading voices…</option>}
					{!voicesLoading && voices.length === 0 && <option value="" disabled>No voices</option>}
					{!voicesLoading && voices.map(v => <option key={v} value={v}>{v}</option>)}
				</select>
			</div>
			{error && <p className="text-xs text-destructive">{error}</p>}
			<div>
				<Button type="submit" disabled={!canSubmit} aria-disabled={!canSubmit}>
					{submitting && <Spinner className="mr-2" size={16} />}Batch Process
				</Button>
			</div>
					{runId && (
						<p className="text-[11px] text-muted-foreground">runId: <span className="font-mono">{runId}</span></p>
					)}
					{aggregateSummary && (
						<div className="border rounded-md p-3 bg-muted/30 space-y-1">
							<p className="text-xs font-medium">Summary (shared)</p>
							<p className="text-xs leading-snug whitespace-pre-line">{aggregateSummary}</p>
						</div>
					)}
					{results.length > 0 && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-semibold">Results</h3>
								<Button type="button" variant="outline" size="sm" onClick={() => {/* Step 10.7 placeholder for zip */}} title="Download all (zip coming soon)" aria-label="Download all (zip placeholder)">Download All</Button>
							</div>
							<ul className="space-y-2">
								{results.map(r => (
									<li key={r.lang} className="border rounded-md p-2 bg-muted/20">
										<div className="flex flex-wrap items-center gap-2 text-[11px]">
											<span className="font-mono">{r.lang}</span>
											{r.cacheHit && <span className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground">cache</span>}
											{r.partial && <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">partial</span>}
											{r.status === 'error' && <span className="px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground">error</span>}
											{r.status === 'success' && <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">ok</span>}
											{r.retries && (r.retries.portia + r.retries.translation + r.retries.tts) > 0 && (
												<span className="px-1.5 py-0.5 rounded bg-amber-500 text-black" title={`retries p=${r.retries.portia} t=${r.retries.translation} s=${r.retries.tts}`}>r{r.retries.portia + r.retries.translation + r.retries.tts}</span>
											)}
										</div>
										{r.summary && (
											<p className="mt-1 text-[11px] text-muted-foreground line-clamp-2" title={r.summary}>{r.summary}</p>
										)}
										<div className="mt-2 flex items-center gap-2">
											{r.objectUrl && (
												<audio src={r.objectUrl} controls className="h-8" />
											)}
											{r.resultId && (
												<a href={`/api/result/${r.resultId}/audio`} target="_blank" rel="noopener noreferrer" className="text-[11px] underline">open</a>
											)}
										</div>
										{r.error && <p className="text-[11px] text-destructive mt-1">{String(r.error)}</p>}
									</li>
								))}
							</ul>
						</div>
					)}
		</form>
	);
}
