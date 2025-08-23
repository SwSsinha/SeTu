import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export default function App() {
	return (
		<main className="min-h-screen w-full bg-ink-900 text-slate-100 flex flex-col items-center p-8 gap-8">
			<header className="w-full max-w-5xl flex items-center justify-between">
				<h1 className="text-2xl font-semibold tracking-tight">SeTu</h1>
				<div className="text-xs text-slate-500">Module 1 · Static UI Shell</div>
			</header>
			<section className="w-full flex flex-col items-center gap-8">
				<Card>
					<form className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="url">Article URL</Label>
							<Input id="url" placeholder="https://example.com/article" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="lang">Target Language</Label>
							<Input id="lang" placeholder="e.g. en, es, fr" />
						</div>
						<div className="pt-2">
							<Button className="w-full" disabled>
								Process
							</Button>
						</div>
					</form>
				</Card>
			</section>
			<footer className="mt-auto pb-4 text-xs text-slate-600">Backend ready • Frontend shell in progress</footer>
		</main>
	)
}
