import { useEffect } from 'react'

interface Options {
  onFocusUrl?: () => void
  onToggleHistory?: () => void
}

// Basic hotkey hook (stub)
export function useHotkeys({ onFocusUrl, onToggleHistory }: Options) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key === '/' && onFocusUrl) { e.preventDefault(); onFocusUrl() }
      if (e.key.toLowerCase() === 'h' && onToggleHistory) { e.preventDefault(); onToggleHistory() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onFocusUrl, onToggleHistory])
}
