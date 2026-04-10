import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/styles.css'
import './styles/navbar.css'
import './styles/forms/base.css'
import './styles/forms/auth.css'
import './styles/forms/changePassword.css'
import './styles/forms/verification.css'
import './styles/forms/multiStep.css'
import './styles/forms/skills.css'
import './styles/forms/searchableSelect.css'
import './styles/forms/applicationForm.css'
import './styles/animations.css'
import './styles/analysis.css'
import './styles/jobs.css'
import './styles/skeleton.css'
import './styles/chats/chats.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
  </QueryClientProvider>
)