import { Button } from '@/components/ui/button'

export default function App() {
	return (
		<main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-ink-900 text-slate-100">
			<h1 className="text-2xl font-semibold tracking-tight">SeTu Prototype</h1>
			<p className="text-sm text-slate-400 max-w-md text-center">Backend ready. UI framework (Tailwind + shadcn) initialized. Next: build processing form & timeline.</p>
			<div className="flex gap-3">
				<Button>Primary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
			</div>
		</main>
	)
}
