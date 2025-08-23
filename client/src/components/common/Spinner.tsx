interface SpinnerProps { size?: number; className?: string }
export function Spinner({ size = 16, className = '' }: SpinnerProps) {
  return (
    <span
      className={"inline-block border-2 border-slate-400 border-t-transparent rounded-full animate-spin " + className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}
