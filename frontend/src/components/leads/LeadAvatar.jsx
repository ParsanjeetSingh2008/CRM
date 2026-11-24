import { AVATAR_COLORS } from '../../lib/constants'
import { initials } from '../../lib/format'

export function LeadAvatar({ lead, className = 'size-10' }) {
  const color = AVATAR_COLORS[lead.id % AVATAR_COLORS.length]
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl text-sm font-bold ${color} ${className}`}
      aria-hidden="true"
    >
      {initials(lead.name)}
    </span>
  )
}
