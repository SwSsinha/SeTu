import type { HistoryItem, Status } from '@/types'
import { HistoryList } from './HistoryList'
import { useHistory } from '@/hooks/useHistory'
import { useEffect, useRef } from 'react'

interface Props {
  status: Status
  currentUrl: string
  currentLang: string
  resultId: string | null
  audioUrl: string | null
  onReuse?: (item: HistoryItem) => void
}

export function HistorySection({ status, currentUrl, currentLang, resultId, audioUrl, onReuse }: Props) {
  const { history, addEntry } = useHistory()
  const lastAddedIdRef = useRef<string | null>(null)

  // When a new successful process completes, append to history (if not already present)
  useEffect(() => {
    if (status !== 'success') return
    const id = (resultId || '') || ''
    if (id && history.some(h => h.id === id)) {
      lastAddedIdRef.current = id
      return
    }
    if (id && lastAddedIdRef.current === id) return
    const entry: HistoryItem = {
      id: id || Date.now().toString(),
      url: currentUrl,
      targetLang: currentLang,
      createdAt: new Date().toISOString(),
      status: 'success',
      audioUrl: audioUrl || undefined,
    }
    addEntry(entry)
    lastAddedIdRef.current = entry.id
  }, [status, resultId, audioUrl, currentUrl, currentLang, history, addEntry])

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-400">History</h3>
        {history.length > 0 && (
          <div className="text-[10px] text-slate-500">{history.length} item{history.length === 1 ? '' : 's'}</div>
        )}
      </div>
      {history.length === 0 && (
        <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded p-4 text-center">No history yet. Process something to see it here.</div>
      )}
      <HistoryList items={history} onReuse={onReuse} />
    </div>
  )
}
