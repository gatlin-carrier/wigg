import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes';
import { initSentry } from './lib/monitoring/sentry';
import * as Sentry from '@sentry/react';

initSentry();

function ErrorButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
    >
      Break the world
    </button>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
const persister = createSyncStoragePersister({ storage: window.localStorage, key: 'wigg-rq' });

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, buster: 'v1', maxAge: 1000 * 60 * 60 * 24 }}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="wigg-theme">
        <AuthProvider>
          <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>}>
            <ErrorButton />
            <App />
          </Sentry.ErrorBoundary>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
