import { createRoot } from 'react-dom/client'
import App from './App'
// Tailwind & base styles (was missing, causing unstyled markup)
import './index.css'

createRoot(document.getElementById('root') as HTMLElement).render(<App />)
