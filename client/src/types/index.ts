// Shared type definitions (initial stubs)
export type Status = 'idle' | 'loading' | 'success' | 'error'

export interface HistoryItem {
  id: string
  url: string
  targetLang: string
  createdAt: string
  status: Status
  audioUrl?: string
  summary?: string
}

export interface ProcessResult {
  resultId: string
  audioUrl?: string
  summary?: string
  cacheHit?: boolean
}

export interface TimelinePhase {
  key: string
  label: string
  startedAt?: string
  completedAt?: string
  durationMs?: number
  status?: 'pending' | 'running' | 'done' | 'error'
  error?: string
}

export interface Voice {
  id: string
  name: string
  gender?: string
  locale?: string
  previewUrl?: string
}
