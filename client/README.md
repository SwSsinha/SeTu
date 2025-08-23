# SeTu Frontend

Progressive React + Vite interface for the SeTu processing backend (article → translation → TTS audio) with caching, phases, history, batch & bundle modes.

## Tech Stack
- React + Vite
- Tailwind CSS + shadcn/ui (New York style, Stone base color)
- Axios for HTTP
- In-memory state (hooks + context) – potential future React Query

## High-Level Features (Planned)
1. Single URL processing with timeline phases (/api/process/timeline)
2. Summary + translation + audio playback & download
3. Voice selection (/api/voices)
4. History (server + local merge) reuse & playback
5. Batch (multi-language) & Bundle (multi-URL podcast) modes
6. Metrics panel (/api/metrics-lite) & retry/cache indicators
7. Sharing (copy link, WhatsApp) & debug JSON copy
8. Partial / fallback TTS and cache hit badges

## Directory Structure
```
src/
	components/       # Feature + UI grouping
		layout/         # Header, Footer, ThemeToggle
		process/        # Single processing flow components
		history/        # History list & items
		batch/          # Multi-lang + bundle forms
		shared/         # Generic reusable bits
	hooks/            # Data + side-effect logic per feature
	lib/              # Low-level helpers (api, audio, formatting)
	context/          # Global contexts (preferences, theme)
	styles/           # Tailwind layers
	config/           # Constants & env access
	assets/           # Static assets (logo, icons)
```

## Environment
Configure backend base URL in `.env.local`:
```
VITE_API_BASE=http://localhost:5000
```

## Scripts
| Command        | Purpose                |
| -------------- | ---------------------- |
| `npm run dev`  | Start dev server       |
| `npm run build`| Production build       |
| `npm run preview` | Preview build       |

## Implementation Modules
Refer to internal module plan (0–16) for incremental commits.

## Incremental Roadmap Snapshot
- [x] Scaffold + Tailwind + shadcn init
- [ ] Core UI shell
- [ ] Single process logic
- [ ] Timeline phases & summary
- [ ] Metrics & headers
- [ ] Voice + language selects
- [ ] History integration
- [ ] Batch & Bundle modes
- [ ] Sharing & polish

## Contributing / Dev Notes
- One commit per planned step for traceability.
- Avoid committing large audio blobs; use backend streaming.

## Future Enhancements
- Service worker caching of audio
- React Query for data caching
- PWA manifest & offline page

