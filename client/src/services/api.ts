// API service stubs – will be filled in during refactor steps
import axios from 'axios'
import type { ProcessResult } from '@/types'

export async function processArticle(params: { url: string; targetLang: string }) : Promise<ProcessResult> {
  const res = await axios.post('/api/process', params)
  return res.data as ProcessResult
}

// Placeholder functions for future implementation
export async function fetchHistory() { /* to implement */ return { items: [] } }
export async function fetchVoices() { /* to implement */ return [] }
export async function fetchTimeline(resultId: string) { /* to implement */ return [] }
