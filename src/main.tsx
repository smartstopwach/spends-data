import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initPwa } from './utils/pwaInstall';
import { setupNativeShell } from './utils/native';

void setupNativeShell();

// Capture the install prompt before React mounts so the browser event is never missed.
initPwa();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
