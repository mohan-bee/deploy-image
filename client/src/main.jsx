import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google"
import { Toaster } from 'sonner'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId='839691952867-90s7fm74jtb37ms4khbje7msa2oqqtg9.apps.googleusercontent.com'>
      <App />
      <Toaster position="top-right" theme="dark" richColors />
    </GoogleOAuthProvider>
  </StrictMode>,
)
