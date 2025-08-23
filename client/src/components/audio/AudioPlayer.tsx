import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  src: string | null
  onDuration?: (seconds: number) => void
}

export function AudioPlayer({ src, onDuration }: Props) {
  // Load audio duration metadata when src changes
  useEffect(() => {
    if (!src) return
    const el = document.createElement('audio')
    const onLoaded = () => {
      if (isFinite(el.duration) && onDuration) onDuration(el.duration)
    }
    el.addEventListener('loadedmetadata', onLoaded)
    el.src = src + (src.includes('?') ? '&' : '?') + 't=' + Date.now()
    return () => el.removeEventListener('loadedmetadata', onLoaded)
  }, [src, onDuration])

  if (!src) {
    return (
      <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded p-3 text-center">
        Audio not yet attached (will be wired in a later step).
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <audio controls src={src} className="w-full" />
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          disabled={!src}
          onClick={(e) => {
            e.preventDefault()
            if (!src) return
            const a = document.createElement('a')
            a.href = src
            a.download = 'setu-audio.mp3'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }}
        >
          Download
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={!src}
          onClick={(e) => {
            e.preventDefault()
            if (!src) return
            const text = `Listen to this translated audio from SeTu: ${src}`
            const encoded = encodeURIComponent(text)
            const waProtocol = `whatsapp://send?text=${encoded}`
            const waWeb = `https://api.whatsapp.com/send?text=${encoded}`
            const opened = window.open(waProtocol, '_blank', 'noopener,noreferrer')
            setTimeout(() => {
              if (!opened || opened.closed) {
                window.open(waWeb, '_blank', 'noopener,noreferrer')
              }
            }, 400)
          }}
        >
          Share
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={!src}
          onClick={async (e) => {
            e.preventDefault()
            if (!src) return
            try { await navigator.clipboard.writeText(src) } catch (err) { console.warn('Clipboard copy failed', err) }
          }}
        >
          Copy Link
        </Button>
      </div>
    </div>
  )
}
