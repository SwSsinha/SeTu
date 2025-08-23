import { PropsWithChildren, ReactNode } from 'react'

interface Props extends PropsWithChildren {
  headerExtra?: ReactNode
  footerText?: string
}

export function AppShell({ children, headerExtra, footerText = 'Backend ready • Frontend shell in progress' }: Props) {
  return (
    <main className="min-h-screen w-full bg-ink-900 text-slate-100 flex flex-col items-center p-8 gap-8">
      <header className="w-full max-w-5xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">SeTu</h1>
        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span>Module 1 · Static UI Shell</span>
          {headerExtra}
        </div>
      </header>
      {children}
      <footer className="mt-auto pb-4 text-xs text-slate-600">{footerText}</footer>
    </main>
  )
}
