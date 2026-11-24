import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  Building2,
  CalendarClock,
  CalendarPlus,
  Check,
  Copy,
  Mail,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useLeadQuery } from '../../hooks/useLeads'
import { STATUS_LIST, STATUS_STYLES } from '../../lib/constants'
import { formatDateTime, timeAgo } from '../../lib/format'
import { useClive } from '../clive/CliveProvider'
import { Button } from '../ui/Button'
import { LeadAvatar } from './LeadAvatar'
import { StatusSelect } from './StatusSelect'

/** New -> Contacted -> Converted, with the current stage highlighted. */
function StatusJourney({ status }) {
  const current = STATUS_LIST.indexOf(status)
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label={`Stage ${current + 1} of 3: ${status}`}>
      {STATUS_LIST.map((step, i) => {
        const reached = i <= current
        return (
          <li key={step} className="flex flex-col gap-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={`h-full rounded-full ${STATUS_STYLES[step].bar}`}
                initial={{ width: 0 }}
                animate={{ width: reached ? '100%' : '0%' }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: 'easeOut' }}
              />
            </div>
            <span className={`flex items-center gap-1 text-xs font-semibold ${reached ? 'text-ink' : 'text-ink-faint'}`}>
              {reached && <Check className="size-3.5" aria-hidden="true" />}
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-soft" aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-ink-faint">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium break-words text-ink">{children}</dd>
      </div>
    </div>
  )
}

const quickAction =
  'flex flex-col items-center gap-1.5 rounded-xl bg-white px-2 py-3 text-xs font-semibold text-ink ring-1 ring-line transition-colors hover:bg-surface-muted'

/**
 * The lead's profile, opened by clicking a lead. `lead` stays set while the
 * panel animates closed; fresh data is loaded with useLeadQuery.
 */
export function LeadProfileDrawer({ open, lead: initialLead, onOpenChange, onEdit, onDelete, onStatusChange }) {
  const { data: lead, error } = useLeadQuery(initialLead)
  const clive = useClive()

  // The lead was deleted elsewhere (or no longer exists): close the panel.
  useEffect(() => {
    if (open && error?.status === 404) onOpenChange(false)
  }, [open, error, onOpenChange])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(lead.email)
      toast.success('Email copied')
    } catch {
      toast.error("Couldn't copy. Select the email and copy it manually.")
    }
  }

  const askClive = () => {
    onOpenChange(false)
    clive.ask(`Give me a quick summary of ${lead.name} from ${lead.business_name} and a suggested next step.`)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && lead && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-ink/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.aside
                className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white focus:outline-none sm:max-w-md sm:rounded-l-3xl"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 36 }}
              >
                {/* Header band tinted with the lead's status colour */}
                <div className={`relative px-6 pt-6 pb-5 sm:rounded-tl-3xl ${STATUS_STYLES[lead.status].soft}`}>
                  <Dialog.Close
                    className="absolute top-4 right-4 rounded-lg p-2 text-ink-soft transition-colors hover:bg-white/70 hover:text-ink"
                    aria-label="Close profile"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </Dialog.Close>
                  <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
                    <LeadAvatar lead={lead} className="size-16 rounded-2xl text-xl ring-4 ring-white" />
                  </motion.div>
                  <Dialog.Title className="mt-4 text-xl font-extrabold tracking-tight text-ink">{lead.name}</Dialog.Title>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
                    <Building2 className="size-4" aria-hidden="true" />
                    {lead.business_name}
                  </p>
                  <div className="mt-4">
                    <StatusSelect lead={lead} onChange={onStatusChange} />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <div className="grid grid-cols-3 gap-2">
                    <a href={`mailto:${lead.email}`} className={quickAction}>
                      <Mail className="size-4 text-brand" aria-hidden="true" />
                      Email
                    </a>
                    <button type="button" onClick={copyEmail} className={quickAction}>
                      <Copy className="size-4 text-contacted" aria-hidden="true" />
                      Copy
                    </button>
                    <button type="button" onClick={askClive} className={quickAction}>
                      <Bot className="size-4 text-converted" aria-hidden="true" />
                      Ask Clive
                    </button>
                  </div>

                  <section className="mt-6" aria-labelledby="journey-heading">
                    <h3 id="journey-heading" className="mb-3 text-xs font-bold tracking-wide text-ink-faint uppercase">
                      Pipeline stage
                    </h3>
                    <StatusJourney status={lead.status} />
                  </section>

                  <section className="mt-6" aria-labelledby="details-heading">
                    <h3 id="details-heading" className="text-xs font-bold tracking-wide text-ink-faint uppercase">
                      Details
                    </h3>
                    <dl className="divide-y divide-line">
                      <DetailRow icon={Mail} label="Email">{lead.email}</DetailRow>
                      <DetailRow icon={Phone} label="Phone">{lead.phone}</DetailRow>
                      <DetailRow icon={CalendarPlus} label="Added">
                        {formatDateTime(lead.created_at)} <span className="text-ink-faint">· {timeAgo(lead.created_at)}</span>
                      </DetailRow>
                      <DetailRow icon={CalendarClock} label="Last updated">
                        {formatDateTime(lead.updated_at)} <span className="text-ink-faint">· {timeAgo(lead.updated_at)}</span>
                      </DetailRow>
                    </dl>
                  </section>

                  <section className="mt-4" aria-labelledby="notes-heading">
                    <h3 id="notes-heading" className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-ink-faint uppercase">
                      <StickyNote className="size-3.5" aria-hidden="true" />
                      Notes
                    </h3>
                    {lead.notes ? (
                      <p className="rounded-xl bg-contacted-soft px-4 py-3 text-sm whitespace-pre-wrap text-ink">{lead.notes}</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEdit(lead)}
                        className="w-full rounded-xl border border-dashed border-line px-4 py-3 text-left text-sm text-ink-faint transition-colors hover:border-brand hover:text-brand"
                      >
                        No notes yet. Add one…
                      </button>
                    )}
                  </section>
                </div>

                <div className="flex gap-2 border-t border-line px-6 py-4">
                  <Button variant="secondary" className="flex-1" onClick={() => onEdit(lead)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button variant="secondary" className="flex-1 text-danger" onClick={() => onDelete(lead)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
