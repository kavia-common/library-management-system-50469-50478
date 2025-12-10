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

## Accessibility
- Modal dialogs: role="dialog", Escape to close.
- Buttons with ARIA labels.
- Live region for toasts.

## Project Structure
- `src/components` — UI components
- `src/pages` — pages
- `src/services` — API services
- `src/i18n` — i18n initialization

## Where to Extend
- Replace mock recommendation algorithms with backend endpoints.
- Integrate real notifications backed by server APIs.
