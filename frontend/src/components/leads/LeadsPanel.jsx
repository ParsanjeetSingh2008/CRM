import { Inbox, LoaderCircle, Plus, SearchX, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useLoadSampleLeads } from '../../hooks/useLeads'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Skeleton } from '../ui/Skeleton'
import { LeadCardList } from './LeadCardList'
import { LeadsTable } from './LeadsTable'
import { LeadsToolbar } from './LeadsToolbar'
import { Pagination } from './Pagination'

function LoadingRows() {
  return (
    <div role="status" aria-live="polite">
      <p className="flex items-center gap-2 px-5 pt-5 text-sm font-medium text-ink-soft">
        <LoaderCircle className="size-4 animate-spin text-brand" aria-hidden="true" />
        Loading leads…
      </p>
      <div className="divide-y divide-line">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="hidden h-7 w-24 rounded-full sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The leads card: toolbar + one of loading / error / empty / results.
 * All data comes in as props; App owns the state.
 */
export function LeadsPanel({ query, filters, onFiltersChange, stats, onAdd, onOpen, onEdit, onDelete, onStatusChange }) {
  const sampleLeads = useLoadSampleLeads()
  const { data, isPending, isError, error, refetch, isRefetching, isPlaceholderData, isFetching } = query
  const hasFilters = Boolean(filters.search.trim() || filters.status)

  let body
  if (isPending) {
    body = <LoadingRows />
  } else if (isError && !data) {
    body = (
      <ErrorState
        title="Couldn't load leads"
        error={error}
        onRetry={() => refetch()}
        retrying={isRefetching}
      />
    )
  } else if (data.total === 0 && hasFilters) {
    body = (
      <EmptyState
        icon={SearchX}
        title="No matching leads"
        message="No leads match your search or filter. Try a different name, email or status."
        action={
          <Button
            variant="secondary"
            onClick={() => onFiltersChange({ search: '', status: '', page: 1 })}
          >
            Clear filters
          </Button>
        }
      />
    )
  } else if (data.total === 0) {
    body = (
      <EmptyState
        icon={Inbox}
        title="No leads yet"
        message="When someone enquires about your business, add them here. Or load sample leads to explore the dashboard."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={onAdd}>
              <Plus className="size-4" aria-hidden="true" />
              Add your first lead
            </Button>
            <Button
              variant="secondary"
              loading={sampleLeads.isPending}
              onClick={() =>
                sampleLeads.mutate(undefined, {
                  onSuccess: ({ added }) => toast.success(`Loaded ${added} sample leads`),
                  onError: (error) => toast.error("Couldn't load sample leads", { description: error.message }),
                })
              }
            >
              {!sampleLeads.isPending && <Sparkles className="size-4 text-new" aria-hidden="true" />}
              Load sample leads
            </Button>
          </div>
        }
      />
    )
  } else {
    const listProps = { leads: data.items, onOpen, onEdit, onDelete, onStatusChange }
    body = (
      <>
        <div
          className={`transition-opacity duration-200 ${isPlaceholderData ? 'opacity-60' : ''}`}
          aria-busy={isFetching}
        >
          <LeadsTable {...listProps} />
          <LeadCardList {...listProps} />
        </div>
        <Pagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          pageSize={data.page_size}
          onPageChange={(page) => onFiltersChange({ page })}
        />
      </>
    )
  }

  return (
    <section
      aria-labelledby="leads-heading"
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-line"
    >
      <h2 id="leads-heading" className="sr-only">
        Leads
      </h2>
      <LeadsToolbar
        search={filters.search}
        onSearchChange={(search) => onFiltersChange({ search, page: 1 })}
        status={filters.status}
        onStatusChange={(status) => onFiltersChange({ status, page: 1 })}
        sort={filters.sort}
        onSortChange={(sort) => onFiltersChange({ sort, page: 1 })}
        stats={stats}
      />
      {isError && data && (
        <div className="px-4 pt-4 sm:px-5">
          <ErrorState
            compact
            title="Couldn't refresh leads"
            error={error}
            onRetry={() => refetch()}
            retrying={isRefetching}
          />
        </div>
      )}
      {body}
    </section>
  )
}
