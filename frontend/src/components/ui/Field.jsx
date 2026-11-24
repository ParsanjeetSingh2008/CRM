import { AnimatePresence, motion } from 'framer-motion'
import { useId } from 'react'

const controlBase =
  'w-full rounded-xl bg-white px-3.5 text-sm text-ink ring-1 ring-inset placeholder:text-ink-faint transition-shadow duration-150 focus:outline-none focus:ring-2'

export const controlClass = (hasError) =>
  `${controlBase} ${hasError ? 'ring-danger focus:ring-danger' : 'ring-line focus:ring-brand'}`

/**
 * Label + control + animated error message, wired together for screen readers
 * (aria-invalid and aria-describedby point at the error text).
 */
export function Field({ label, error, hint, optional, children }) {
  const id = useId()
  const messageId = `${id}-message`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-faint">(optional)</span>}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? messageId : undefined,
      })}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={messageId}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs font-medium text-danger"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p key="hint" id={messageId} className="text-xs text-ink-faint">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
