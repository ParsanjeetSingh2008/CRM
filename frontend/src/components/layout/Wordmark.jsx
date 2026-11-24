import { LogoMark } from './LogoMark'

export const APP_NAME = 'KINETIQ'

/** Logo + "KINETIQ" wordmark (the "IQ" in brand blue). */
export function Wordmark({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="text-lg font-extrabold tracking-wide text-ink">
        KINET<span className="text-brand">IQ</span>
      </span>
    </span>
  )
}
