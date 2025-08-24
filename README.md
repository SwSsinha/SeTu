# SeTu (सेतु / The Bridge)

One-line pitch: An AI-powered agent that makes the English-language internet accessible to non-English-speaking parents by translating any online article into their native language and generating a listenable audio version.

## Why
Many parents aren’t comfortable with English or technology. SeTu bridges that gap so we can share articles with them in their language as an audio file—focusing on connection, not productivity.

## What
- Input: A URL (or multiple URLs in bundle mode) + target language (e.g., Hindi).
- Output: An MP3 of the translated content with summary + share options.

## Architecture
- Frontend: React (Vite) with Tailwind & accessible components (single, multi-lang, bundle modes, sharing panel, metrics).
- Backend: Node.js/Express orchestrator with caching & metrics-lite.
- Pipeline:
  1. Portia Labs firecrawl_scrape → extract article content
  2. MyMemory API → translate EN → target language (e.g., en|hi)
  3. ElevenLabs TTS → synthesize translated text to MP3
  4. Stream MP3 back to the client for download

## APIs Used
- Portia Labs Tools API (firecrawl_scrape)
  - POST https://api.portialabs.ai/v0/tools/{tool_id}/run/
  - Auth: Authorization: Api-Key <PORTIA_API_KEY>
- MyMemory Translation API (free tier)
  - GET https://api.mymemory.translated.net/get?q=...&langpair=en|hi
- ElevenLabs TTS
  - POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
  - Headers: xi-api-key: <ELEVENLABS_API_KEY>

## Repo Structure
- client/ — React app (Vite)
- server/ — Express backend orchestrating the pipeline

## Features (Post-MVP Additions)
- Timeline endpoint with phase metrics & retries
- Partial translation & TTS fallback handling
- History (local + server merged) with cache hit ratio
- Bundle (podcast) mode: multi-URL aggregate, summary, audio merge placeholder
- Share actions: WhatsApp, copy summary, encoded URL fragment deep link
- Metrics-lite panel (auto-refresh) & request signature skip cache
- Error classification, retry, cancel (AbortController)
- Offline banner + error boundary
- Loading skeletons for history & metrics

## Setup
Prerequisites:
- Node.js 18+ and npm

Install:
- From repo root:
  - cd client && npm install
  - cd ../server && npm install

## Environment Variables
Create `server/.env` with:
- PORT=5000
- PORTIA_API_KEY=your_portia_api_key
- PORTIA_TOOL_ID=your_firecrawl_scrape_tool_id
- ELEVENLABS_API_KEY=your_elevenlabs_api_key
- ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # example voice (Rachel)

MyMemory free tier doesn’t require an API key.

## Run (Dev)
In two terminals:
- Backend:
  - cd server
  - npm start
- Frontend:
  - cd client
  - npm run dev

## MVP Goal
End-to-end: submit one article URL → receive an MP3 in Hindi.

## Versioning
Current dev version: 0.1.0 (semantic version bump from initial 0.0.0). Major features incomplete for 1.0; pre-1.0 minor bumps indicate feature additions.

## Endpoints (Frontend Consumption)
- POST /api/process (direct MP3 stream)
- POST /api/process/timeline (phases JSON + base64 audio)
- POST /api/process-bundle (bundle summary + audio)
- POST /api/process-multi (multi-language batch)
- GET /api/result/:id (result meta) & /api/result/:id/audio (audio stream)
- GET /api/voices (available voices)
- GET /api/history (recent runs)
- GET /api/metrics-lite (metrics snapshot)

## Notes
- Free tiers have rate limits (MyMemory) and TTS may incur costs (ElevenLabs).
- Keep article text within service limits; chunking can be added if needed.
