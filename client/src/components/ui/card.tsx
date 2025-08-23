import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-slate-700 bg-slate-900/70 backdrop-blur-sm shadow-sm p-6 w-full max-w-xl',
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

export { Card }
