import { useRef, useState } from 'react'
import { useElementWidth } from '../../hooks/useElementWidth'
import { labelIndices, monotonePath, niceMax, plural } from '../../lib/chart'
import { gsap, prefersReducedMotion, useGSAP } from '../../lib/motion'
import { ChartTooltip } from './ChartTooltip'

const HEIGHT = 220
const MARGIN = { top: 12, right: 12, bottom: 28, left: 30 }
const TICKS = 4
const LINE_COLOR = '#2563eb'

/**
 * Area/line graph of leads created over time (single series, so no legend:
 * the card title names it). Hover or arrow keys move a crosshair that snaps
 * to the nearest point.
 */
export function TrendChart({ points }) {
  const [wrapperRef, width] = useElementWidth()
  const svgRef = useRef(null)
  const [active, setActive] = useState(null)

  const innerW = Math.max(width - MARGIN.left - MARGIN.right, 0)
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom
  const top = niceMax(Math.max(...points.map((p) => p.total), 0), TICKS)
  const n = points.length

  const x = (i) => MARGIN.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v) => MARGIN.top + innerH - (v / top) * innerH

  const line = monotonePath(points.map((p, i) => ({ x: x(i), y: y(p.total) })))
  const area = `${line}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`
  const dataKey = points.map((p) => `${p.key}:${p.total}`).join('|')

  // Draw the line from left to right, then fade the area in under it.
  useGSAP(
    () => {
      if (!width || prefersReducedMotion()) return
      const path = svgRef.current.querySelector('[data-line]')
      const length = path.getTotalLength()
      gsap
        .timeline()
        .fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: 'power2.inOut',
          clearProps: 'strokeDasharray,strokeDashoffset',
        })
        .fromTo('[data-area]', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.5')
    },
    { scope: svgRef, dependencies: [dataKey, width > 0] },
  )

  const indexFromPointer = (event) => {
    const rect = svgRef.current.getBoundingClientRect()
    const relative = (event.clientX - rect.left - MARGIN.left) / (innerW || 1)
    return Math.min(n - 1, Math.max(0, Math.round(relative * (n - 1))))
  }

  const onKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    setActive((current) => {
      const i = current ?? n - 1
      if (event.key === 'Home') return 0
      if (event.key === 'End') return n - 1
      return Math.min(n - 1, Math.max(0, i + (event.key === 'ArrowRight' ? 1 : -1)))
    })
  }

  const point = active !== null ? points[active] : null
  const gridValues = Array.from({ length: TICKS + 1 }, (_, i) => (top / TICKS) * i)

  return (
    <div ref={wrapperRef} className="relative">
      {width > 0 && (
        <svg
          ref={svgRef}
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Leads created over time. Use left and right arrow keys to read each point.`}
          tabIndex={0}
          className="block touch-pan-y rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          onPointerMove={(e) => setActive(indexFromPointer(e))}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(n - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
        >
          {/* Recessive grid + y labels */}
          {gridValues.map((v) => (
            <g key={v}>
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + innerW}
                y1={y(v)}
                y2={y(v)}
                className={v === 0 ? 'stroke-slate-300' : 'stroke-slate-100'}
              />
              <text
                x={MARGIN.left - 8}
                y={y(v)}
                dy="0.32em"
                textAnchor="end"
                className="fill-ink-faint text-[11px] tabular-nums"
              >
                {v}
              </text>
            </g>
          ))}

          {/* X labels */}
          {labelIndices(n, width < 420 ? 3 : 5).map((i) => (
            <text
              key={points[i].key}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              className="fill-ink-faint text-[11px]"
            >
              {points[i].shortLabel ?? points[i].label}
            </text>
          ))}

          <path data-area d={area} fill={LINE_COLOR} fillOpacity={0.1} />
          <path
            data-line
            d={line}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {point && (
            <g pointerEvents="none">
              <line
                x1={x(active)}
                x2={x(active)}
                y1={MARGIN.top}
                y2={y(0)}
                className="stroke-slate-300"
                strokeDasharray="3 3"
              />
              <circle
                cx={x(active)}
                cy={y(point.total)}
                r={5}
                fill={LINE_COLOR}
                stroke="white"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      )}

      <ChartTooltip
        visible={Boolean(point)}
        x={point ? x(active) : 0}
        y={point ? y(point.total) : 0}
        containerWidth={width}
        value={point ? plural(point.total, 'lead') : ''}
        label={point?.label}
        color={LINE_COLOR}
      />
    </div>
  )
}
