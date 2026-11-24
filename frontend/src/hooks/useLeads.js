import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createLead,
  deleteLead,
  getLead,
  getLeadAnalytics,
  getLeadStats,
  loadSampleLeads,
  listLeads,
  updateLead,
  updateLeadStatus,
} from '../api/leads'

/**
 * TanStack Query hooks. They give components `isPending` / `isError` / `data`
 * for free and keep the list and the dashboard numbers in sync: after any
 * change we invalidate everything under the "leads" key so both refetch.
 */

export const leadKeys = {
  all: ['leads'],
  lists: () => ['leads', 'list'],
  list: (params) => ['leads', 'list', params],
  stats: () => ['leads', 'stats'],
  analytics: (params) => ['leads', 'analytics', params],
  detail: (id) => ['leads', 'detail', id],
}

/** One lead, for the profile card. Starts from the row we already have, then refreshes. */
export function useLeadQuery(lead) {
  return useQuery({
    queryKey: leadKeys.detail(lead?.id),
    queryFn: ({ signal }) => getLead(lead.id, { signal }),
    enabled: Boolean(lead?.id),
    initialData: lead ?? undefined,
    initialDataUpdatedAt: 0, // treat the row as stale so the latest version is fetched
    retry: (count, error) => error?.status !== 404 && count < 2,
  })
}

export function useLoadSampleLeads() {
  const invalidate = useInvalidateLeads()
  return useMutation({ mutationFn: loadSampleLeads, onSuccess: invalidate })
}

export function useLeadsQuery(params) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: ({ signal }) => listLeads(params, { signal }),
    // Keep showing the current page while the next page/filter loads.
    placeholderData: keepPreviousData,
  })
}

export function useLeadStatsQuery() {
  return useQuery({
    queryKey: leadKeys.stats(),
    queryFn: ({ signal }) => getLeadStats({ signal }),
  })
}

/** Chart data, bucketed in the browser's own timezone. */
export function useLeadAnalyticsQuery(days) {
  const params = { days, tzOffsetMinutes: -new Date().getTimezoneOffset() }
  return useQuery({
    queryKey: leadKeys.analytics(params),
    queryFn: ({ signal }) => getLeadAnalytics(params, { signal }),
    placeholderData: keepPreviousData,
  })
}

function useInvalidateLeads() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: leadKeys.all })
}

export function useCreateLead() {
  const invalidate = useInvalidateLeads()
  return useMutation({ mutationFn: createLead, onSuccess: invalidate })
}

export function useUpdateLead() {
  const invalidate = useInvalidateLeads()
  return useMutation({
    mutationFn: ({ id, lead }) => updateLead(id, lead),
    onSuccess: invalidate,
  })
}

export function useDeleteLead() {
  const invalidate = useInvalidateLeads()
  return useMutation({ mutationFn: deleteLead, onSuccess: invalidate })
}

/**
 * Status changes are "optimistic": the new status shows immediately, and is
 * rolled back if the server rejects it.
 */
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => updateLeadStatus(id, status),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() })
      const snapshots = queryClient.getQueriesData({ queryKey: leadKeys.lists() })

      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
            }
          : current,
      )
      queryClient.setQueryData(leadKeys.detail(id), (current) => (current ? { ...current, status } : current))
      return { snapshots }
    },

    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  })
}
