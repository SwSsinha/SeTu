import type { HistoryItem } from '@/types'
import { HistoryList } from './HistoryList'

interface Props {
  items: HistoryItem[]
  onReuse?: (item: HistoryItem) => void
}

export function HistorySection({ items, onReuse }: Props) {
  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-400">History</h3>
        {items.length > 0 && (
          <div className="text-[10px] text-slate-500">{items.length} item{items.length === 1 ? '' : 's'}</div>
        )}
      </div>
      {items.length === 0 && (
        <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded p-4 text-center">No history yet. Process something to see it here.</div>
      )}
      <HistoryList items={items} onReuse={onReuse} />
    </div>
  )
}
