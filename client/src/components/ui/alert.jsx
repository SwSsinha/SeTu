// Minimal alert component (variant: default | destructive)
import clsx from 'clsx';

export function Alert({ title, children, variant = 'default', onClose, actions }) {
  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      className={clsx(
        'rounded-md border px-4 py-3 text-sm flex flex-col gap-2',
        variant === 'destructive' && 'border-destructive/50 text-destructive bg-destructive/10'
      )}
    >
      {title && <p className="font-medium leading-none">{title}</p>}
      {children && <div className="text-xs opacity-90">{children}</div>}
      {(actions?.length || onClose) && (
        <div className="flex gap-2 pt-1">
          {actions?.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={clsx(
                'px-2 py-1 rounded text-xs border',
                a.variant === 'secondary' && 'bg-secondary text-secondary-foreground',
                a.variant === 'outline' && 'bg-background',
                a.variant === 'destructive' && 'bg-destructive text-destructive-foreground'
              )}
            >
              {a.label}
            </button>
          ))}
          {onClose && (
            <button type="button" onClick={onClose} className="ml-auto text-xs underline">
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}
