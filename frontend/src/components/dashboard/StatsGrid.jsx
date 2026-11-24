import { BadgeCheck, PhoneCall, Sparkles, Users } from 'lucide-react'
import { useRef } from 'react'
import { STATUS } from '../../lib/constants'
import { gsap, prefersReducedMotion, useGSAP } from '../../lib/motion'
import { ErrorState } from '../ui/ErrorState'
import { StatCard } from './StatCard'

/** Dashboard overview: four stat cards with a GSAP entrance. */
export function StatsGrid({ statsQuery, activeStatus, onSelectStatus }) {
  const containerRef = useRef(null)
  const { data: stats, isPending, isError, error, refetch, isRefetching } = statsQuery

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('[data-stat-card]', {
        opacity: 0,
        y: 18,
        scale: 0.96,
        duration: 0.5,
        ease: 'back.out(1.4)',
        stagger: { each: 0.07, grid: 'auto' },
      })
    },
    { scope: containerRef },
  )

  const cards = [
    {
      label: 'Total leads',
      value: stats?.total,
      caption: 'All enquiries',
      icon: Users,
      tone: 'brand',
      status: '',
    },
    {
      label: 'New',
      value: stats?.new,
      caption: 'Awaiting first contact',
      icon: Sparkles,
      tone: 'new',
      status: STATUS.NEW,
    },
    {
      label: 'Contacted',
      value: stats?.contacted,
      caption: 'In conversation',
      icon: PhoneCall,
      tone: 'contacted',
      status: STATUS.CONTACTED,
    },
    {
      label: 'Converted',
      value: stats?.converted,
      caption: stats ? `${stats.conversion_rate}% conversion rate` : '',
      icon: BadgeCheck,
      tone: 'converted',
      status: STATUS.CONVERTED,
    },
  ]

  return (
    <section aria-label="Leads overview" className="flex flex-col gap-3 sm:gap-4">
      {isError && (
        <ErrorState
          compact
          title="Couldn't load dashboard numbers"
          error={error}
          onRetry={() => refetch()}
          retrying={isRefetching}
        />
      )}

      <div ref={containerRef} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            {...card}
            loading={isPending}
            active={activeStatus === card.status}
            onSelect={() => onSelectStatus(card.status)}
          />
        ))}
      </div>
    </section>
  )
}
