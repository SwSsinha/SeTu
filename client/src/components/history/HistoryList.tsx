import type { HistoryItem } from '@/types'
import { HistoryItemCard } from './HistoryItemCard'

interface Props {
  items: HistoryItem[]
  onReuse?: (item: HistoryItem) => void
}

export function HistoryList({ items, onReuse }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map(item => (
        <HistoryItemCard key={item.id} item={item} onListen={(i)=>{ if(i.audioUrl){ const a=new Audio(i.audioUrl); a.play().catch(()=>{}) }} onDownload={(i)=>{ if(!i.audioUrl) return; const a=document.createElement('a'); a.href=i.audioUrl; a.download='setu-audio.mp3'; document.body.appendChild(a); a.click(); document.body.removeChild(a) }} onReuse={onReuse} />
      ))}
    </div>
  )
}
