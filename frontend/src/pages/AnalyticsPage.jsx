import { AnalyticsSection } from '../components/analytics/AnalyticsSection'
import { usePageTitle } from '../hooks/usePageTitle'

export default function AnalyticsPage() {
  usePageTitle('Analytics')
  return <AnalyticsSection />
}
