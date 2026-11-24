import { AnimatePresence, motion } from 'framer-motion'
import { formatDateTime, timeAgo } from '../../lib/format'
import { listItem } from '../../lib/motion'
import { LeadActions } from './LeadActions'
import { LeadAvatar } from './LeadAvatar'
import { StatusSelect } from './StatusSelect'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-faint uppercase'

/** Desktop/tablet view (md and up). Rows animate in, out and into new positions. */
export function LeadsTable({ leads, onOpen, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="hidden md:block">
      <table className="w-full table-fixed">
        <caption className="sr-only">Leads</caption>
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[30%]" />
          <col className="w-[16%]" />
          <col className="w-[13%]" />
          <col className="w-[11%]" />
        </colgroup>
        <thead className="border-b border-line bg-surface-muted">
          <tr>
            <th scope="col" className={`${th} pl-5`}>Lead</th>
            <th scope="col" className={th}>Contact</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>Added</th>
            <th scope="col" className={`${th} pr-5 text-right`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {/* No popLayout here: absolutely-positioned exiting <tr>s break table layout. */}
          <AnimatePresence initial={true}>
            {leads.map((lead, index) => (
              <motion.tr
                key={lead.id}
                layout="position"
                variants={listItem}
                custom={index}
                initial="initial"
                animate="animate"
                exit="exit"
                className="group transition-colors hover:bg-surface-muted/70"
              >
                <td className="py-3.5 pr-4 pl-5">
                  <button
                    type="button"
                    onClick={() => onOpen(lead)}
                    className="group/lead flex w-full min-w-0 items-center gap-3 rounded-xl text-left"
                    aria-label={`Open profile for ${lead.name}`}
                  >
                    <LeadAvatar lead={lead} className="size-10 transition-transform group-hover/lead:scale-105" />
                    <span className="block min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink group-hover/lead:text-brand group-hover/lead:underline">
                        {lead.name}
                      </span>
                      <span className="block truncate text-sm text-ink-soft">{lead.business_name}</span>
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <a
                    href={`mailto:${lead.email}`}
                    className="block truncate text-sm text-ink hover:text-brand hover:underline"
                  >
                    {lead.email}
                  </a>
                  <a
                    href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
                    className="block truncate text-sm text-ink-soft hover:text-brand"
                  >
                    {lead.phone}
                  </a>
                </td>
                <td className="px-4 py-3.5">
                  <StatusSelect lead={lead} onChange={onStatusChange} />
                </td>
                <td className="px-4 py-3.5 text-sm text-ink-soft">
                  <time dateTime={lead.created_at} title={formatDateTime(lead.created_at)}>
                    {timeAgo(lead.created_at)}
                  </time>
                </td>
                <td className="py-3.5 pr-5 pl-4">
                  <div className="flex justify-end">
                    <LeadActions lead={lead} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}
