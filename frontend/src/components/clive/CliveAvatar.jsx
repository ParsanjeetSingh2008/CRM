import { Bot } from 'lucide-react'

/** Clive's face: the brand blue tile with a small purple "online" dot. */
export function CliveAvatar({ className = 'size-9' }) {
  return (
    <span className={`relative flex shrink-0 items-center justify-center rounded-xl bg-brand text-white ${className}`} aria-hidden="true">
      <Bot className="size-[58%]" />
      <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-new ring-2 ring-white" />
    </span>
  )
}
