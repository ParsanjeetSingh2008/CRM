import { BadgeCheck, LineChart, MessageCircle } from 'lucide-react'
import { useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../../lib/motion'

const SHAPES = [
  { className: 'top-10 left-10 size-16 rounded-2xl bg-brand', depth: 18 },
  { className: 'top-24 right-16 size-10 rounded-full bg-new', depth: 26 },
  { className: 'bottom-28 left-20 size-12 rounded-full bg-contacted-fill', depth: 22 },
  { className: 'right-10 bottom-12 size-20 rounded-3xl bg-converted-fill', depth: 14 },
  { className: 'top-1/2 left-1/2 size-6 rounded-lg bg-brand/40', depth: 30 },
]

const FEATURES = [
  { icon: LineChart, text: 'See every enquiry, trend and conversion at a glance' },
  { icon: BadgeCheck, text: 'Move leads from New to Converted in one click' },
  { icon: MessageCircle, text: 'Ask Clive, your AI assistant, about your pipeline' },
]

/** Left half of the login screen: brand message with floating shapes (GSAP). */
export function AuthShowcase() {
  const ref = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      intro
        .from('[data-shape]', { scale: 0, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'back.out(1.7)' })
        .from('[data-reveal]', { y: 24, opacity: 0, duration: 0.6, stagger: 0.1 }, 0.2)

      // Gentle, endless float; each shape drifts a different amount.
      gsap.utils.toArray('[data-shape]').forEach((shape, i) => {
        gsap.to(shape, {
          y: `+=${shape.dataset.depth}`,
          rotation: i % 2 ? 12 : -12,
          duration: 3 + i * 0.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: 0.8,
        })
      })
    },
    { scope: ref },
  )

  return (
    <div
      ref={ref}
      className="relative hidden overflow-hidden rounded-3xl bg-brand-soft p-12 lg:flex lg:flex-col lg:justify-center"
    >
      {SHAPES.map((shape, i) => (
        <span
          key={i}
          data-shape
          data-depth={shape.depth}
          className={`absolute opacity-90 ${shape.className}`}
          aria-hidden="true"
        />
      ))}

      <div className="relative max-w-md">
        <p data-reveal className="text-sm font-bold tracking-wide text-brand uppercase">
          KINETIQ
        </p>
        <h2 data-reveal className="mt-3 text-4xl leading-tight font-extrabold tracking-tight text-ink">
          Every enquiry, one calm dashboard.
        </h2>
        <p data-reveal className="mt-4 text-base text-ink-soft">
          Capture leads, follow up on time and watch them turn into customers.
        </p>
        <ul className="mt-8 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li
              key={text}
              data-reveal
              className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-ink ring-1 ring-white"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
