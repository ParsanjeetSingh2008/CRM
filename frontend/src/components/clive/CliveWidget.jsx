import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { KeyRound, RotateCcw, SendHorizontal, TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { getCliveStatus } from '../../api/clive'
import { gsap, prefersReducedMotion, useGSAP } from '../../lib/motion'
import { CliveAvatar } from './CliveAvatar'
import { CliveMessage, TypingIndicator } from './CliveMessage'
import { useClive } from './CliveProvider'

const SUGGESTIONS = [
  'How is my pipeline doing?',
  'Which new leads came in this week?',
  'Who should I follow up with first?',
  'When do most enquiries arrive?',
]

function Launcher({ onOpen }) {
  const ref = useRef(null)

  // Pop in after the dashboard has loaded, then pulse a ring twice to get noticed.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap
        .timeline({ delay: 1 })
        .from(ref.current, { scale: 0, rotation: -120, duration: 0.6, ease: 'back.out(1.8)' })
        .fromTo(
          '[data-ring]',
          { scale: 1, opacity: 0.5 },
          { scale: 1.7, opacity: 0, duration: 1.1, repeat: 1, ease: 'power2.out' },
        )
    },
    { scope: ref },
  )

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onOpen}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="fixed right-4 bottom-4 z-40 flex items-center gap-2.5 rounded-2xl bg-ink py-2 pr-4 pl-2 text-sm font-bold text-white sm:right-6 sm:bottom-6"
      aria-label="Open chat with Clive, your assistant"
    >
      <span className="relative">
        <span data-ring className="absolute inset-0 rounded-xl bg-brand" aria-hidden="true" />
        <CliveAvatar className="relative size-9" />
      </span>
      Ask Clive
    </motion.button>
  )
}

function SetupNotice() {
  return (
    <div className="m-4 rounded-2xl bg-contacted-soft p-4 text-sm ring-1 ring-contacted-fill/30">
      <p className="flex items-center gap-2 font-bold text-ink">
        <KeyRound className="size-4 text-contacted" aria-hidden="true" />
        Clive needs an API key
      </p>
      <p className="mt-1.5 text-ink-soft">
        Add <code className="rounded bg-white px-1 font-semibold">GROQ_API_KEY</code> to{' '}
        <code className="rounded bg-white px-1 font-semibold">backend/.env</code> and restart the API.
      </p>
    </div>
  )
}

export function CliveWidget({ userName }) {
  const { open, setOpen, messages, ask, reset, draft, setDraft, error, dismissError, thinking } = useClive()
  const listRef = useRef(null)
  const inputRef = useRef(null)

  const status = useQuery({ queryKey: ['clive', 'status'], queryFn: getCliveStatus, enabled: open, staleTime: 60_000 })
  const unavailable = status.data?.available === false

  // Keep the newest message in view and focus the box when the panel opens.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking, error])
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const send = (event) => {
    event?.preventDefault()
    ask(draft)
  }

  return (
    <>
      <AnimatePresence>{!open && <Launcher key="launcher" onOpen={() => setOpen(true)} />}</AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Chat with Clive"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-3xl sm:ring-1 sm:ring-line"
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <CliveAvatar />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-ink">Clive</h2>
                <p className="text-xs text-ink-soft">Your leads assistant · read-only</p>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg p-2 text-ink-faint hover:bg-surface-muted hover:text-ink"
                  aria-label="Start a new chat"
                  title="New chat"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-ink-faint hover:bg-surface-muted hover:text-ink"
                aria-label="Close chat"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 && !thinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-2">
                  <p className="text-base font-bold text-ink">Hi {userName.split(' ')[0]}, I’m Clive</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    Ask me anything about your leads: who’s new, who to follow up with, or how your pipeline is
                    trending.
                  </p>
                  {!unavailable && (
                    <div className="mt-4 flex flex-col items-start gap-2">
                      {SUGGESTIONS.map((suggestion, i) => (
                        <motion.button
                          key={suggestion}
                          type="button"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.06 }}
                          onClick={() => ask(suggestion)}
                          className="rounded-xl bg-brand-soft px-3 py-2 text-left text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-white"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              <ul className="flex flex-col gap-4" aria-live="polite">
                {messages.map((message) => (
                  <CliveMessage key={message.id} message={message} />
                ))}
                <AnimatePresence>{thinking && <TypingIndicator key="typing" />}</AnimatePresence>
              </ul>

              <AnimatePresence>
                {error && (
                  <motion.div
                    role="alert"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger ring-1 ring-danger/20"
                  >
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p className="flex-1">
                      {error.message}
                      {!unavailable && ' Your question is back in the box: press send to try again.'}
                    </p>
                    <button type="button" onClick={dismissError} aria-label="Dismiss error" className="rounded p-0.5 hover:bg-white">
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {unavailable ? (
              <SetupNotice />
            ) : (
              <form onSubmit={send} className="border-t border-line p-3">
                <div className="flex items-end gap-2 rounded-2xl bg-surface-muted p-1.5 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
                  <label htmlFor="clive-input" className="sr-only">
                    Ask Clive a question
                  </label>
                  <textarea
                    id="clive-input"
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) send(e)
                    }}
                    rows={1}
                    maxLength={4000}
                    placeholder="Ask about your leads…"
                    className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none [field-sizing:content]"
                  />
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.92 }}
                    disabled={!draft.trim() || thinking}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-hover disabled:bg-slate-300"
                    aria-label="Send"
                  >
                    <SendHorizontal className="size-4" aria-hidden="true" />
                  </motion.button>
                </div>
                <p className="mt-1.5 px-1 text-[11px] text-ink-faint">
                  Clive is AI and can make mistakes. Check important details.
                </p>
              </form>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}
