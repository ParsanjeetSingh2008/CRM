import { motion } from 'framer-motion'
import { ArrowUpRight, Bot, ChartColumn, Info } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useClive } from '../components/clive/CliveProvider'
import { RecentLeads } from '../components/dashboard/RecentLeads'
import { StatsGrid } from '../components/dashboard/StatsGrid'
import { useLeadStatsQuery } from '../hooks/useLeads'
import { usePageTitle } from '../hooks/usePageTitle'
import { fadeUp } from '../lib/motion'

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

const shortcut =
  'group flex items-start gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-line transition-shadow hover:ring-slate-300 sm:p-5'

function ShortcutBody({ icon: Icon, tone, title, text }) {
  return (
    <>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white ${tone}`} aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <span className="block min-w-0 flex-1">
        <span className="flex items-center gap-1 text-sm font-bold text-ink">
          {title}
          <ArrowUpRight
            className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
        <span className="mt-0.5 block text-sm text-ink-soft">{text}</span>
      </span>
    </>
  )
}

/** Overview: the numbers, the newest leads, and shortcuts to the other pages. */
export default function DashboardPage({ user }) {
  usePageTitle('Dashboard')
  const statsQuery = useLeadStatsQuery()
  const navigate = useNavigate()
  const clive = useClive()

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.08 }} className="flex flex-col gap-6 sm:gap-8">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {greeting()}, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-soft sm:text-base">Here’s how your leads are doing today.</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <StatsGrid
          statsQuery={statsQuery}
          activeStatus={null}
          onSelectStatus={(status) => navigate(status ? `/leads?status=${status}` : '/leads')}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentLeads />
        </div>
        <div className="flex flex-col gap-3">
          <Link to="/analytics" className={shortcut}>
            <ShortcutBody
              icon={ChartColumn}
              tone="bg-brand"
              title="Analytics"
              text="Trends, status split and when enquiries arrive."
            />
          </Link>
          <button type="button" onClick={() => clive.setOpen(true)} className={shortcut}>
            <ShortcutBody
              icon={Bot}
              tone="bg-new"
              title="Ask Clive"
              text="Your AI assistant answers questions about your leads."
            />
          </button>
          <Link to="/about" className={shortcut}>
            <ShortcutBody
              icon={Info}
              tone="bg-converted-fill"
              title="How KINETIQ works"
              text="A short tour of the lead journey and features."
            />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}
