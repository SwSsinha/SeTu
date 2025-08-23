import type { TimelinePhase } from '@/types'
import { Badge } from '@/components/common/Badge'
import { formatDuration } from '@/utils/time'

interface Props { phases: TimelinePhase[]; loading: boolean }

const statusColor: Record<string, string> = {
	pending: 'bg-slate-700 text-slate-400',
	running: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
	done: 'bg-green-600/20 text-green-300 border border-green-600/40',
	error: 'bg-red-700/30 text-red-300 border border-red-600/50'
}

export function Timeline({ phases, loading }: Props) {
	return (
		<div className="w-full max-w-xl border border-slate-800 rounded-lg p-4 bg-slate-900/40 space-y-3">
			<div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
				<span>Process Timeline</span>
				{loading && <span className="animate-pulse">Updating…</span>}
			</div>
			<ol className="space-y-2">
				{phases.map(p => {
					const started = p.startedAt ? new Date(p.startedAt) : null
					const ended = p.completedAt ? new Date(p.completedAt) : null
					const dur = (p.durationMs != null ? p.durationMs : (started && ended ? ended.getTime() - started.getTime() : null))
					return (
						<li key={p.key} className="flex items-start gap-3">
							<div className="flex flex-col items-center pt-0.5">
								<span className={`h-3 w-3 rounded-full ${p.status==='done'?'bg-green-500':p.status==='running'?'bg-amber-400':p.status==='error'?'bg-red-500':'bg-slate-600'}`} />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 text-sm">
									<span className="font-medium capitalize">{p.label}</span>
									<Badge variant={p.status==='error'?'destructive':p.status==='done'?'success':p.status==='running'?'warning':'outline'}>{p.status || 'pending'}</Badge>
									{dur != null && p.status !== 'pending' && (
										<span className="text-[10px] text-slate-500">{formatDuration(dur/1000)}</span>
									)}
								</div>
								<div className="text-[10px] text-slate-500 mt-0.5 space-x-2">
									{started && <span>Start: {started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' })}</span>}
									{ended && <span>End: {ended.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' })}</span>}
									{p.error && <span className="text-red-400">{p.error}</span>}
								</div>
								{p.status === 'running' && (
									<div className="h-1 bg-slate-700 rounded mt-2 overflow-hidden">
										<div className="h-full bg-amber-400 animate-pulse w-1/3" />
									</div>
								)}
							</div>
						</li>
					)
				})}
			</ol>
		</div>
	)
}
