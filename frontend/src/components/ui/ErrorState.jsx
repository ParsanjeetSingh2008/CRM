import { motion } from 'framer-motion'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from './Button'

export function ErrorState({ title = 'Something went wrong', error, onRetry, retrying, compact }) {
  const message = error?.message || 'An unexpected error occurred.'

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        compact
          ? 'flex flex-col gap-3 rounded-2xl bg-danger-soft p-4 ring-1 ring-danger/20 sm:flex-row sm:items-center'
          : 'flex flex-col items-center px-6 py-16 text-center'
      }
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger ${compact ? 'size-10 bg-white' : 'mb-4 size-14'}`}
        aria-hidden="true"
      >
        <TriangleAlert className={compact ? 'size-5' : 'size-6'} />
      </div>
      <div className={compact ? 'flex-1' : ''}>
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          loading={retrying}
          className={compact ? '' : 'mt-5'}
        >
          {!retrying && <RefreshCw className="size-4" aria-hidden="true" />}
          Try again
        </Button>
      )}
    </motion.div>
  )
}
