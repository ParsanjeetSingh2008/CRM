import { useRef, useState } from 'react'
import { STATUS_STYLES } from '../../lib/constants'
import { gsap, prefersReducedMotion, useGSAP } from '../../lib/motion'

// Hex values match the theme tokens in styles/index.css (validated as a palette).
const SLICE_COLORS = { New: '#7c3aed', Contacted: '#f59e0b', Converted: '#ea580c' }

const SIZE = 184
const STROKE = 24
const RADIUS = (SIZE - STROKE) / 2 - 4
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 3 // surface gap between slices

/**
 * Donut (pie) of how leads in the range split across statuses. Each slice is
 * a circle stroke with a dash pattern; GSAP sweeps the dashes in. Hovering a
 * slice or its legend row shows that status in the centre.
 */
export function StatusDonut({ slices, total }) {
  const svgRef = useRef(null)
  const [hovered, setHovered] = useState(null)

  let offset = 0
  const arcs = slices.map((slice) => {
    const length = total ? (slice.count / total) * CIRCUMFERENCE : 0
    const visible = Math.max(length - (slices.filter((s) => s.count).length > 1 ? GAP : 0), 0)
    const arc = { ...slice, start: offset, length, visible }
    offset += length
    return arc
  })

  const dataKey = slices.map((s) => s.count).join('-')

  useGSAP(
    () => {
      if (!total || prefersReducedMotion()) return
      gsap.from('[data-slice]', {
        attr: { 'stroke-dasharray': `0 ${CIRCUMFERENCE}` },
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
      })
      gsap.from('[data-donut-center]', { opacity: 0, scale: 0.85, duration: 0.5, delay: 0.3, transformOrigin: '50% 50%' })
    },
    { scope: svgRef, dependencies: [dataKey] },
  )

  const focus = hovered ? arcs.find((a) => a.status === hovered) : null
  const percent = (count) => (total ? Math.round((count / total) * 100) : 0)

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={arcs.map((a) => `${a.status}: ${a.count} (${percent(a.count)}%)`).join(', ')}
        className="shrink-0"
      >
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            className="stroke-slate-100"
            strokeWidth={STROKE}
          />
          {arcs.map(
            (arc) =>
              arc.count > 0 && (
                <circle
                  key={arc.status}
                  data-slice
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={SLICE_COLORS[arc.status]}
                  strokeWidth={hovered === arc.status ? STROKE + 6 : STROKE}
                  strokeDasharray={`${arc.visible} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-arc.start}
                  opacity={hovered && hovered !== arc.status ? 0.35 : 1}
                  style={{ transition: 'stroke-width 150ms, opacity 150ms' }}
                  onPointerEnter={() => setHovered(arc.status)}
                  onPointerLeave={() => setHovered(null)}
                />
              ),
          )}
        </g>
        <g data-donut-center className="pointer-events-none">
          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            className="fill-ink text-[28px] font-extrabold tabular-nums"
          >
            {focus ? focus.count : total}
          </text>
          <text x="50%" y="60%" textAnchor="middle" className="fill-ink-soft text-[12px] font-medium">
            {focus ? `${focus.status} · ${percent(focus.count)}%` : total === 1 ? 'lead' : 'leads'}
          </text>
        </g>
      </svg>

      <ul className="flex w-full flex-col gap-1">
        {arcs.map((arc) => (
          <li key={arc.status}>
            <button
              type="button"
              onPointerEnter={() => setHovered(arc.status)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(arc.status)}
              onBlur={() => setHovered(null)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                hovered === arc.status ? 'bg-surface-muted' : ''
              }`}
            >
              <span className={`size-3 shrink-0 rounded-[4px] ${STATUS_STYLES[arc.status].bar}`} aria-hidden="true" />
              <span className="flex-1 font-semibold text-ink">{arc.status}</span>
              <span className="font-bold text-ink tabular-nums">{arc.count}</span>
              <span className="w-10 text-right text-xs text-ink-faint tabular-nums">
                {percent(arc.count)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
