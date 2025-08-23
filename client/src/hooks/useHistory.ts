import { useState, useEffect, useCallback } from 'react'
import type { HistoryItem } from '@/types'
import { getLocalHistory, saveLocalHistory, appendLocalHistory } from '@/services/historyStore'

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => { setHistory(getLocalHistory()) }, [])

  const addEntry = useCallback((item: HistoryItem) => {
    const next = appendLocalHistory(item)
    setHistory(next)
  }, [])

  const clearHistory = useCallback(() => {
    saveLocalHistory([])
    setHistory([])
  }, [])

  return { history, addEntry, clearHistory, setHistory }
}
