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
async function postProcessTimeline({ url, lang, voice }) {
	const res = await fetch(`${base}/process/timeline`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url, lang, voice }),
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
	const headerMap = Object.fromEntries(res.headers.entries());
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
		headers: headerMap,
		runId: json?.runId || headerMap['x-run-id'] || null,
		cacheHit: typeof json?.cacheHit === 'boolean' ? json.cacheHit : headerMap['x-cache-hit'] === '1',
		retries: {
			portia: parseInt(headerMap['x-retries-portia'] || '0', 10),
			translation: parseInt(headerMap['x-retries-translation'] || '0', 10),
			tts: parseInt(headerMap['x-retries-tts'] || '0', 10),
		},
		phases: json?.phases || [],
		summary: json?.summary || '',
		translationChars: json?.translationChars || 0,
		summaryChars: json?.summaryChars || 0,
		partial: json?.partial || (headerMap['x-partial'] === '1'),
		resultId: json?.resultId || headerMap['x-result-id'] || null,
		totalMs: json?.totalMs || 0,
		blob,
		objectUrl,
	};
}

apiClient.postProcessTimeline = postProcessTimeline;

// Fetch available voices
apiClient.fetchVoices = async function fetchVoices() {
	const res = await fetch(`${base}/voices`);
	if (!res.ok) throw new Error(`Failed voices (${res.status})`);
	const json = await res.json().catch(()=>({}));
	return Array.isArray(json.voices) ? json.voices : [];
};

// Fetch history (dev-only unless header provided)
apiClient.fetchHistory = async function fetchHistory({ limit = 25, debug = false } = {}) {
	const headers = {};
	if (debug) headers['X-Debug-History'] = '1';
	const res = await fetch(`${base}/history?limit=${limit}`, { headers });
	if (!res.ok) {
		const text = await res.text().catch(()=> '');
		throw new Error(text || `Failed history (${res.status})`);
	}
	const json = await res.json().catch(()=>({ entries: [] }));
	return Array.isArray(json.entries) ? json.entries : [];
};

// Fetch existing audio by result id (no reprocessing)
apiClient.fetchResultAudio = async function fetchResultAudio(id) {
	if (!id) throw new Error('Missing result id');
	const res = await fetch(`${base}/result/${id}/audio`);
	if (!res.ok) {
		throw new Error(`Audio not found (${res.status})`);
	}
	const blob = await res.blob();
	return { blob, objectUrl: URL.createObjectURL(blob) };
};

