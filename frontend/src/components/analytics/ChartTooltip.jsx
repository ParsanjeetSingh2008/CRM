import { AnimatePresence, motion } from 'framer-motion'

/**
 * Floating readout above a point. `x`/`y` are pixels inside the positioned
 * parent; it is clamped so it never spills past the card edges.
 * Value leads (strong), label follows (secondary).
 */
export function ChartTooltip({ visible, x, y, containerWidth, value, label, color }) {
  const half = 72
  const left = Math.min(Math.max(x, half), Math.max(containerWidth - half, half))

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 whitespace-nowrap text-white"
          style={{ left, top: y - 10 }}
        >
          <p className="flex items-center gap-2 text-sm font-bold">
            {color && <span className="h-0.5 w-3 rounded-full" style={{ background: color }} />}
            {value}
          </p>
          <p className="text-xs text-slate-300">{label}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
