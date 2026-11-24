export const PAGE_SIZE = 10

export const STATUS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  CONVERTED: 'Converted',
}

export const STATUS_LIST = [STATUS.NEW, STATUS.CONTACTED, STATUS.CONVERTED]

/**
 * Visual style per status. Class names are written out in full so Tailwind
 * can find them when it scans the source.
 */
export const STATUS_STYLES = {
  [STATUS.NEW]: {
    soft: 'bg-new-soft',
    pill: 'bg-new-soft text-new ring-new/20',
    dot: 'bg-new',
    bar: 'bg-new',
  },
  [STATUS.CONTACTED]: {
    soft: 'bg-contacted-soft',
    pill: 'bg-contacted-soft text-contacted ring-contacted-fill/30',
    dot: 'bg-contacted-fill',
    bar: 'bg-contacted-fill',
  },
  [STATUS.CONVERTED]: {
    soft: 'bg-converted-soft',
    pill: 'bg-converted-soft text-converted ring-converted-fill/25',
    dot: 'bg-converted-fill',
    bar: 'bg-converted-fill',
  },
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
]

/** Avatar colours, picked by lead id so a lead keeps the same colour. */
export const AVATAR_COLORS = [
  'bg-brand-soft text-brand',
  'bg-new-soft text-new',
  'bg-contacted-soft text-contacted',
  'bg-converted-soft text-converted',
]
