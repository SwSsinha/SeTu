import * as React from 'react'
import { cn } from '@/lib/utils'

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'w-full rounded-md border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-200 flex items-start gap-2',
        className,
      )}
      {...props}
    />
  ),
)
Alert.displayName = 'Alert'

const AlertTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn('font-medium leading-none tracking-tight', className)} {...props} />
)

const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-xs text-slate-400 mt-1', className)} {...props} />
)

export { Alert, AlertTitle, AlertDescription }
