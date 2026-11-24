/**
 * Small fetch wrapper used by every API call.
 *
 * - Builds the URL (base + path + query string, skipping empty params).
 * - Sends/receives JSON.
 * - Turns every failure (network down, timeout, 4xx/5xx) into an ApiError with a
 *   human-readable `message`, plus `code` and per-field `details` from the backend.
 */

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const API_BASE = `${API_ORIGIN}/api`
const TIMEOUT_MS = 15_000
export const SESSION_EXPIRED_EVENT = 'crm:session-expired'

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN_ERROR', details = [] } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function buildUrl(path, params) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url
}

async function parseBody(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function request(path, { method = 'GET', body, params, signal, timeoutMs = TIMEOUT_MS } = {}) {
  const timeout = AbortSignal.timeout(timeoutMs)
  const combinedSignal = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: combinedSignal,
      // Send the httpOnly session cookie (also when the API is on another origin).
      credentials: 'include',
    })
  } catch (error) {
    // A cancelled request (e.g. the user typed again) is not a real error.
    if (signal?.aborted) throw error
    if (timeout.aborted) {
      throw new ApiError('The server took too long to respond. Please try again.', {
        code: 'TIMEOUT',
      })
    }
    throw new ApiError("Can't reach the server. Check your connection and try again.", {
      code: 'NETWORK_ERROR',
    })
  }

  const data = await parseBody(response)

  if (!response.ok) {
    const error = data?.error
    // Session expired or logged out elsewhere: tell the app to show the login screen.
    if (response.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    // A proxy/host error (502/503/504) has no JSON body from our API.
    const fallback =
      response.status >= 500
        ? 'The server is unavailable right now. Please try again in a moment.'
        : `Request failed (${response.status}).`
    throw new ApiError(error?.message || fallback, {
      status: response.status,
      code: error?.code || 'HTTP_ERROR',
      details: error?.details || [],
    })
  }

  return data
}
