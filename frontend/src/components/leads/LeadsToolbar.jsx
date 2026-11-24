import { ArrowUpDown, ChevronDown, Search, X } from 'lucide-react'
import { SORT_OPTIONS } from '../../lib/constants'
import { StatusFilter } from './StatusFilter'

export function LeadsToolbar({ search, onSearchChange, status, onStatusChange, sort, onSortChange, stats }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 sm:p-5 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <label htmlFor="lead-search" className="sr-only">
          Search leads by name or email
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
        <input
          id="lead-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name or email…"
          autoComplete="off"
          maxLength={100}
          className="h-11 w-full rounded-xl bg-white pr-10 pl-10 text-sm ring-1 ring-line ring-inset placeholder:text-ink-faint focus:ring-2 focus:ring-brand focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-muted hover:text-ink"
            aria-label="Clear search"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <StatusFilter value={status} onChange={onStatusChange} stats={stats} />

        <div className="relative">
          <label htmlFor="lead-sort" className="sr-only">
            Sort leads
          </label>
          <ArrowUpDown
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <select
            id="lead-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-11 w-full appearance-none rounded-xl bg-white pr-9 pl-9 text-sm font-medium text-ink ring-1 ring-line ring-inset focus:ring-2 focus:ring-brand focus:outline-none sm:w-auto"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}
