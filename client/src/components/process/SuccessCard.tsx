import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/utils/time'
import { AudioPlayer } from '@/components/audio/AudioPlayer'
import { useAudioMetadata } from '@/hooks/useAudioMetadata'

interface Props { audioSrc: string | null; resultId: string | null; onReset: () => void }

export function SuccessCard({ audioSrc, resultId, onReset }: Props) {
  const { duration } = useAudioMetadata(audioSrc)
  return (
    <Card className="space-y-4 w-full max-w-xl">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Success</h2>
        <p className="text-xs text-slate-400">Done {duration && <span className="text-slate-300">Audio {formatDuration(duration)}</span>} {resultId && <span className="text-slate-500">• ID {resultId}</span>}</p>
      </div>
      <AudioPlayer src={audioSrc} />
      <div className="flex gap-3 pt-2 flex-wrap">
        <Button variant="outline" className="flex-1" disabled={!audioSrc} type="button" onClick={() => {
          if (!audioSrc) return
          const a = document.createElement('a')
          a.href = audioSrc
          a.download = 'setu-audio.mp3'
          document.body.appendChild(a); a.click(); document.body.removeChild(a)
        }}>Download</Button>
        <Button variant="outline" className="flex-1" disabled={!audioSrc} type="button" onClick={() => {
          if (!audioSrc) return
          const text = `Listen to this translated audio from SeTu: ${audioSrc}`
          const encoded = encodeURIComponent(text)
          const proto = `whatsapp://send?text=${encoded}`
          const web = `https://api.whatsapp.com/send?text=${encoded}`
          const opened = window.open(proto,'_blank','noopener,noreferrer')
          setTimeout(()=>{ if(!opened || opened.closed) window.open(web,'_blank','noopener,noreferrer') },400)
        }}>Share</Button>
        <Button variant="outline" className="flex-1" disabled={!audioSrc} type="button" onClick={async () => { if(!audioSrc) return; try { await navigator.clipboard.writeText(audioSrc) } catch {} }}>Copy Link</Button>
  <Button className="flex-1" type="button" onClick={onReset}>Translate Another</Button>
      </div>
    </Card>
  )
}
