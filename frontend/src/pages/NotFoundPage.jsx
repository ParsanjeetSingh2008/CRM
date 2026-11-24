import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { usePageTitle } from '../hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand" aria-hidden="true">
        <Compass className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-ink-soft">That address doesn’t exist in KINETIQ.</p>
      <Link to="/" className="mt-6 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
        Back to the dashboard
      </Link>
    </div>
  )
}
