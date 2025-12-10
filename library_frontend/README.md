# Library Frontend (Ocean Professional)

React frontend for the Library app with a modern, responsive UI.

## Features
- Top navigation with theme toggle (light/dark)
- Language switcher (i18n) with persistence
- Search bar for books
- Responsive book grid and details view
- Accessible details modal (ESC/backdrop close)
- Environment-driven API base URL with mock fallback
- Locale-aware book fields (title, description) with graceful fallback
- RTL direction support for RTL languages
- Notifications Center with mock data and preferences (Due Dates, New Arrivals, Personalized)
- Recommendations: Trending, Favorites-based, and Users-also-borrowed
- Offline Mode: Service Worker caching, IndexedDB data cache, offline queue & background sync

## Getting Started
- Install: `npm install`
- Run dev: `npm start`
- Test: `npm test`
- Build: `npm run build`

## Environment Variables
This app reads the base URL for the backend from the following variables (first non-empty wins):
- `REACT_APP_API_BASE`
- `REACT_APP_BACKEND_URL`

If none are set, it defaults to relative `/api`.

Optional variables you might set:
- `REACT_APP_FRONTEND_URL`
- `REACT_APP_WS_URL`
- `REACT_APP_NODE_ENV`, `REACT_APP_ENABLE_SOURCE_MAPS`, `REACT_APP_PORT`, etc.

Create a `.env` file (do not commit secrets):
```
REACT_APP_API_BASE=https://your-backend.example.com
```

## Internationalization (i18n)
We use `i18next` + `react-i18next` with a default language `en` and `es` as an example. See `src/i18n/index.js` for initialization. Translation keys live in `src/locales/<lang>/translation.json`.

## Recommendations
Includes Trending, Favorites-based, and Users-also-borrowed flows. See `src/services/api.js`.

## Notifications
Mock notifications with Preferences are persisted in localStorage. See `src/components/NotificationsCenter.js`.

## Offline Mode

### Overview
The app supports offline-first browsing:
- Service Worker (public/service-worker.js) precaches the app shell and caches runtime requests:
  - Cache-first for static JS/CSS and images.
  - Network-first with fallback for API JSON (e.g., `/api/books`, `/api/books/:id`, recommendations).
- IndexedDB (src/storage/db.js) stores:
  - `books` — cached book list and details
  - `favorites` — favorite IDs
  - `pendingActions` — offline actions queue
  - `metadata` — misc metadata (e.g., migration flags)

### Data Flow
- On successful API fetches, book data is persisted to IndexedDB for offline reuse.
- When offline (or network fails):
  - `getBooks()` and `getBookById()` serve from IndexedDB if available, else fall back to mock data.
- Favorites:
  - Migrated from localStorage to IndexedDB on first run (mirror kept for backward compatibility).
  - Toggling favorites enqueues an action when offline; UI updates optimistically and syncs later.

### Offline Queue & Sync
- `src/services/sync.js` manages:
  - Online/offline detection (navigator.onLine + events).
  - `queueToggleFavorite` to record user actions with timestamps and idempotency keys.
  - `flushQueue` to replay queued actions when online.
  - If a backend is configured (`REACT_APP_API_BASE` present), it will call a sample `/favorites/toggle` endpoint (idempotent writes recommended).
  - If no backend is configured, local state (IndexedDB) remains the source of truth and actions are considered synced locally.
- Auto sync starts on app load and flushes on reconnect. A toast “All changes synced” is shown after a successful flush.

### UI & UX
- NavBar shows an inline Online/Offline dot indicator with tooltips and ARIA labels.
- Toasts:
  - “You are offline. Changes will sync when you’re back online.”
  - “Back online. Attempting to sync changes…”
  - “All changes synced”
  - SW update availability notifications.

### Service Worker updates
- On a new version, a toast informs the user that a reload is available.
- On reload, SW controllerchange displays “App updated”.

### Develop & Test Offline
- Start the app: `npm start`
- Open DevTools → Network → toggle “Offline”.
- The app shell and last-fetched books remain available.
- Toggling a favorite offline will queue the change; go back online to trigger sync.
- To simulate a backend, set `REACT_APP_API_BASE` to your server. Favorites endpoint should be idempotent:
  - POST `/favorites/toggle` body: `{ id: "bookId", favorite: true|false }` → `{ ok: true }`

## Accessibility
- Modal dialogs: role="dialog", Escape to close.
- Buttons with ARIA labels.
- Live region for toasts.

## Project Structure
- `src/components` — UI components
- `src/pages` — pages
- `src/services` — API and sync services
- `src/storage` — IndexedDB wrapper
- `public/service-worker.js` — Service Worker

## Where to Extend
- Replace mock recommendation algorithms with backend endpoints.
- Extend background sync to handle additional actions (e.g., mark notifications read on backend).
