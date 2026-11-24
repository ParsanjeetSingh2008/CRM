import { motion } from 'framer-motion'
import { ArrowRight, Inbox, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { useLeadsQuery } from '../../hooks/useLeads'
import { STATUS_STYLES } from '../../lib/constants'
import { timeAgo } from '../../lib/format'
import { listItem } from '../../lib/motion'
import { LeadAvatar } from '../leads/LeadAvatar'
import { useLeadActions } from '../leads/LeadActionsProvider'
import { Button } from '../ui/Button'
import { ErrorState } from '../ui/ErrorState'
import { Skeleton } from '../ui/Skeleton'

const RECENT = { search: '', status: '', sort: 'newest', page: 1, pageSize: 6 }

/** The newest leads, each opening its profile card. */
export function RecentLeads() {
  const { data, isPending, isError, error, refetch, isRefetching } = useLeadsQuery(RECENT)
  const { openProfile, openCreate } = useLeadActions()

  return (
    <section aria-labelledby="recent-heading" className="rounded-2xl bg-white ring-1 ring-line">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div>
          <h2 id="recent-heading" className="text-sm font-bold text-ink">
            Recent leads
          </h2>
          <p className="text-xs text-ink-soft">The latest enquiries. Click one to see its profile.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          Add lead
        </Button>
      </header>

      {isPending ? (
        <div role="status" className="divide-y divide-line">
          <span className="sr-only">Loading recent leads…</span>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="size-9 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-4">
          <ErrorState compact title="Couldn't load recent leads" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        </div>
      ) : data.items.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <Inbox className="size-8 text-brand" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-ink">No leads yet</p>
          <p className="mt-1 text-sm text-ink-soft">Add your first enquiry, or load sample leads on the Leads page.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {data.items.map((lead, index) => (
            <motion.li key={lead.id} variants={listItem} custom={index} initial="initial" animate="animate">
              <button
                type="button"
                onClick={() => openProfile(lead)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted sm:px-5"
                aria-label={`Open profile for ${lead.name}`}
              >
                <LeadAvatar lead={lead} className="size-9" />
                <span className="block min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{lead.name}</span>
                  <span className="block truncate text-xs text-ink-soft">{lead.business_name}</span>
                </span>
                <span
                  className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset sm:inline-flex ${STATUS_STYLES[lead.status].pill}`}
                >
                  <span className={`size-1.5 rounded-full ${STATUS_STYLES[lead.status].dot}`} aria-hidden="true" />
                  {lead.status}
                </span>
                <span className="w-20 shrink-0 text-right text-xs text-ink-faint">{timeAgo(lead.created_at)}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <footer className="border-t border-line px-4 py-3 sm:px-5">
        <Link to="/leads" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
          View all leads
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </footer>
    </section>
  )
}
