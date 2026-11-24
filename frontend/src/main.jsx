import '@fontsource-variable/plus-jakarta-sans'
import './styles/index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry network/server errors (e.g. a cold-starting server), never 4xx.
      retry: (failureCount, error) =>
        failureCount < 2 && (error?.status === 0 || error?.status >= 500),
    },
    mutations: { retry: false },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* Framer Motion follows the OS "reduce motion" setting. */}
        <MotionConfig reducedMotion="user">
          <App />
          <Toaster position="top-right" richColors closeButton />
        </MotionConfig>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
