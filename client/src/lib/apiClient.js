// Minimal API client for MVP – using fetch for now.
const base = import.meta?.env?.VITE_API_BASE || '/api';

async function postProcess({ url, lang }) {
	const res = await fetch(`${base}/process`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url, lang }),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(text || `Request failed (${res.status})`);
	}
	const blob = await res.blob(); // audio/mpeg
	return {
		blob,
		objectUrl: URL.createObjectURL(blob),
		headers: Object.fromEntries(res.headers.entries()),
	};
}

export const apiClient = {
	postProcess,
};

// Timeline variant returning JSON with phases & base64 audio.
async function postProcessTimeline({ url, lang }) {
	const res = await fetch(`${base}/process/timeline`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url, lang }),
	});
	if (!res.ok) {
		let msg = `Request failed (${res.status})`;
		try {
			const data = await res.json();
			if (data && data.status === 'error') msg = data.error || msg;
		} catch {
			try { msg = await res.text() || msg; } catch {}
		}
		throw new Error(msg);
	}
	const json = await res.json();
	let blob = null; let objectUrl = null;
	if (json?.audio?.base64) {
		try {
			const b64 = json.audio.base64;
			const binary = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
			const len = binary.length;
			const bytes = new Uint8Array(len);
			for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
			blob = new Blob([bytes], { type: json.audio.mime || 'audio/mpeg' });
			objectUrl = URL.createObjectURL(blob);
		} catch {}
	}
	return {
		json,
		runId: json?.runId || null,
		cacheHit: !!json?.cacheHit,
		phases: json?.phases || [],
		summary: json?.summary || '',
		partial: json?.partial || false,
		resultId: json?.resultId || null,
		totalMs: json?.totalMs || 0,
		blob,
		objectUrl,
	};
}

apiClient.postProcessTimeline = postProcessTimeline;

