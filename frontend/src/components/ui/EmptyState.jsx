import { motion } from 'framer-motion'

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col items-center px-6 py-16 text-center"
    >
      <div className="relative mb-5" aria-hidden="true">
        <span className="absolute -top-2 -left-3 size-4 rounded-full bg-new/80" />
        <span className="absolute -right-3 -bottom-1 size-3 rounded-full bg-contacted-fill" />
        <span className="absolute -top-1 -right-4 size-2.5 rounded-full bg-converted-fill" />
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Icon className="size-7" />
        </div>
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}
