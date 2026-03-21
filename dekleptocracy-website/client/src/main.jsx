import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.jsx';
import { initWebVitals } from './utils/webVitals';
import { initDebugCommands } from './utils/debugCommands';

// Enforce HTTPS in production
if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  window.location.protocol === 'http:' &&
  window.location.hostname !== 'localhost'
) {
  window.location.href = window.location.href.replace('http:', 'https:');
}

// Initialize monitoring
initWebVitals();
initDebugCommands();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
