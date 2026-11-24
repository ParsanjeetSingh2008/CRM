/** Small helpers shared by the hand-built SVG charts. */

const dayFormatter = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' })

/** "2026-11-24" -> Date at local midnight (avoids the UTC off-by-one). */
export function parseDay(isoDay) {
  const [y, m, d] = isoDay.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const formatDay = (isoDay) => dayFormatter.format(parseDay(isoDay))

/**
 * Daily points for short ranges; weekly totals for long ranges so the line
 * shows the trend instead of day-to-day noise. Weeks are counted back from
 * today so the last point always ends today.
 */
export function bucketTimeline(timeline, rangeDays) {
  if (rangeDays <= 31) {
    return timeline.map((p) => ({ key: p.date, label: formatDay(p.date), total: p.total }))
  }
  const buckets = []
  for (let end = timeline.length; end > 0; end -= 7) {
    const chunk = timeline.slice(Math.max(0, end - 7), end)
    const total = chunk.reduce((sum, p) => sum + p.total, 0)
    const first = chunk[0].date
    const last = chunk[chunk.length - 1].date
    buckets.unshift({
      key: first,
      label: `${formatDay(first)} – ${formatDay(last)}`,
      shortLabel: formatDay(first),
      total,
    })
  }
  return buckets
}

/** Round the axis top up to a multiple of `ticks` so gridlines land on whole numbers. */
export function niceMax(max, ticks = 4) {
  if (max <= 0) return ticks
  return Math.ceil(max / ticks) * ticks
}

/**
 * Indices of at most ~`count` axis labels on a whole-number step, so the gaps
 * between labels are equal. The last point is always labelled (it is "today").
 */
export function labelIndices(length, count = 5) {
  if (length <= 1) return length ? [0] : []
  const step = Math.ceil((length - 1) / (count - 1))
  const indices = []
  for (let i = length - 1; i >= 0; i -= step) indices.unshift(i)
  return indices
}

/**
 * Sequential single-hue (blue) ramp for the heatmap, light -> dark.
 * Zero stays neutral grey so "no leads" never reads as "a few".
 */
export const HEAT_STEPS = ['#f1f5f9', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8']

export function heatColor(value, max) {
  if (!value || !max) return HEAT_STEPS[0]
  const step = Math.ceil((value / max) * (HEAT_STEPS.length - 1))
  return HEAT_STEPS[Math.min(Math.max(step, 1), HEAT_STEPS.length - 1)]
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * Smooth SVG path through points using monotone cubic interpolation
 * (Fritsch–Carlson). Unlike a plain spline it never overshoots, so a count
 * curve never dips below zero or invents peaks between two points.
 */
export function monotonePath(points) {
  const n = points.length
  if (n === 0) return ''
  if (n === 1) return `M${points[0].x},${points[0].y}`

  const slopes = []
  for (let i = 0; i < n - 1; i++) {
    slopes.push((points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x))
  }

  const tangents = new Array(n)
  tangents[0] = slopes[0]
  tangents[n - 1] = slopes[n - 2]
  for (let i = 1; i < n - 1; i++) {
    tangents[i] = slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2
  }
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0
      tangents[i + 1] = 0
      continue
    }
    const a = tangents[i] / slopes[i]
    const b = tangents[i + 1] / slopes[i]
    const s = a * a + b * b
    if (s > 9) {
      const k = 3 / Math.sqrt(s)
      tangents[i] = k * a * slopes[i]
      tangents[i + 1] = k * b * slopes[i]
    }
  }

  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const h = (p1.x - p0.x) / 3
    d += `C${p0.x + h},${p0.y + h * tangents[i]} ${p1.x - h},${p1.y - h * tangents[i + 1]} ${p1.x},${p1.y}`
  }
  return d
}
