// Individual history entry card displaying required fields.
// Props: entry { url, lang, voice, partial, durationMs, cacheHit, retries } and onSelect(entry)
import { Badge } from '../ui/badge';

export function HistoryItem({ entry, onSelect }) {
	if (!entry) return null;
	const { url, lang, voice, partial, durationMs, cacheHit, retries } = entry;
	const totalRetries = retries ? (retries.portia || 0) + (retries.translation || 0) + (retries.tts || 0) : 0;
	return (
		<button
			type="button"
			onClick={() => onSelect?.(entry)}
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
				{voice && <span title="Voice" className="font-mono">{voice}</span>}
				{typeof durationMs === 'number' && <span title="Duration" className="font-mono">{durationMs}ms</span>}
			</div>
		</button>
	);
}
