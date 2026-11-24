import { Skeleton } from '../ui/Skeleton'
import { AnimatedNumber } from './AnimatedNumber'

const TONES = {
  brand: {
    chip: 'bg-brand text-white',
    accent: 'bg-brand',
    active: 'ring-2 ring-brand',
  },
  new: {
    chip: 'bg-new text-white',
    accent: 'bg-new',
    active: 'ring-2 ring-new',
  },
  contacted: {
    chip: 'bg-contacted-fill text-white',
    accent: 'bg-contacted-fill',
    active: 'ring-2 ring-contacted-fill',
  },
  converted: {
    chip: 'bg-converted-fill text-white',
    accent: 'bg-converted-fill',
    active: 'ring-2 ring-converted-fill',
  },
}

/**
 * One dashboard number. It is also a button: clicking it filters the leads
 * table to that status.
 */
export function StatCard({ label, value, caption, icon: Icon, tone, loading, active, onSelect }) {
  const styles = TONES[tone]

  return (
    <button
      type="button"
      data-stat-card
      onClick={onSelect}
      aria-pressed={active}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white p-4 text-left transition-shadow duration-200 sm:p-5 ${
        active ? styles.active : 'ring-1 ring-line hover:ring-slate-300'
      }`}
    >
      {/* Only phrasing elements (span) inside a <button>, to keep the HTML valid. */}
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase sm:text-sm sm:normal-case sm:tracking-normal">
          {label}
        </span>
        <span
          className={`flex size-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:-rotate-6 ${styles.chip}`}
          aria-hidden="true"
        >
          <Icon className="size-[18px]" />
        </span>
      </span>

      <span className="mt-3 block text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {loading ? (
          <Skeleton className="h-9 w-16 sm:h-10" />
        ) : value == null ? (
          // No data (request failed): a dash, never a misleading 0.
          <span className="text-ink-faint">—</span>
        ) : (
          <AnimatedNumber value={value} />
        )}
      </span>

      <span className="mt-1 block min-h-5 truncate text-xs text-ink-soft sm:text-sm">
        {loading ? <Skeleton className="mt-1 h-3 w-24" /> : caption}
      </span>

      <span
        className={`absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${styles.accent} ${active ? 'scale-x-100' : ''}`}
        aria-hidden="true"
      />
    </button>
  )
}
