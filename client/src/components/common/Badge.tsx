import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className }: Props) {
  const styles: Record<string, string> = {
    default: 'bg-slate-800 text-slate-100',
    success: 'bg-green-600/20 text-green-300 border border-green-600/40',
    warning: 'bg-amber-600/20 text-amber-300 border border-amber-600/40',
    destructive: 'bg-red-700/30 text-red-300 border border-red-600/50',
    outline: 'border border-slate-600 text-slate-300',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-1 tracking-wide uppercase', styles[variant], className)}>
      {children}
    </span>
  )
}
