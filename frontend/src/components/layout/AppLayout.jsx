import { AnimatePresence, motion } from 'framer-motion'
import { Suspense, useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { CliveProvider } from '../clive/CliveProvider'
import { CliveWidget } from '../clive/CliveWidget'
import { LeadActionsProvider } from '../leads/LeadActionsProvider'
import { Skeleton } from '../ui/Skeleton'
import { Header } from './Header'

function PageFallback() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Loading page…</span>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

function Shell({ user }) {
  const location = useLocation()
  const outlet = useOutlet()

  // New page: start at the top, like a normal website.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-dvh bg-white pb-24">
      <Header user={user} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Suspense fallback={<PageFallback />}>{outlet}</Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <CliveWidget userName={user.name} />
    </div>
  )
}

/** Everything a logged-in user sees: header + nav, the current page, dialogs and Clive. */
export function AppLayout({ user }) {
  return (
    <CliveProvider userId={user.id}>
      <LeadActionsProvider>
        <Shell user={user} />
      </LeadActionsProvider>
    </CliveProvider>
  )
}
