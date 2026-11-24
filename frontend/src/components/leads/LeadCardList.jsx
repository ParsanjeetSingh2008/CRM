import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Phone } from 'lucide-react'
import { formatDateTime, timeAgo } from '../../lib/format'
import { listItem } from '../../lib/motion'
import { LeadActions } from './LeadActions'
import { LeadAvatar } from './LeadAvatar'
import { StatusSelect } from './StatusSelect'

/** Mobile view (below md): one card per lead instead of a wide table. */
export function LeadCardList({ leads, onOpen, onEdit, onDelete, onStatusChange }) {
  return (
    <ul className="divide-y divide-line md:hidden" aria-label="Leads">
      <AnimatePresence initial={true} mode="popLayout">
        {leads.map((lead, index) => (
          <motion.li
            key={lead.id}
            layout="position"
            variants={listItem}
            custom={index}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-3 px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onOpen(lead)}
                className="flex min-w-0 flex-1 items-start gap-3 rounded-xl text-left"
                aria-label={`Open profile for ${lead.name}`}
              >
                <LeadAvatar lead={lead} />
                <span className="block min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{lead.name}</span>
                  <span className="block truncate text-sm text-ink-soft">{lead.business_name}</span>
                </span>
              </button>
              <LeadActions lead={lead} onEdit={onEdit} onDelete={onDelete} />
            </div>

            <div className="flex flex-col gap-1.5 text-sm">
              <a
                href={`mailto:${lead.email}`}
                className="flex min-w-0 items-center gap-2 text-ink hover:text-brand"
              >
                <Mail className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
                <span className="truncate">{lead.email}</span>
              </a>
              <a
                href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
                className="flex items-center gap-2 text-ink-soft hover:text-brand"
              >
                <Phone className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
                {lead.phone}
              </a>
            </div>

            <div className="flex items-center justify-between gap-3">
              <StatusSelect lead={lead} onChange={onStatusChange} />
              <time
                dateTime={lead.created_at}
                title={formatDateTime(lead.created_at)}
                className="text-xs text-ink-faint"
              >
                Added {timeAgo(lead.created_at)}
              </time>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}
