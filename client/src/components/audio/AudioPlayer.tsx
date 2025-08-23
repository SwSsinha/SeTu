interface Props { src: string | null }
export function AudioPlayer({ src }: Props) {
  if (!src) return null
  return <audio controls src={src} className="w-full" />
}
