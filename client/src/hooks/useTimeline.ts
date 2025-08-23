import { useEffect, useRef, useState } from 'react'
import type { TimelinePhase } from '@/types'
import { fetchTimeline } from '@/services/api'
import { PHASES } from '@/constants/phases'

// Polls for timeline phases (stub implementation)
export function useTimeline(resultId: string | null) {
  const [phases, setPhases] = useState<TimelinePhase[]>(PHASES.map(p => ({ ...p, status: 'pending' })))
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!resultId) return
    setLoading(true)
    const poll = async () => {
      const remote = await fetchTimeline(resultId)
      if (remote.length) {
        // Merge into base ordering
        const merged = PHASES.map(base => {
          const found = remote.find(r => r.key === base.key)
            || { ...base, status: 'pending' as const }
          return { ...base, ...found }
        })
        setPhases(merged)
        const allDone = merged.every(p => p.status === 'done' || p.status === 'error')
        if (allDone && intervalRef.current) {
          window.clearInterval(intervalRef.current)
          intervalRef.current = null
          setLoading(false)
        }
      }
    }
    poll()
    intervalRef.current = window.setInterval(poll, 1500)
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current) }
  }, [resultId])

  return { phases, loading }
}
