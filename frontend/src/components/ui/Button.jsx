import { motion } from 'framer-motion'
import { LoaderCircle } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-hover disabled:bg-brand/60',
  secondary: 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:bg-danger-hover disabled:bg-danger/60',
  ghost: 'text-ink-soft hover:bg-surface-muted hover:text-ink',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      type={type}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition-colors duration-150 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </motion.button>
  )
}
