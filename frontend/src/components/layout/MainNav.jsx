import { motion } from 'framer-motion'
import { ChartColumn, Info, LayoutDashboard, Users } from 'lucide-react'
import { NavLink } from 'react-router'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/about', label: 'About', icon: Info },
]

/**
 * The main navigation ("taskbar"). Each item is a real link with its own URL,
 * so pages can be bookmarked and the back button works. The white pill slides
 * to the active page (Framer Motion layoutId).
 *
 * variant="inline": inside the header on wide screens.
 * variant="bar": full-width row under the header on phones.
 */
export function MainNav({ variant = 'inline' }) {
  const isBar = variant === 'bar'
  const pillId = isBar ? 'nav-pill-bar' : 'nav-pill-inline'

  return (
    <nav aria-label="Main">
      <ul
        className={
          isBar
            ? 'grid grid-cols-4 gap-1 rounded-xl bg-surface-muted p-1 ring-1 ring-line ring-inset'
            : 'flex items-center gap-1 rounded-xl bg-surface-muted p-1 ring-1 ring-line ring-inset'
        }
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-center justify-center rounded-lg font-semibold transition-colors ${
                  isBar ? 'flex-col gap-0.5 px-1 py-1.5 text-[11px]' : 'gap-2 px-3.5 py-2 text-sm'
                } ${isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId={pillId}
                      className="absolute inset-0 rounded-lg bg-white ring-1 ring-line"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <Icon className={`relative ${isBar ? 'size-4' : 'size-4'} ${isActive ? 'text-brand' : ''}`} aria-hidden="true" />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
