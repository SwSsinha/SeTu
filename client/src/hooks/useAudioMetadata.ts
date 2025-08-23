import { useEffect, useState } from 'react'

export function useAudioMetadata(src: string | null) {
  const [duration, setDuration] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!src) { setDuration(null); return }
    setLoading(true)
    const el = document.createElement('audio')
    const onLoaded = () => { if (isFinite(el.duration)) setDuration(el.duration); setLoading(false) }
    const onError = () => { setLoading(false) }
    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('error', onError)
    el.src = src + (src.includes('?') ? '&' : '?') + 't=' + Date.now()
    return () => { el.removeEventListener('loadedmetadata', onLoaded); el.removeEventListener('error', onError) }
  }, [src])

  return { duration, loading }
}
