import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeErrorTracking } from './lib/errorTracking'

// 🚨 Inicializar sistema de rastreamento de erros
initializeErrorTracking();

createRoot(document.getElementById("root")!).render(<App />);
