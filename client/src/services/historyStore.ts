// LocalStorage history helpers (stubs)
import type { HistoryItem } from '@/types'

const KEY = 'setu_history'

export function getLocalHistory(): HistoryItem[] {
  try { const raw = localStorage.getItem(KEY); if (!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
}

export function saveLocalHistory(items: HistoryItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch {}
}

export function appendLocalHistory(item: HistoryItem) {
  const list = getLocalHistory()
  list.push(item)
  saveLocalHistory(list)
  return list
}
