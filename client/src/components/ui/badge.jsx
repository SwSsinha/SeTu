export function Badge({ children, variant = 'default', className = '' }) {
  const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium';
  const styles = variant === 'destructive'
    ? 'bg-destructive text-destructive-foreground border-destructive'
    : variant === 'secondary'
      ? 'bg-secondary text-secondary-foreground border-secondary'
      : 'bg-accent text-accent-foreground border-accent';
  return <span className={`${base} ${styles} ${className}`}>{children}</span>;
}
