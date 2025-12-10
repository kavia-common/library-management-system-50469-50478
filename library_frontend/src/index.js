import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App';
import { startAutoSync, initializeFavoritesMigration } from './services/sync';

// Simple SW update notification via custom event
function registerServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Only attempt to register if file exists relative to CRA build (served from public/)
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            // Listen for updates to the service worker.
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (!installingWorker) return;
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  // If there's an existing controller, new content is available.
                  if (navigator.serviceWorker.controller) {
                    // Dispatch a custom event so UI can show a reload toast.
                    window.dispatchEvent(new CustomEvent('sw:update-available'));
                  }
                }
              };
            };
          })
          .catch(() => {
            // ignore registration errors (e.g., file missing in dev)
          });

        // When the new SW takes control after reload, notify that app is up-to-date.
        navigator.serviceWorker.addEventListener?.('controllerchange', () => {
          window.dispatchEvent(new CustomEvent('sw:updated'));
        });
      });
    }
  } catch {
    // ignore if browser does not support SW APIs or unexpected errors
  }
}

async function boot() {
  try {
    // Ensure favorites are migrated to IndexedDB at least once
    await initializeFavoritesMigration();
  } catch {
    // ignore migration errors to avoid breaking UI
  }
  try {
    // Start background auto-sync for offline queue flush
    startAutoSync();
  } catch {
    // ignore if fails (should not break UI)
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize app services and register SW at the end to not block first paint
boot().finally(registerServiceWorker);
