/** Grey pulsing placeholder. A <span> so it is valid inside text and buttons. */
export function Skeleton({ className = '' }) {
  return (
    <span className={`block animate-pulse rounded-lg bg-slate-100 ${className}`} aria-hidden="true" />
  )
}
