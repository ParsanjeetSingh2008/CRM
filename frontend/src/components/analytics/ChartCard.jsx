import { Table2, ChartColumn } from 'lucide-react'
import { useState } from 'react'

/**
 * Frame for one chart: title, optional headline, and a Chart/Table toggle.
 * The table view keeps every number reachable without hovering (and without
 * relying on colour), which is what the accessibility checklist asks for.
 */
export function ChartCard({ title, description, headline, className = '', renderChart, renderTable }) {
  const [showTable, setShowTable] = useState(false)

  return (
    <section className={`flex flex-col rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-ink-soft">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-soft ring-1 ring-line transition-colors ring-inset hover:bg-surface-muted hover:text-ink"
        >
          {showTable ? (
            <ChartColumn className="size-3.5" aria-hidden="true" />
          ) : (
            <Table2 className="size-3.5" aria-hidden="true" />
          )}
          {showTable ? 'Chart' : 'Table'}
        </button>
      </header>
      {headline && <div className="mt-3">{headline}</div>}
      <div className="mt-4 flex-1">{showTable ? renderTable() : renderChart()}</div>
    </section>
  )
}

/** Plain data table used by every chart's table view. */
export function DataTable({ caption, columns, rows }) {
  return (
    <div className="max-h-72 overflow-auto rounded-xl ring-1 ring-line">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-surface-muted">
          <tr>
            {columns.map((column, i) => (
              <th
                key={column}
                scope="col"
                className={`px-3 py-2 text-xs font-semibold text-ink-faint uppercase ${i ? 'text-right' : 'text-left'}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={`px-3 py-2 ${i ? 'text-right font-semibold text-ink tabular-nums' : 'text-ink-soft'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
