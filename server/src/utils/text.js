// Basic cleanup helpers for scraped HTML-to-text output.
// Removes nav/skip/menu artifacts, repeated language lists, and collapses whitespace.

function stripBoilerplate(raw) {
	if (!raw || typeof raw !== 'string') return raw || '';
	let working = raw;
	// Remove Markdown style [Skip to ...](url) at top
	working = working.replace(/^\s*\[Skip to main content\]\([^\)]+\)\s*/i, '');
	// Remove multiple language selector bracketed links block (heuristic: 5+ bracket links in a row)
	working = working.replace(/(?:\[[^\]]+\]\([^\)]+\)\s*){5,}/g, '');
	// Remove isolated ©Credits or Credits lines
	working = working.replace(/^©?Credits?\s*$/gim, '');
	// Remove trailing share / navigation words common on WHO
	working = working.replace(/(?:Back to top|Share this page)\s*/gi, '');
	// Collapse multiple blank lines
	working = working.replace(/\n{3,}/g, '\n\n');
	if (!raw) return '';
	let cleanedBase = stripBoilerplate(raw);
	const lines = cleanedBase.split(/\r?\n/);
	const cleaned = [];
	let started = false;
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i].trim();
		if (!started) {
			const isLinkOnly = /^\[[^\]]+\]\([^\)]+\)$/.test(line);
			const manyLinks = (line.match(/\[[^\]]+\]\([^\)]+\)/g) || []).length >= 3;
			const isLangBlock = /arabic|français|русский|español|中文|عربية|русский/i.test(line) && line.length < 120;
			const isCredits = /^©?credits?$/i.test(line);
			const isDate = /\b(19|20)\d{2}\b/.test(line) && /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(line) && line.length < 60;
			const isSkip = /skip to main content/i.test(line);
			if (!line || isLinkOnly || manyLinks || isLangBlock || isCredits || isDate || isSkip) continue;
			if (/^# /.test(line)) {
				const lookahead = lines.slice(i + 1, i + 6).some(l => l && !/^\[[^\]]+\]\([^\)]+\)$/.test(l) && l.trim().split(/\s+/).length > 4);
				if (!lookahead) continue;
			}
			const letters = (line.match(/[A-Za-z]{2,}/g) || []).join('').length;
			const words = line.split(/\s+/).filter(Boolean).length;
			if (letters < 30 && words < 8) continue;
			started = true;
		}
		line = line.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
		cleaned.push(line);
	}
	let result = cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
	if (/skip to main content/i.test(result.slice(0, 120))) {
		const idx = result.indexOf('\n\n');
		if (idx > 0) result = result.slice(idx + 2).trim();
	}
	return result;
				line = line.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
				cleaned.push(line);
			}
			let result = cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
			// Final guard: if result still begins with leftover nav tokens, slice after first double newline
			if (/skip to main content/i.test(result.slice(0, 120))) {
				const idx = result.indexOf('\n\n');
				if (idx > 0) result = result.slice(idx + 2).trim();
			}
			return result;
