// Simple accessible spinner for loading states.
export function Spinner({ size = 16, className = '' }) {
  const dim = typeof size === 'number' ? `${size}px` : size;
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent align-middle ${className}`}
      style={{ width: dim, height: dim }}
      aria-hidden="true"
    />
  );
}
