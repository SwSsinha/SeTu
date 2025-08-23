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

