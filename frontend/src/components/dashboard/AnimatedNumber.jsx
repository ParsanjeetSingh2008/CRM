import { useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../../lib/motion'

/**
 * Counts up (or down) from the previous value to the new one with GSAP.
 * The visible digits are aria-hidden; screen readers get the final value.
 */
export function AnimatedNumber({ value, decimals = 0, suffix = '' }) {
  const ref = useRef(null)
  const previous = useRef(0)

  const format = (n) => `${n.toFixed(decimals)}${suffix}`

  useGSAP(
    () => {
      const counter = { n: previous.current }
      previous.current = value

      if (prefersReducedMotion()) {
        ref.current.textContent = format(value)
        return
      }

      gsap.to(counter, {
        n: value,
        duration: 1.2,
        ease: 'power3.out',
        onUpdate: () => {
          if (ref.current) ref.current.textContent = format(counter.n)
        },
      })
    },
    { dependencies: [value, decimals, suffix] },
  )

  return (
    <>
      <span ref={ref} aria-hidden="true" className="tabular-nums" />
      <span className="sr-only">{format(value)}</span>
    </>
  )
}
