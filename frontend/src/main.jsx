import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/styles.css'
import './styles/navbar.css'
import './styles/forms.css'
import './styles/animations.css'
import './styles/analysis.css'
import './styles/jobs.css'
import './styles/skeleton.css'
import './styles/chats/chats.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
  </QueryClientProvider>
)
