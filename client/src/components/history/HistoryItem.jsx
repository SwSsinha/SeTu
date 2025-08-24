// Individual history entry card displaying required fields.
// Props: entry { url, lang, voice, partial, durationMs, cacheHit, retries } and onSelect(entry)
import { Badge } from '../ui/badge';
import { useRef } from 'react';
import { apiClient } from '../../lib/apiClient';

export function HistoryItem({ entry, onSelect }) {
	if (!entry) return null;
	const { url, lang, voice, partial, durationMs, cacheHit, retries, summaryPreview } = entry;
	const totalRetries = retries ? (retries.portia || 0) + (retries.translation || 0) + (retries.tts || 0) : 0;
	// 14.2: preload audio on hover (debounced) – store object URL on entry._preloadedAudioUrl
	const hoverTimer = useRef(null);
	function schedulePreload() {
		if (entry._preloadedAudioUrl || !entry.resultId) return;
		hoverTimer.current = setTimeout(async () => {
			try {
				const { objectUrl } = await apiClient.fetchResultAudio(entry.resultId);
				entry._preloadedAudioUrl = objectUrl;
			} catch {}
		}, 400); // slight delay to avoid waste
	}
	function cancelPreload() { if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; } }
	return (
		<button
			type="button"
			onClick={() => onSelect?.(entry)}
			onMouseEnter={schedulePreload}
			onFocus={schedulePreload}
			onMouseLeave={cancelPreload}
			onBlur={cancelPreload}
			className="w-full text-left border rounded-md p-2 hover:bg-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
			aria-label={`History item for ${url}`}
		>
			<div className="flex items-start justify-between gap-2">
				<span className="font-mono text-[11px] leading-snug break-all line-clamp-2" title={url}>{url}</span>
				<div className="flex items-center gap-1 flex-shrink-0">
					{cacheHit && <Badge variant="outline" aria-label="Cache hit">Cache</Badge>}
					{partial && <Badge variant="secondary" aria-label="Partial translation">Partial</Badge>}
					{totalRetries > 0 && <Badge variant="destructive" aria-label={`${totalRetries} retries`} title={`Retries: portia=${retries?.portia||0} translation=${retries?.translation||0} tts=${retries?.tts||0}`}>R{totalRetries}</Badge>}
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground tabular-nums">
				<span title="Language" className="font-mono">{lang || '—'}</span>
				{voice && (
					<span title={voice} className="font-mono">
						{/* Derive simple index from hash position for stable label (Voice 1) */}
						{(() => {
							// Simple deterministic index: take first char code mod 9 + 1 (not critical accuracy)
							try { const n = (voice.charCodeAt(0) % 9) + 1; return `Voice ${n}`; } catch { return 'Voice'; }
						})()}
					</span>
				)}
				{typeof durationMs === 'number' && <span title="Duration" className="font-mono">{durationMs}ms</span>}
			</div>
			{summaryPreview && (
				<p className="mt-1 text-[11px] text-muted-foreground line-clamp-2" title={summaryPreview}>{summaryPreview}</p>
			)}
		</button>
	);
}
