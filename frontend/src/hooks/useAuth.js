import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getMe, login, logout, signup } from '../api/auth'
import { SESSION_EXPIRED_EVENT } from '../api/client'

/**
 * Who is logged in? `data` is the user, or null when logged out.
 * A 401 from /auth/me simply means "logged out", so it is not an error here.
 */
export const authKey = ['auth', 'me']

export function useCurrentUser() {
  const queryClient = useQueryClient()

  // Any API call that gets a 401 (expired session) drops us back to the login screen.
  useEffect(() => {
    const onExpired = () => {
      queryClient.setQueryData(authKey, null)
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [queryClient])

  return useQuery({
    queryKey: authKey,
    queryFn: async ({ signal }) => {
      try {
        return await getMe({ signal })
      } catch (error) {
        if (error.status === 401) return null
        throw error
      }
    },
    staleTime: Infinity,
    retry: (count, error) => count < 2 && (error?.status === 0 || error?.status >= 500),
  })
}

function useSession(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (user) => {
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
      queryClient.setQueryData(authKey, user)
    },
  })
}

export const useLogin = () => useSession(login)
export const useSignup = () => useSession(signup)

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      sessionStorage.clear() // e.g. Clive's chat history
      // Drop every cached lead/chart, but keep the auth query itself: removing it
      // would detach the screen that is watching it, so it would never switch.
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
      queryClient.setQueryData(authKey, null)
    },
  })
}
