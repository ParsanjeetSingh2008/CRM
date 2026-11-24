import { motion } from 'framer-motion'
import { AuthForm } from '../components/auth/AuthForm'
import { AuthShowcase } from '../components/auth/AuthShowcase'
import { Wordmark } from '../components/layout/Wordmark'

export function AuthPage() {
  return (
    <div className="grid min-h-dvh bg-white p-3 lg:grid-cols-2 lg:gap-3">
      <AuthShowcase />
      <main className="flex flex-col px-4 py-6 sm:px-8">
        <Wordmark />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 items-center justify-center py-10"
        >
          <AuthForm />
        </motion.div>
      </main>
    </div>
  )
}
