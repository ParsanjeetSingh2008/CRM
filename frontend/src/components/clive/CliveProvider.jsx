import { useMutation } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { askClive } from '../../api/clive'

/**
 * Holds Clive's conversation so any component can open the chat or ask a
 * question (e.g. "Ask Clive about this lead" in the profile card).
 *
 * The conversation lives in the browser (sessionStorage, per user) and is sent
 * with each question; the server keeps nothing between requests.
 */
const CliveContext = createContext(null)

let nextId = 0
const newId = () => `m${Date.now()}-${nextId++}`

export function CliveProvider({ userId, children }) {
  const storageKey = `clive:${userId}`
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey)) ?? []
    } catch {
      return []
    }
  })

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey])

  const mutation = useMutation({ mutationFn: askClive })

  const ask = useCallback(
    (text) => {
      const question = text.trim()
      if (!question || mutation.isPending) return
      setOpen(true)
      setError(null)
      setDraft('')
      const userMessage = { id: newId(), role: 'user', content: question }
      const conversation = [...messages, userMessage]
      setMessages(conversation)

      mutation.mutate(
        conversation.map(({ role, content }) => ({ role, content })),
        {
          onSuccess: (data) =>
            setMessages((current) => [
              ...current,
              { id: newId(), role: 'assistant', content: data.reply, toolsUsed: data.tools_used },
            ]),
          // Take the unanswered question back out (turns must alternate) and put
          // it back in the box, so "send" again is the retry.
          onError: (err) => {
            setMessages((current) => current.filter((m) => m.id !== userMessage.id))
            setDraft(question)
            setError(err)
          },
        },
      )
    },
    [messages, mutation],
  )

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
    setDraft('')
  }, [])

  const value = useMemo(
    () => ({
      open,
      setOpen,
      messages,
      ask,
      reset,
      draft,
      setDraft,
      error,
      dismissError: () => setError(null),
      thinking: mutation.isPending,
    }),
    [open, messages, ask, reset, draft, error, mutation.isPending],
  )

  return <CliveContext.Provider value={value}>{children}</CliveContext.Provider>
}

export function useClive() {
  const context = useContext(CliveContext)
  if (!context) throw new Error('useClive must be used inside <CliveProvider>')
  return context
}
