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
			const [submittedUrls, setSubmittedUrls] = useState([]);
				const [bundleAudioUrl, setBundleAudioUrl] = useState(null);
				const [bundleAudioBlob, setBundleAudioBlob] = useState(null);
				const [bundleAudioSize, setBundleAudioSize] = useState(0);

		async function handleSubmit(e) {
		e.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
			setBundleResp(null); setBundleError(null);
		try {
				setSubmittedUrls(limited);
						const resp = await apiClient.postProcessBundle({ urls: limited, lang, voice: voice || undefined });
				setBundleResp(resp);
						// Decode audio (base64) for player (Step 11.5)
						try {
							if (resp?.audio?.base64) {
								const b64 = resp.audio.base64;
								const binary = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
								const len = binary.length; const bytes = new Uint8Array(len);
								for (let i=0;i<len;i++) bytes[i] = binary.charCodeAt(i);
								const blob = new Blob([bytes], { type: resp.audio.mime || 'audio/mpeg' });
								const objUrl = URL.createObjectURL(blob);
								setBundleAudioBlob(blob);
								setBundleAudioUrl(objUrl);
								setBundleAudioSize(bytes.length);
							} else {
								setBundleAudioBlob(null); setBundleAudioUrl(null); setBundleAudioSize(0);
							}
						} catch {}
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
								<div className="mt-4 text-[11px] space-y-3">
									<div className="space-y-1">
										<p className="flex flex-wrap items-center gap-2">runId: <span className="font-mono">{bundleResp.runId || '—'}</span> resultId: <span className="font-mono">{bundleResp.resultId || '—'}</span>
											{bundleResp.cacheHit && <span className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground">cache</span>}
											{bundleResp.partial && <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">partial</span>}
											{bundleResp.bundle?.partialScrape && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black" title="Some URLs failed to scrape">partial-scrape</span>}
													{bundleResp.bundle?.truncated && <span className="px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground" title="Text truncated before TTS">truncated</span>}
										</p>
										<p>bundle: count={bundleResp.bundle?.count} failed={Array.isArray(bundleResp.bundle?.failed) ? bundleResp.bundle.failed.length : 0}</p>
									</div>
											{bundleResp.summary && (
												<div className="border rounded-md p-3 bg-muted/30 max-h-60 overflow-auto">
													<p className="text-xs font-medium mb-1">Combined Summary</p>
													<p className="text-xs leading-snug whitespace-pre-line">{bundleResp.summary}</p>
												</div>
											)}
														{bundleAudioUrl && (
															<div className="space-y-1">
																<audio src={bundleAudioUrl} controls className="w-full" aria-label="Bundle audio" />
																<div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
																	<span>size: <span className="font-mono">{bundleAudioSize}B</span>{' '}(~{(bundleAudioSize/1024).toFixed(1)}KB)</span>
																	{bundleResp.audio?.url && <a href={bundleResp.audio.url} target="_blank" rel="noopener noreferrer" className="underline">open</a>}
																	{bundleAudioUrl && (
																		<button
																			type="button"
																			className="underline"
																			onClick={() => {
																				const a = document.createElement('a');
																				a.href = bundleAudioUrl; a.download = `bundle_${lang}.mp3`; document.body.appendChild(a); a.click(); a.remove();
																			}}
																		>download</button>
																	)}
																</div>
															</div>
														)}
									<div>
										<h4 className="font-medium mb-1">URLs</h4>
										<ul className="space-y-1">
											{submittedUrls.map(u => {
												const failedEntry = bundleResp.bundle?.failed?.find(f => f.url === u);
												const ok = !failedEntry;
												return (
													<li key={u} className="flex items-start justify-between gap-2 border rounded px-2 py-1 bg-muted/30">
														<span className="truncate font-mono" title={u}>{u}</span>
														<span className={ok ? 'text-green-600 dark:text-green-400 text-xs' : 'text-destructive text-xs'}>
															{ok ? 'success' : 'failed'}
														</span>
													</li>
												);
											})}
										</ul>
									</div>
								</div>
							)}
		</form>
	);
}
