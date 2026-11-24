/**
 * KINETIQ mark: a geometric "K" on a brand-blue tile. The lower arm is lighter
 * (motion), and the orange dot at its tip stands for a converted lead.
 * Kept in sync with public/favicon.svg.
 */
export function LogoMark({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <rect x="8.5" y="8" width="4" height="16" rx="2" fill="#fff" />
      <path d="M14 16 L21 9" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 16 L20 22" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />
      <circle cx="23" cy="23" r="2.5" className="fill-converted-fill" />
    </svg>
  )
}
