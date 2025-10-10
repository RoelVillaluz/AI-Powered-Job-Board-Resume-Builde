import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/styles.css'
import './styles/navbar.css'
import './styles/forms.css'
import './styles/animations.css'
import './styles/analysis.css'
import './styles/jobs.css'
import './styles/skeleton.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <App />
)
