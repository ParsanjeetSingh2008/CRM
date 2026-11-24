import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import Markdown from 'react-markdown'
import { CliveAvatar } from './CliveAvatar'

const TOOL_LABELS = {
  get_pipeline_summary: 'pipeline totals',
  search_leads: 'lead search',
  get_lead_details: 'lead details',
  get_lead_trends: 'trends',
}

// react-markdown never renders raw HTML, so replies can't inject markup.
const MARKDOWN = {
  p: (props) => <p className="[&:not(:first-child)]:mt-2" {...props} />,
  ul: (props) => <ul className="mt-2 list-disc space-y-1 pl-5" {...props} />,
  ol: (props) => <ol className="mt-2 list-decimal space-y-1 pl-5" {...props} />,
  strong: (props) => <strong className="font-bold text-ink" {...props} />,
  a: (props) => <a className="font-semibold text-brand underline" target="_blank" rel="noopener noreferrer" {...props} />,
  code: (props) => <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em]" {...props} />,
}

export function CliveMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <motion.li
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isUser ? 'justify-end' : ''}`}
    >
      {!isUser && <CliveAvatar className="mt-0.5 size-7" />}
      <div className={`flex max-w-[85%] flex-col gap-1.5 ${isUser ? 'items-end' : ''}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser ? 'rounded-br-md bg-brand text-white' : 'rounded-tl-md bg-surface-muted text-ink ring-1 ring-line'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown components={MARKDOWN} disallowedElements={['img']} unwrapDisallowed>
              {message.content}
            </Markdown>
          )}
        </div>
        {message.toolsUsed?.length > 0 && (
          <p className="flex items-center gap-1 text-[11px] text-ink-faint">
            <Search className="size-3" aria-hidden="true" />
            Checked {message.toolsUsed.map((t) => TOOL_LABELS[t] ?? t).join(', ')}
          </p>
        )}
      </div>
    </motion.li>
  )
}

export function TypingIndicator() {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-2.5"
      role="status"
    >
      <CliveAvatar className="mt-0.5 size-7" />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-surface-muted px-4 py-3.5 ring-1 ring-line">
        <span className="sr-only">Clive is looking that up…</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-ink-faint"
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        ))}
      </div>
    </motion.li>
  )
}
