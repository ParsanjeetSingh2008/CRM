import { AnimatePresence, motion } from 'framer-motion'
import { lazy } from 'react'
import { Route, Routes } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { LogoMark } from './components/layout/LogoMark'
import { ErrorState } from './components/ui/ErrorState'
import { useCurrentUser } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'

// Loaded on first visit, keeping the initial download small.
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const LeadsPage = lazy(() => import('./pages/LeadsPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function Splash() {
  return (
    <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
        <LogoMark className="size-12" />
      </motion.div>
      <p className="text-sm font-medium text-ink-soft">Loading KINETIQ…</p>
    </div>
  )
}

function AppRoutes({ user }) {
  return (
    <Routes>
      <Route element={<AppLayout user={user} />}>
        <Route index element={<DashboardPage user={user} />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

/** Logged in -> the app with its pages. Logged out -> login/sign-up screen (on any URL). */
export default function App() {
  const { data: user, isPending, isError, error, refetch, isRefetching } = useCurrentUser()

  let screen
  if (isPending) screen = <Splash key="splash" />
  else if (isError)
    screen = (
      <div key="error" className="flex min-h-dvh items-center justify-center p-6">
        <ErrorState title="Couldn't reach KINETIQ" error={error} onRetry={() => refetch()} retrying={isRefetching} />
      </div>
    )
  else if (!user) screen = <AuthPage key="auth" />
  // Keyed by user id so switching accounts starts from a clean app.
  else screen = <AppRoutes key={`user-${user.id}`} user={user} />

  return (
    <AnimatePresence mode="wait">
      <motion.div key={screen.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        {screen}
      </motion.div>
    </AnimatePresence>
  )
}
