import { useRef, useState } from 'react'
import { useElementWidth } from '../../hooks/useElementWidth'
import { HEAT_STEPS, heatColor, plural } from '../../lib/chart'
import { gsap, prefersReducedMotion, useGSAP } from '../../lib/motion'
import { ChartTooltip } from './ChartTooltip'

const SHORT_SLOTS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p']

/**
 * Weekday x time-of-day heatmap: when do enquiries arrive? One hue (blue),
 * light -> dark = few -> many. Each cell is focusable and shows its value.
 */
export function ActivityHeatmap({ heatmap }) {
  const gridRef = useRef(null)
  const [wrapperRef, width] = useElementWidth()
  const [active, setActive] = useState(null) // { day, slot, x, y }

  const { days, slots, values, max } = heatmap
  const dataKey = values.flat().join(',')

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('[data-cell]', {
        opacity: 0,
        scale: 0.4,
        duration: 0.45,
        ease: 'back.out(1.6)',
        stagger: { grid: [days.length, slots.length], from: 'start', amount: 0.6 },
      })
    },
    { scope: gridRef, dependencies: [dataKey] },
  )

  const showCell = (dayIndex, slotIndex, element) => {
    const wrapper = wrapperRef.current.getBoundingClientRect()
    const cell = element.getBoundingClientRect()
    setActive({
      day: dayIndex,
      slot: slotIndex,
      x: cell.left - wrapper.left + cell.width / 2,
      y: cell.top - wrapper.top,
    })
  }

  const activeValue = active ? values[active.day][active.slot] : 0

  return (
    <div ref={wrapperRef} className="relative">
      <div
        ref={gridRef}
        className="grid gap-1 sm:gap-1.5"
        style={{ gridTemplateColumns: `auto repeat(${slots.length}, minmax(0, 1fr))` }}
        onPointerLeave={() => setActive(null)}
      >
        {/* Column headers */}
        <span />
        {slots.map((slot, i) => (
          <span key={slot} className="pb-1 text-center text-[11px] text-ink-faint" title={slot}>
            {SHORT_SLOTS[i]}
          </span>
        ))}

        {days.map((day, dayIndex) => (
          <div key={day} className="contents">
            <span className="flex items-center pr-2 text-xs font-medium text-ink-soft">{day}</span>
            {slots.map((slot, slotIndex) => {
              const value = values[dayIndex][slotIndex]
              const isActive = active?.day === dayIndex && active?.slot === slotIndex
              return (
                <div
                  key={slot}
                  data-cell
                  tabIndex={0}
                  role="img"
                  aria-label={`${day}, ${slot}: ${plural(value, 'lead')}`}
                  onPointerEnter={(e) => showCell(dayIndex, slotIndex, e.currentTarget)}
                  onFocus={(e) => showCell(dayIndex, slotIndex, e.currentTarget)}
                  onBlur={() => setActive(null)}
                  className={`h-7 rounded-md transition-shadow duration-150 focus:outline-none sm:h-9 ${
                    isActive ? 'ring-2 ring-ink ring-offset-1' : ''
                  }`}
                  style={{ background: heatColor(value, max) }}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-ink-faint">
        <span>Fewer</span>
        {HEAT_STEPS.map((color) => (
          <span key={color} className="size-3 rounded-[4px]" style={{ background: color }} aria-hidden="true" />
        ))}
        <span>More</span>
      </div>

      <ChartTooltip
        visible={Boolean(active)}
        x={active?.x ?? 0}
        y={active?.y ?? 0}
        containerWidth={width}
        value={plural(activeValue, 'lead')}
        label={active ? `${days[active.day]} · ${slots[active.slot]}` : ''}
      />
    </div>
  )
}
