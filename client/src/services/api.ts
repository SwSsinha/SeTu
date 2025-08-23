// API service stubs – will be filled in during refactor steps
import axios from 'axios'
import type { ProcessResult, TimelinePhase } from '@/types'

export async function processArticle(params: { url: string; targetLang: string }) : Promise<ProcessResult> {
  // Endpoint returns raw audio stream with headers when cache miss; treat as binary but only need headers + result id
  const res = await axios.post('/api/process', params, { responseType: 'arraybuffer' })
  const resultId = res.headers['x-result-id'] || null
  const summaryPreview = res.headers['x-summary-preview'] ? decodeURIComponent(res.headers['x-summary-preview']) : undefined
  const cacheHit = res.headers['x-cache-hit'] === '1'
  const audioBlob = new Blob([res.data], { type: 'audio/mpeg' })
  const audioUrl = URL.createObjectURL(audioBlob)
  return { resultId, audioUrl, summary: summaryPreview, cacheHit }
}

export async function fetchResultMeta(id: string): Promise<Partial<ProcessResult>> {
  try {
    const res = await axios.get(`/api/result/${id}`)
    const summary = res.data?.meta?.summary
    return { summary }
  } catch { return {} }
}

// Placeholder functions for future implementation
export async function fetchHistory() { /* to implement */ return { items: [] } }
export async function fetchVoices() { /* to implement */ return [] }
export async function fetchTimeline(resultId: string): Promise<TimelinePhase[]> {
  // Expect backend endpoint: GET /api/results/:id/timeline returning array of phases
  try {
    const res = await axios.get(`/api/results/${resultId}/timeline`)
    return res.data as TimelinePhase[]
  } catch {
    return []
  }
}
