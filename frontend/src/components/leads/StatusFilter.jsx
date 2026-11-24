import { motion } from 'framer-motion'
import { STATUS_LIST, STATUS_STYLES } from '../../lib/constants'

const COUNT_KEY = { '': 'total', New: 'new', Contacted: 'contacted', Converted: 'converted' }

/** Segmented status filter. The white "active" pill slides between options (Framer layoutId). */
export function StatusFilter({ value, onChange, stats }) {
  const options = [{ value: '', label: 'All' }, ...STATUS_LIST.map((s) => ({ value: s, label: s }))]

  return (
    <div
      role="group"
      aria-label="Filter leads by status"
      // 2x2 grid on phones so nothing scrolls sideways; one row from sm up.
      className="grid w-full grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1 ring-1 ring-line ring-inset sm:flex sm:w-auto"
    >
      {options.map((option) => {
        const active = value === option.value
        const count = stats?.[COUNT_KEY[option.value]]
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors sm:flex-none ${
              active ? 'text-ink' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId="status-filter-pill"
                className="absolute inset-0 rounded-lg bg-white ring-1 ring-line"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {option.value && (
              <span
                className={`relative size-2 rounded-full ${STATUS_STYLES[option.value].dot}`}
                aria-hidden="true"
              />
            )}
            <span className="relative">{option.label}</span>
            {count !== undefined && (
              <span className="relative text-xs font-medium text-ink-faint tabular-nums">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
