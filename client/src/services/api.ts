// API service stubs – will be filled in during refactor steps
import axios from 'axios'
import type { ProcessResult, TimelinePhase } from '@/types'

export async function processArticle(params: { url: string; targetLang: string }) : Promise<ProcessResult> {
  const res = await axios.post('/api/process', params)
  return res.data as ProcessResult
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
