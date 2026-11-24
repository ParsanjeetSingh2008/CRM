import { request } from './client'

export const getCliveStatus = ({ signal } = {}) => request('/clive/status', { signal })

/** Send the whole conversation; Clive may run several lookups, so allow extra time. */
export const askClive = (messages) =>
  request('/clive/chat', {
    method: 'POST',
    body: { messages, tz_offset_minutes: -new Date().getTimezoneOffset() },
    timeoutMs: 90_000,
  })
