import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { HistoryItem } from '@/types'
import { deriveTitle } from '@/utils/deriveTitle'
import { relativeTime } from '@/utils/time'

interface Props {
  item: HistoryItem
  onListen?: (item: HistoryItem) => void
  onDownload?: (item: HistoryItem) => void
  onReuse?: (item: HistoryItem) => void
}

export function HistoryItemCard({ item, onListen, onDownload, onReuse }: Props) {
  const title = deriveTitle(item.url)
  const disabled = !item.audioUrl
  return (
    <Card className="p-4 flex flex-col gap-2 bg-slate-900/50">
      <div className="space-y-1 min-h-[48px]">
        <div className="text-sm font-medium line-clamp-2 break-words">{title}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 flex gap-2">
          <span>{item.targetLang}</span>
          <span>•</span>
          <span>{relativeTime(item.createdAt)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={disabled} className="flex-1 h-8 text-xs" type="button" onClick={()=>{ if(!disabled && onListen) onListen(item) }}>Listen</Button>
        <Button size="sm" disabled={disabled} className="flex-1 h-8 text-xs" type="button" onClick={()=>{ if(!disabled && onDownload) onDownload(item) }}>Download</Button>
        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" type="button" onClick={()=> onReuse && onReuse(item)}>Reuse</Button>
      </div>
    </Card>
  )
}
