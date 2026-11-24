import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  ChartColumn,
  Database,
  IdCard,
  KeyRound,
  LayoutDashboard,
  Lock,
  Monitor,
  PhoneCall,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { useClive } from '../components/clive/CliveProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/motion'

gsap.registerPlugin(ScrollTrigger)

const JOURNEY = [
  {
    step: 1,
    status: 'New',
    icon: Sparkles,
    tone: 'bg-new',
    soft: 'bg-new-soft',
    text: 'An enquiry arrives. Add it with a name, email, phone and business name. Every lead starts as New.',
  },
  {
    step: 2,
    status: 'Contacted',
    icon: PhoneCall,
    tone: 'bg-contacted-fill',
    soft: 'bg-contacted-soft',
    text: 'You’ve reached out. Change the status from the lead’s row or its profile card in one click.',
  },
  {
    step: 3,
    status: 'Converted',
    icon: BadgeCheck,
    tone: 'bg-converted-fill',
    soft: 'bg-converted-soft',
    text: 'They became a customer. Your conversion rate and charts update instantly.',
  },
]

const FEATURES = [
  { icon: LayoutDashboard, title: 'Dashboard', text: 'Totals at a glance, your newest leads and shortcuts to everything else.' },
  { icon: Users, title: 'Leads', text: 'Add, edit and delete leads. Search by name or email, filter by status, sort and page through.' },
  { icon: IdCard, title: 'Profile card', text: 'Click a lead to see its details, notes, pipeline stage and quick actions.' },
  { icon: ChartColumn, title: 'Analytics', text: 'A trend graph, a status donut and a heatmap of when enquiries arrive, for 7, 30 or 90 days.' },
  { icon: Bot, title: 'Clive', text: 'An AI assistant that answers questions about your leads in plain English.' },
  { icon: Lock, title: 'Private workspace', text: 'Every account has its own leads. Nobody else can see or change them.' },
]

const ARCHITECTURE = [
  { icon: Monitor, title: 'Your browser', text: 'React app, animated with GSAP and Framer Motion', tone: 'bg-brand' },
  { icon: Server, title: 'FastAPI backend', text: 'Checks your login, validates every input, runs the logic', tone: 'bg-new' },
  { icon: Database, title: 'SQLite database', text: 'Stores accounts and leads, so nothing disappears on refresh', tone: 'bg-contacted-fill' },
]

const SECURITY = [
  { icon: KeyRound, text: 'Passwords are hashed with Argon2. The original password is never stored.' },
  { icon: Lock, text: 'Your session is kept in a secure, httpOnly cookie that page scripts can’t read.' },
  { icon: ShieldCheck, text: 'Every request is checked against your account, so you only ever see your own leads.' },
  { icon: Bot, text: 'Clive can only read your leads. It cannot add, change or delete anything.' },
]

const CLIVE_QUESTIONS = ['Who should I follow up with first?', 'How is my pipeline doing?', 'When do most enquiries arrive?']

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="max-w-2xl">
      <p data-reveal className="text-xs font-bold tracking-widest text-brand uppercase">
        {eyebrow}
      </p>
      <h2 data-reveal className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {text && (
        <p data-reveal className="mt-2 text-sm text-ink-soft sm:text-base">
          {text}
        </p>
      )}
    </div>
  )
}

/** A short, animated explanation of how KINETIQ works. */
export default function AboutPage() {
  usePageTitle('About')
  const ref = useRef(null)
  const clive = useClive()

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      // Each section's pieces rise in as it scrolls into view.
      gsap.utils.toArray('[data-section]').forEach((section) => {
        gsap.from(section.querySelectorAll('[data-reveal]'), {
          y: 24,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.07,
          scrollTrigger: { trigger: section, start: 'top 82%', once: true },
        })
      })
      // The line joining the three journey steps draws itself with the scroll.
      gsap.fromTo(
        '[data-journey-line]',
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          transformOrigin: 'left center',
          scrollTrigger: { trigger: '[data-journey]', start: 'top 80%', end: 'bottom 55%', scrub: 0.6 },
        },
      )
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className="flex flex-col gap-16 sm:gap-20">
      {/* Intro */}
      <section data-section className="relative overflow-hidden rounded-3xl bg-brand-soft px-6 py-12 sm:px-12 sm:py-16">
        <span className="absolute -top-6 -right-6 size-28 rounded-3xl bg-brand/15" aria-hidden="true" />
        <span className="absolute right-24 bottom-6 size-10 rounded-full bg-new/20" aria-hidden="true" />
        <span className="absolute bottom-10 left-1/2 size-6 rounded-lg bg-converted-fill/30" aria-hidden="true" />
        <p data-reveal className="text-xs font-bold tracking-widest text-brand uppercase">
          About KINETIQ
        </p>
        <h1 data-reveal className="mt-3 max-w-2xl text-3xl leading-tight font-extrabold tracking-tight text-ink sm:text-5xl">
          How KINETIQ works
        </h1>
        <p data-reveal className="mt-4 max-w-xl text-base text-ink-soft sm:text-lg">
          KINETIQ is a lightweight CRM for small businesses. Every enquiry becomes a <strong className="text-ink">lead</strong>,
          and you move each lead from first contact to paying customer, with the numbers, charts and an AI assistant
          to help along the way.
        </p>
      </section>

      {/* The lead journey */}
      <section data-section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="The lead journey"
          title="Three stages, one clear pipeline"
          text="Each lead has a status. Moving it forward is how you track progress."
        />
        <div data-journey className="relative">
          <div className="absolute top-7 right-[16%] left-[16%] hidden h-1 rounded-full bg-slate-100 md:block" aria-hidden="true">
            <div
              data-journey-line
              className="h-full rounded-full bg-gradient-to-r from-new via-contacted-fill to-converted-fill"
            />
          </div>
          <ol className="relative grid gap-4 md:grid-cols-3">
            {JOURNEY.map(({ step, status, icon: Icon, tone, soft, text }) => (
              <li key={status} data-reveal className="flex flex-col items-center text-center">
                <span className={`flex size-14 items-center justify-center rounded-2xl text-white ring-4 ring-white ${tone}`}>
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <div className={`mt-4 w-full rounded-2xl p-5 ${soft}`}>
                  <p className="text-xs font-bold text-ink-faint">STEP {step}</p>
                  <h3 className="mt-1 text-lg font-extrabold text-ink">{status}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section data-section className="flex flex-col gap-8">
        <SectionHeading eyebrow="Features" title="Everything in one place" text="Use the bar at the top to move between pages." />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} data-reveal className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand" aria-hidden="true">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Clive */}
      <section data-section className="grid items-center gap-8 rounded-3xl bg-ink px-6 py-10 text-white sm:px-10 lg:grid-cols-2">
        <div>
          <p data-reveal className="text-xs font-bold tracking-widest text-blue-300 uppercase">
            Meet Clive
          </p>
          <h2 data-reveal className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Ask your CRM a question
          </h2>
          <p data-reveal className="mt-3 text-sm text-slate-300 sm:text-base">
            Clive is the assistant in the bottom-right corner. When you ask something, Clive sends your question to a
            large language model (hosted on Groq) together with four read-only lookups: pipeline totals, lead search,
            one lead’s details and trends. The model decides which lookups it needs, KINETIQ runs them against your
            own leads, and Clive answers with the real numbers.
          </p>
          <button
            data-reveal
            type="button"
            onClick={() => clive.setOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-slate-100"
          >
            <Bot className="size-4" aria-hidden="true" />
            Open Clive
          </button>
        </div>
        <ul className="flex flex-col gap-3">
          {CLIVE_QUESTIONS.map((question) => (
            <li key={question} data-reveal>
              <button
                type="button"
                onClick={() => clive.ask(question)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3.5 text-left text-sm font-medium ring-1 ring-white/15 transition-colors hover:bg-white/15"
              >
                “{question}”
                <ArrowRight className="size-4 shrink-0 text-blue-300" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Architecture */}
      <section data-section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Under the hood"
          title="From click to database and back"
          text="When you add or change a lead, this is the path it takes."
        />
        <ol className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {ARCHITECTURE.map(({ icon: Icon, title, text, tone }, i) => (
            <li key={title} data-reveal className="contents">
              <div className="flex items-start gap-3 rounded-2xl bg-white p-5 ring-1 ring-line">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white ${tone}`} aria-hidden="true">
                  <Icon className="size-5" />
                </span>
                <span className="block">
                  <span className="block text-sm font-bold text-ink">{title}</span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{text}</span>
                </span>
              </div>
              {i < ARCHITECTURE.length - 1 && (
                <div className="flex items-center justify-center text-ink-faint" aria-hidden="true">
                  <ArrowRight className="size-5 rotate-90 md:rotate-0" />
                </div>
              )}
            </li>
          ))}
        </ol>
        <p data-reveal className="text-sm text-ink-soft">
          Built with <strong className="text-ink">React</strong>, <strong className="text-ink">GSAP</strong> and{' '}
          <strong className="text-ink">Framer Motion</strong> on the front end, <strong className="text-ink">Python FastAPI</strong>{' '}
          and <strong className="text-ink">SQLite</strong> on the back end, and <strong className="text-ink">Groq</strong> for Clive.
        </p>
      </section>

      {/* Security */}
      <section data-section className="flex flex-col gap-8">
        <SectionHeading eyebrow="Security" title="Your data stays yours" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {SECURITY.map(({ icon: Icon, text }) => (
            <li key={text} data-reveal className="flex items-start gap-3 rounded-2xl bg-surface-muted p-4 ring-1 ring-line">
              <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
              <span className="text-sm text-ink">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Call to action */}
      <section data-section className="flex flex-col items-center rounded-3xl bg-surface-muted px-6 py-12 text-center ring-1 ring-line">
        <h2 data-reveal className="text-2xl font-extrabold tracking-tight text-ink">Ready to work your pipeline?</h2>
        <div data-reveal className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
            Go to the dashboard
          </Link>
          <Link to="/leads" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-line hover:bg-slate-50">
            View your leads
          </Link>
        </div>
      </section>
    </div>
  )
}
