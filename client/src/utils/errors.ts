// Map backend error codes to user-friendly messages (stub)
export function mapError(code?: string, fallback = 'Something went wrong') {
  if (!code) return fallback
  const table: Record<string, string> = {
    INVALID_URL: 'The URL looks invalid.',
    FETCH_FAILED: 'Unable to fetch the article content.',
    TRANSLATE_FAILED: 'Translation failed.',
    TTS_FAILED: 'Text-to-speech failed.',
  }
  return table[code] || fallback
}
