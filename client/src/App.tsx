import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ProcessForm } from '@/components/process/ProcessForm'
import { SuccessCard } from '@/components/process/SuccessCard'
import { HistorySection } from '@/components/history/HistorySection'
import { useProcess } from '@/hooks/useProcess'
import { useTimeline } from '@/hooks/useTimeline'
import { Timeline } from '@/components/process/Timeline'

// Types moved to central types module

export default function App() {
  const { url, setUrl, lang, setLang, status, error, resultId, audioSrc, result, submit, reset } = useProcess('hi')

  return (
    <AppShell>
      <section className="w-full flex flex-col items-center gap-8">
        {status !== 'success' && (
          <ProcessForm
            url={url}
            lang={lang}
            status={status}
            setUrl={setUrl}
            setLang={setLang}
      onSubmit={submit}
            error={error}
      resetError={reset}
          />
        )}
        {status === 'loading' && resultId && (
          <Timeline {...useTimeline(resultId)} />
        )}
        {status === 'success' && (
          <SuccessCard audioSrc={audioSrc} resultId={resultId} summary={result?.summary} onReset={() => { reset(); setUrl('') }} />
        )}
    <HistorySection status={status} currentUrl={url} currentLang={lang} resultId={resultId} audioUrl={audioSrc} onReuse={(item) => { setUrl(item.url); setLang(item.targetLang); reset() }} />
      </section>
    </AppShell>
  )
}
