import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import * as Sentry from "@sentry/react";
import './sentry.client.config';
import './index.css';

// Create root once
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);

// Error boundary fallback
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-[#00f0ff] text-2xl font-bold mb-4">SYSTEM ERROR</h1>
        <p className="text-[#e2e2e2] mb-6 max-w-md">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#00f0ff] text-black font-semibold py-3 px-6 rounded hover:bg-[#00d0e0] transition-colors"
        >
          Reload System
        </button>
      </div>
    </div>
  );
}

// Render App with Sentry and AuthProvider
root.render(
  <StrictMode>
    <AuthProvider>
      <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
        <App />
      </Sentry.ErrorBoundary>
    </AuthProvider>
  </StrictMode>
);

// Hide loading screen after app mounts
setTimeout(() => {
  const loadingScreen = document.getElementById('hasex-loading-overlay');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.remove();
    }, 300);
  }
}, 100);
