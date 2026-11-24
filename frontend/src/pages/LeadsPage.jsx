import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useLeadActions } from '../components/leads/LeadActionsProvider'
import { LeadsPanel } from '../components/leads/LeadsPanel'
import { Button } from '../components/ui/Button'
import { useDebounce } from '../hooks/useDebounce'
import { useLeadStatsQuery, useLeadsQuery } from '../hooks/useLeads'
import { usePageTitle } from '../hooks/usePageTitle'
import { PAGE_SIZE, STATUS_LIST } from '../lib/constants'

/** Every lead: search, filter, sort, paginate, and manage. */
export default function LeadsPage() {
  usePageTitle('Leads')
  const [searchParams, setSearchParams] = useSearchParams()
  const { openCreate, openProfile, openEdit, openDelete, changeStatus } = useLeadActions()

  // The status filter lives in the URL (/leads?status=New) so dashboard cards can link to it.
  const urlStatus = searchParams.get('status')
  const status = STATUS_LIST.includes(urlStatus) ? urlStatus : ''
  const [local, setLocal] = useState({ search: '', sort: 'newest', page: 1 })
  const filters = { ...local, status }

  const updateFilters = ({ status: nextStatus, ...rest }) => {
    if (nextStatus !== undefined) {
      setSearchParams(nextStatus ? { status: nextStatus } : {}, { replace: true })
    }
    if (Object.keys(rest).length) setLocal((current) => ({ ...current, ...rest }))
  }

  const debouncedSearch = useDebounce(local.search.trim(), 300)
  const leadsQuery = useLeadsQuery({
    search: debouncedSearch,
    status,
    sort: local.sort,
    page: local.page,
    pageSize: PAGE_SIZE,
  })
  const statsQuery = useLeadStatsQuery()

  // If the current page no longer exists (e.g. its last lead was deleted), step back.
  const pages = leadsQuery.data?.pages
  useEffect(() => {
    if (leadsQuery.isPlaceholderData || pages === undefined) return
    const lastPage = Math.max(pages, 1)
    if (local.page > lastPage) setLocal((current) => ({ ...current, page: lastPage }))
  }, [pages, local.page, leadsQuery.isPlaceholderData])

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Leads</h1>
          <p className="mt-1 text-sm text-ink-soft sm:text-base">
            {statsQuery.data ? `${statsQuery.data.total} enquiries. ` : ''}Search, filter and update them here.
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="size-4" aria-hidden="true" />
          Add lead
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <LeadsPanel
          query={leadsQuery}
          filters={filters}
          onFiltersChange={updateFilters}
          stats={statsQuery.data}
          onAdd={openCreate}
          onOpen={openProfile}
          onEdit={openEdit}
          onDelete={openDelete}
          onStatusChange={changeStatus}
        />
      </motion.div>
    </div>
  )
}
