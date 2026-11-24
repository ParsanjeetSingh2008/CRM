import { useEffect } from 'react'

/** Sets the browser tab title, e.g. "Leads · KINETIQ". */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · KINETIQ` : 'KINETIQ · Lead Dashboard'
  }, [title])
}
