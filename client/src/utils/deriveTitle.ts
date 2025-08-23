export function deriveTitle(url: string): string {
  if (!url) return 'Article'
  try {
    const u = new URL(url)
    const last = u.pathname.split('/').filter(Boolean).pop()
    return last ? decodeURIComponent(last).replace(/[-_]/g, ' ') : u.hostname
  } catch {
    return 'Article'
  }
}
