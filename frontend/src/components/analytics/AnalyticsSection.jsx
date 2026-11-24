import { motion } from 'framer-motion'
import { useState } from 'react'
import { useLeadAnalyticsQuery } from '../../hooks/useLeads'
import { bucketTimeline, plural } from '../../lib/chart'
import { ErrorState } from '../ui/ErrorState'
import { Skeleton } from '../ui/Skeleton'
import { ActivityHeatmap } from './ActivityHeatmap'
import { ChartCard, DataTable } from './ChartCard'
import { StatusDonut } from './StatusDonut'
import { TrendChart } from './TrendChart'

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]

function RangePicker({ value, onChange }) {
  return (
    <div
      role="group"
      aria-label="Time range for charts"
      className="flex gap-1 rounded-xl bg-surface-muted p-1 ring-1 ring-line ring-inset"
    >
      {RANGES.map((range) => {
        const active = value === range.days
        return (
          <button
            key={range.days}
            type="button"
            onClick={() => onChange(range.days)}
            aria-pressed={active}
            className={`relative rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              active ? 'text-ink' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId="range-pill"
                className="absolute inset-0 rounded-lg bg-white ring-1 ring-line"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{range.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function busiestSlot(heatmap) {
  let best = null
  heatmap.values.forEach((row, d) =>
    row.forEach((value, s) => {
      if (value > 0 && (!best || value > best.value)) best = { value, day: heatmap.days[d], slot: heatmap.slots[s] }
    }),
  )
  return best
}

function ChartsSkeleton() {
  return (
    <div role="status" className="grid gap-4 lg:grid-cols-3">
      <span className="sr-only">Loading charts…</span>
      <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
    </div>
  )
}

/** Charts block with its own date-range filter, which scopes all three charts. */
export function AnalyticsSection() {
  const [days, setDays] = useState(30)
  const query = useLeadAnalyticsQuery(days)
  const { data, isPending, isError, error, refetch, isRefetching, isPlaceholderData } = query

  let body
  if (isPending) {
    body = <ChartsSkeleton />
  } else if (isError && !data) {
    body = (
      <ErrorState compact title="Couldn't load charts" error={error} onRetry={() => refetch()} retrying={isRefetching} />
    )
  } else {
    const points = bucketTimeline(data.timeline, data.range_days)
    const weekly = data.range_days > 31
    const busiest = busiestSlot(data.heatmap)
    const average = (data.total / data.range_days) * 7

    body = (
      // Refetch keeps the frame: previous charts stay, dimmed, while the new range loads.
      <div className={`grid gap-4 transition-opacity lg:grid-cols-3 ${isPlaceholderData ? 'opacity-60' : ''}`}>
        <ChartCard
          className="lg:col-span-2"
          title={weekly ? 'New leads per week' : 'New leads per day'}
          description={`Enquiries received in the last ${days} days`}
          headline={
            <p className="text-sm text-ink-soft">
              <span className="text-2xl font-extrabold text-ink tabular-nums">{data.total}</span>{' '}
              {data.total === 1 ? 'lead' : 'leads'} · about{' '}
              <span className="font-semibold text-ink">{average.toFixed(1)}</span> per week
            </p>
          }
          renderChart={() => <TrendChart points={points} />}
          renderTable={() => (
            <DataTable
              caption="Leads created over time"
              columns={[weekly ? 'Week' : 'Day', 'Leads']}
              rows={[...points].reverse().map((p) => [p.label, p.total])}
            />
          )}
        />

        <ChartCard
          title="Status split"
          description={`Leads from the last ${days} days by current status`}
          renderChart={() => <StatusDonut slices={data.status_breakdown} total={data.total} />}
          renderTable={() => (
            <DataTable
              caption="Leads by status"
              columns={['Status', 'Leads', 'Share']}
              rows={data.status_breakdown.map((s) => [
                s.status,
                s.count,
                `${data.total ? Math.round((s.count / data.total) * 100) : 0}%`,
              ])}
            />
          )}
        />

        <ChartCard
          className="lg:col-span-3"
          title="When enquiries arrive"
          description="Leads by weekday and time of day (your local time)"
          headline={
            busiest && (
              <p className="text-sm text-ink-soft">
                Busiest: <span className="font-semibold text-ink">{busiest.day}, {busiest.slot}</span> with{' '}
                {plural(busiest.value, 'lead')}
              </p>
            )
          }
          renderChart={() => <ActivityHeatmap heatmap={data.heatmap} />}
          renderTable={() => (
            <DataTable
              caption="Leads by weekday and time of day"
              columns={['Day', ...data.heatmap.slots]}
              rows={data.heatmap.days.map((day, d) => [day, ...data.heatmap.values[d]])}
            />
          )}
        />
      </div>
    )
  }

  return (
    <section aria-labelledby="analytics-heading" className="flex flex-col gap-5 sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="analytics-heading" className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-ink-soft sm:text-base">How leads have come in over the last {days} days.</p>
        </div>
        <RangePicker value={days} onChange={setDays} />
      </div>
      {isError && data && (
        <ErrorState compact title="Couldn't refresh charts" error={error} onRetry={() => refetch()} retrying={isRefetching} />
      )}
      {body}
    </section>
  )
}
