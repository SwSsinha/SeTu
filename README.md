# SeTu (सेतु / The Bridge)

SeTu (meaning "bridge") turns any English article into accessible, listenable knowledge in a parent’s own language – especially for families where tech + English can feel like walls. Paste a link, pick a language, receive a translated summary plus natural speech audio. Share health, nutrition, climate, finance or safety guidance with loved ones who shouldn’t be excluded just because the source was published in English.

---
## ❤️ Motivation (Why This Exists)
I kept finding powerful articles: how to build healthier eating habits, warnings about misinformation, long-form explainers on new medical studies. Every time I wanted to share them with my parents, the pattern repeated:

> “It looks long.”  “It’s in English.”  “Can you just tell me the important part later?”

Language and format were silent barriers. We have translation models, text‑to‑speech, and scraping APIs — yet there was friction stitching them together into one simple "Give me this in Hindi and let me listen" flow.

SeTu is a small act of care: lower the cognitive + linguistic load so family members can understand directly, with dignity, without waiting for someone else to summarize. Knowledge about health or safety shouldn’t time out while we procrastinate translating it manually. If a good article can help one parent adopt a better habit sooner, the bridge was worth building.

---
## ✅ What It Does
Input:
- A single URL (single mode) OR
- Multiple URLs (bundle mode – future: stitched “mini‑podcast”) OR
- One URL + multiple target languages (multi-mode)

Output:
- Translated summary text
- Full translated body (internal)
- MP3 audio (primary TTS provider with resilient fallbacks)
- Diagnostics: phase timings, cache status, retries
- Share helpers (link, debug JSON for dev, upcoming social snippets)

---
## 🛠 Architecture Overview
Frontend (Vite + React + Tailwind):
- Accessible form flows (single / multi-lang / bundle)
- Abort + retry controls
- Local + server merged history with cache hit ratio
- Metrics-lite dashboard (lightweight polling)
- Friendly labeling (languages, voices) & fallback badges

Backend (Node.js / Express):
- Orchestrated pipeline with per-phase timing + retry strategy
- Layered fallbacks for scraping, translation, TTS
- In-memory cache + history ring buffer
- Result persistence (temp) with TTL metadata

Data Flow Pipeline:
1. Scrape: Portia Labs (Firecrawl) → structured article text
2. Clean/Normalize: strip boilerplate, collapse whitespace, enforce length caps
3. Translate: Primary (MyMemory) → if empty/English-ish or partial → secondary (LibreTranslate) → if still weak → heuristic Hindi fallback generation (ensures non-empty)
4. Summarize: Lightweight internal summarizer (phrase extraction + truncation heuristics)
5. TTS Orchestration:
   - Primary: ElevenLabs (stream)
   - Auth / quota / content / network failure → fallback tone placeholder (audible) so the user still hears *something* (configurable silent mode)
6. Response Assembly: base64 or stream + metadata (phases, retries, provider flags)
7. Cache + History logging

Resilience Highlights:
- Multi-endpoint scrape attempts + Medium-specific mirror fallback (jina.ai) + basic HTML fallback
- Secondary translation provider + heuristic Hindi injection avoids “silent” failures
- TTS orchestrator detects auth/key issues early and downgrades gracefully
- Timeline endpoint exposes each stage (status, ms, fallback metadata) for transparency

---
## 🔌 External APIs & Services
| Stage | Service | Purpose | Endpoint Pattern |
|-------|---------|---------|------------------|
| Scrape | Portia Labs Tools API (Firecrawl) | Structured article extraction | POST `https://api.portialabs.ai/v0/tools/{tool_id}/run/` |
| Scrape Fallback | Jina AI / Medium mirror | Medium content access (readonly) | GET `https://r.jina.ai/{url}` |
| Translate Primary | MyMemory | EN → target translation | GET `https://api.mymemory.translated.net/get?q=...&langpair=en|hi` |
| Translate Secondary | LibreTranslate (self/hosted endpoint configurable) | Backup translation | POST `${LIBRETRANSLATE_BASE_URL}/translate` |
| Text‑To‑Speech | ElevenLabs | Natural voice synthesis | POST `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` |

Environment Variables (`server/.env`):
```
PORT=5000
PORTIA_API_KEY=your_portia_key
PORTIA_TOOL_ID=your_firecrawl_tool_id
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
LIBRETRANSLATE_BASE_URL=https://libretranslate.de   # optional, override if self-hosted
FALLBACK_TTS_SILENT=0                               # set 1 for silent fallback
```
MyMemory requires no key (free tier; rate limits apply).

---
## 📂 Repository Structure
```
client/              # React UI (forms, history, metrics, batching)
  src/components/    # UI + accessibility wrappers
  src/lib/           # API client, helpers
  public/            # Favicon & static assets
server/              # Express services & routes
  src/services/      # scrape, translate, tts, orchestrator, fallbacks
  src/routes/        # process, history, bundle, multi
  src/utils/         # cache, metrics, ids, summary helpers
tests/               # Unit + integration tests ((selected areas)
```

---
## ✨ Key Features
- Single / Multi-language / Bundle processing modes
- Translation robustness (multi-provider + heuristic fallback)
- TTS fallback (audible placeholder) with provider attribution
- Phase timeline + retry counts per category
- Local + server merged history (cache-hit analytics)
- Accessible components (aria labels, keyboard focus states)
- Abort in-flight requests; retry last submission
- Metrics-lite panel (avg durations, counts, failure stats)
- Friendly language & voice labels (hide raw IDs)
- Debug JSON copy & share links

---
## 🧪 Testing & Quality
- Integration test: end-to-end `/api/process` basic path
- Unit tests for utilities (ID generation etc.)
- Lightweight error classification & resilience verified via mocked upstream failures
Future: Add contract tests for translation fallback invariants (never return empty when source non-empty).

---
## 🚀 Running Locally
Prerequisites: Node.js 18+

Install dependencies:
```
cd client && npm install
cd ../server && npm install
```

Start dev servers (two terminals):
```
cd server && npm start
cd client && npm run dev
```
Open: http://localhost:5173 (Vite default) and paste a URL.

---
## 🔁 Typical Request Flow (Timeline Mode)
```
Client POST /api/process/timeline
  ├─ scrape phase (Portia -> mirror fallback)
  ├─ translate phase (MyMemory -> LibreTranslate -> heuristic)
  ├─ summarize (lightweight extractor)
  ├─ tts (ElevenLabs -> fallback)
  ├─ assemble + cache
  └─ respond (JSON + base64 audio)
```

---
## 📡 Endpoints Summary
- POST `/api/process` – Direct MP3 stream
- POST `/api/process/timeline` – Structured phases + base64 audio
- POST `/api/process-bundle` – Multi-URL (bundle) summary + audio (WIP merge logic)
- POST `/api/process-multi` – One URL → multiple target languages
- GET `/api/result/:id` + `/api/result/:id/audio` – Retrieve stored result
- GET `/api/voices` – Available voices
- GET `/api/history` – Recent runs (dev / header gated)
- GET `/api/metrics-lite` – Lightweight stats snapshot

---
## 🛡 Fallback & Retry Strategy (Condensed)
| Phase | Strategy |
|-------|----------|
| Scrape | Multiple attempts → Medium mirror → basic HTML extraction → error |
| Translate | Provider A → Provider B → heuristic injected Hindi text |
| TTS | ElevenLabs (auth & transient aware) → audible placeholder (never empty) |
| Response | Always returns non-empty translation text (guarantee) |

---
## 🧭 Roadmap
- Higher quality fallback TTS (short spoken phrase vs tone)
- Optional offline/local translation model (edge mode)
- User accounts + saved playlists (podcast style)
- Improved summarization (abstractive w/ safety filters)
- Progressive web app install + offline queue

---
## 🔐 Notes / Limits
- MyMemory free tier: rate limited; heavy usage should switch to a paid or self-hosted translation engine.
- ElevenLabs: metered billing – monitor usage for large batch/bundle modes.
- Current caching is in-memory (non-distributed). Production would require Redis or similar.
- Not intended yet for medical *advice* generation — purely relay + translate published articles.

---
## 🤝 Contributing
PRs & issue suggestions welcome (naming, resilience, new language priorities). Please keep accessibility and graceful failure behavior intact.

---
## 📄 License
MIT (see `LICENSE` if present or add one before wider distribution).

---
## 🙏 Appreciation
Built out of love for parents & caregivers who continue learning late in life. May more knowledge feel *inviting* instead of *intimidating*.

---
## 📊 Versioning
Pre-1.0 semantic style. Minor bumps add functionality; patch bumps fix or tune resilience. Current: 0.1.x.

---
## ⚠ Disclaimer
Automatic translations + summaries can contain inaccuracies. Always cross-check critical medical or financial information with authoritative sources.

---
Happy bridging. 🌉

