import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Sparkles, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useLogin, useSignup } from '../../hooks/useAuth'
import { loginSchema, signupSchema } from '../../lib/validation'
import { Button } from '../ui/Button'
import { Field, controlClass } from '../ui/Field'

// Public demo account created by `python -m scripts.seed` (see README).
const DEMO = { email: 'demo@kinetiq.app', password: 'DemoPass123' }

const MODES = [
  { id: 'login', label: 'Log in' },
  { id: 'signup', label: 'Sign up' },
]

function PasswordInput({ fieldProps, registration, hasError, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        {...fieldProps}
        {...registration}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        className={`h-11 pr-11 ${controlClass(hasError)}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-muted hover:text-ink"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  )
}

/** One form for both modes. Changing mode remounts it so each has clean state. */
function CredentialsForm({ mode }) {
  const isSignup = mode === 'signup'
  const loginMutation = useLogin()
  const signupMutation = useSignup()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema),
    defaultValues: isSignup ? { name: '', email: '', password: '' } : { email: '', password: '' },
    mode: 'onTouched',
  })

  const submit = async (values) => {
    setFormError(null)
    try {
      const user = await (isSignup ? signupMutation : loginMutation).mutateAsync(values)
      toast.success(isSignup ? `Welcome to KINETIQ, ${user.name.split(' ')[0]}!` : `Welcome back, ${user.name.split(' ')[0]}!`)
    } catch (error) {
      const fieldErrors = (error.details || []).filter((d) => ['name', 'email', 'password'].includes(d.field))
      fieldErrors.forEach(({ field, message }, i) =>
        setError(field, { type: 'server', message }, { shouldFocus: i === 0 }),
      )
      if (fieldErrors.length === 0) setFormError(error.message)
    }
  }

  const tryDemo = async () => {
    setFormError(null)
    try {
      await loginMutation.mutateAsync(DEMO)
      toast.success('Logged in to the demo account')
    } catch (error) {
      setFormError(
        error.status === 401
          ? 'The demo account isn’t set up on this server. Run `python -m scripts.seed` in backend/.'
          : error.message,
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <AnimatePresence initial={false}>
        {formError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger ring-1 ring-danger/20">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {formError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {isSignup && (
        <Field label="Full name" error={errors.name?.message}>
          {(props) => (
            <input
              {...props}
              {...register('name')}
              autoComplete="name"
              placeholder="e.g. Priya Nair"
              className={`h-11 ${controlClass(errors.name)}`}
            />
          )}
        </Field>
      )}

      <Field label="Email" error={errors.email?.message}>
        {(props) => (
          <input
            {...props}
            {...register('email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={`h-11 ${controlClass(errors.email)}`}
          />
        )}
      </Field>

      <Field
        label="Password"
        error={errors.password?.message}
        hint={isSignup ? 'At least 8 characters, with a letter and a number.' : undefined}
      >
        {(props) => (
          <PasswordInput
            fieldProps={props}
            registration={register('password')}
            hasError={Boolean(errors.password)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        )}
      </Field>

      <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
        {isSignup ? 'Create account' : 'Log in'}
      </Button>

      {!isSignup && (
        <>
          <div className="flex items-center gap-3 text-xs text-ink-faint" aria-hidden="true">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <Button variant="secondary" onClick={tryDemo} loading={loginMutation.isPending && !isSubmitting} className="w-full">
            <Sparkles className="size-4 text-new" aria-hidden="true" />
            Try the demo account
          </Button>
        </>
      )}
    </form>
  )
}

export function AuthForm() {
  const [mode, setMode] = useState('login')
  const isSignup = mode === 'signup'

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {isSignup ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        {isSignup ? 'Start tracking your leads in under a minute.' : 'Log in to see your leads and pipeline.'}
      </p>

      <div
        role="tablist"
        aria-label="Log in or sign up"
        className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1 ring-1 ring-line ring-inset"
      >
        {MODES.map((option) => {
          const active = mode === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(option.id)}
              className={`relative rounded-lg py-2 text-sm font-semibold transition-colors ${active ? 'text-ink' : 'text-ink-soft hover:text-ink'}`}
            >
              {active && (
                <motion.span
                  layoutId="auth-mode-pill"
                  className="absolute inset-0 rounded-lg bg-white ring-1 ring-line"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{option.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          role="tabpanel"
          initial={{ opacity: 0, x: isSignup ? 16 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isSignup ? -16 : 16 }}
          transition={{ duration: 0.2 }}
          className="mt-6"
        >
          <CredentialsForm mode={mode} />
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {isSignup ? 'Already have an account? ' : 'New to KINETIQ? '}
        <button
          type="button"
          onClick={() => setMode(isSignup ? 'login' : 'signup')}
          className="font-semibold text-brand hover:underline"
        >
          {isSignup ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </div>
  )
}
