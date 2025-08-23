import { useEffect, useState, useCallback } from 'react';

// Simple theme provider: manages 'light' | 'dark' in html classList.
// Future enhancements: system preference sync, animation, persistence abstraction.
export function ThemeProvider({ children, storageKey = 'setu-theme' }) {
	const [theme, setTheme] = useState('light');

	// Load stored preference
	useEffect(() => {
		try {
			const stored = localStorage.getItem(storageKey);
			if (stored === 'light' || stored === 'dark') {
				setTheme(stored);
				document.documentElement.classList.toggle('dark', stored === 'dark');
				return;
			}
		} catch {}
		// Fallback to light (could check prefers-color-scheme later)
		document.documentElement.classList.toggle('dark', theme === 'dark');
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const applyTheme = useCallback((next) => {
		setTheme(next);
		document.documentElement.classList.toggle('dark', next === 'dark');
		try { localStorage.setItem(storageKey, next); } catch {}
	}, [storageKey]);

	const toggle = useCallback(() => {
		applyTheme(theme === 'dark' ? 'light' : 'dark');
	}, [theme, applyTheme]);

	return (
		<ThemeContext.Provider value={{ theme, setTheme: applyTheme, toggle }}>
			{children}
		</ThemeContext.Provider>
	);
}

import { createContext } from 'react';
export const ThemeContext = createContext({ theme: 'light', setTheme: () => {}, toggle: () => {} });

