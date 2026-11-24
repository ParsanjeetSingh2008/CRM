import { Link } from 'react-router'
import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'
import { Wordmark } from './Wordmark'

export function Header({ user }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="KINETIQ dashboard">
          <Wordmark />
        </Link>
        <div className="hidden md:block">
          <MainNav />
        </div>
        <UserMenu user={user} />
      </div>
      {/* Phones: the navigation gets its own full-width row. */}
      <div className="mx-auto max-w-6xl px-4 pb-3 md:hidden">
        <MainNav variant="bar" />
      </div>
    </header>
  )
}
