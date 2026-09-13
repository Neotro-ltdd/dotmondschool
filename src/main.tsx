import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.tsx';

// Explicitly register service worker for auto-update & offline readiness
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] A new version of the Dotmond Portal is available.');
    window.dispatchEvent(
      new CustomEvent('srms_pwa_need_refresh', {
        detail: {
          updateServiceWorker: () => updateSW(true),
        },
      }),
    );
  },
  onOfflineReady() {
    console.log('[PWA] Dotmond School Portal is ready for offline use.');
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
