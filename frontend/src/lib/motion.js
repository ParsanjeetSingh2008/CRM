import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

/** True when the user asked the OS to minimise animations. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Shared Framer Motion presets so the whole app moves the same way. */
export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

export const listItem = {
  initial: { opacity: 0, y: 8 },
  animate: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: Math.min(index, 10) * 0.03, ease: 'easeOut' },
  }),
  exit: { opacity: 0, x: -16, transition: { duration: 0.18 } },
}

export { gsap, useGSAP }
