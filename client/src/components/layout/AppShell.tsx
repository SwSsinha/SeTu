import { PropsWithChildren } from 'react'

export function AppShell({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen w-full bg-ink-900 text-slate-100 flex flex-col items-center p-8 gap-8">
      {children}
    </main>
  )
}
