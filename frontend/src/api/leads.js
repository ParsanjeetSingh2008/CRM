import { request } from './client'

/** One function per backend endpoint. Components never call fetch directly. */

export const listLeads = ({ search, status, page, pageSize, sort }, { signal } = {}) =>
  request('/leads', {
    params: { search, status, page, page_size: pageSize, sort },
    signal,
  })

export const getLeadStats = ({ signal } = {}) => request('/leads/stats', { signal })

export const getLeadAnalytics = ({ days, tzOffsetMinutes }, { signal } = {}) =>
  request('/leads/analytics', {
    params: { days, tz_offset_minutes: tzOffsetMinutes },
    signal,
  })

export const createLead = (lead) => request('/leads', { method: 'POST', body: lead })

export const updateLead = (id, lead) => request(`/leads/${id}`, { method: 'PUT', body: lead })

export const updateLeadStatus = (id, status) =>
  request(`/leads/${id}/status`, { method: 'PATCH', body: { status } })

export const deleteLead = (id) => request(`/leads/${id}`, { method: 'DELETE' })

export const getLead = (id, { signal } = {}) => request(`/leads/${id}`, { signal })

export const loadSampleLeads = () => request('/leads/sample-data', { method: 'POST' })
