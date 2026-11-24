import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { STATUS_LIST, STATUS_STYLES } from '../../lib/constants'

/**
 * A native <select> styled as a coloured status pill. Native keeps it
 * keyboard- and mobile-friendly; changing it updates the lead immediately.
 */
export function StatusSelect({ lead, onChange }) {
  const styles = STATUS_STYLES[lead.status]

  return (
    <motion.div
      key={lead.status}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className="relative inline-flex"
    >
      <span
        className={`pointer-events-none absolute top-1/2 left-2.5 size-2 -translate-y-1/2 rounded-full ${styles.dot}`}
        aria-hidden="true"
      />
      <select
        value={lead.status}
        onChange={(event) => onChange(lead, event.target.value)}
        aria-label={`Status for ${lead.name}`}
        className={`appearance-none rounded-full py-1.5 pr-7 pl-6 text-xs font-bold ring-1 ring-inset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${styles.pill}`}
      >
        {STATUS_LIST.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-70"
        aria-hidden="true"
      />
    </motion.div>
  )
}
