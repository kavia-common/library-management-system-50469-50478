import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App';

// Simple SW update notification via custom event
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
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
          // ignore registration errors
        });

      // When the new SW takes control after reload, we can notify that app is up-to-date.
      navigator.serviceWorker.addEventListener?.('controllerchange', () => {
        window.dispatchEvent(new CustomEvent('sw:updated'));
      });
    });
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register at the end to not block first paint
registerServiceWorker();
