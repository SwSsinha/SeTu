import { createContext, useContext, useState, PropsWithChildren, useEffect } from 'react'
import { STORAGE_KEYS } from '@/constants/storageKeys'

interface PreferenceState { lang: string; setLang: (v: string) => void; voiceId: string | null; setVoiceId: (v: string | null) => void }

const PreferenceCtx = createContext<PreferenceState | undefined>(undefined)

export function PreferenceProvider({ children }: PropsWithChildren) {
  const [lang, setLangState] = useState('hi')
  const [voiceId, setVoiceIdState] = useState<string | null>(null)

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem(STORAGE_KEYS.preferredLang)
      if (storedLang) setLangState(storedLang)
      const storedVoice = localStorage.getItem(STORAGE_KEYS.preferredVoice)
      if (storedVoice) setVoiceIdState(storedVoice)
    } catch {}
  }, [])

  const setLang = (v: string) => { setLangState(v); try { localStorage.setItem(STORAGE_KEYS.preferredLang, v) } catch {} }
  const setVoiceId = (v: string | null) => { setVoiceIdState(v); try { v ? localStorage.setItem(STORAGE_KEYS.preferredVoice, v) : localStorage.removeItem(STORAGE_KEYS.preferredVoice) } catch {} }

  return <PreferenceCtx.Provider value={{ lang, setLang, voiceId, setVoiceId }}>{children}</PreferenceCtx.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferenceCtx)
  if (!ctx) throw new Error('usePreferences must be used within PreferenceProvider')
  return ctx
}
