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

Optional variables you might set (already available in environment list):
- `REACT_APP_FRONTEND_URL`
- `REACT_APP_WS_URL`
- `REACT_APP_NODE_ENV`, `REACT_APP_ENABLE_SOURCE_MAPS`, `REACT_APP_PORT`, etc.

Create a `.env` file (do not commit secrets):
```
REACT_APP_API_BASE=https://your-backend.example.com
```

## Internationalization (i18n)
We use `i18next` + `react-i18next` with a default language `en` and `es` as an example.

- Initialization: `src/i18n/index.js`
- Translation resources:
  - `src/locales/en/translation.json`
  - `src/locales/es/translation.json`
- Language switching is available in the NavBar via a select input. The choice is persisted to `localStorage` using the `i18nextLng` key.
- RTL support: for RTL languages (e.g., `ar`, `he`, `fa`, `ur`), the document `dir` attribute is set to `rtl` automatically.

### Adding a New Language
1. Create a new resource file, e.g. `src/locales/fr/translation.json` with the same keys as existing translations.
2. Register it in `src/i18n/index.js`:
   ```
   import fr from '../locales/fr/translation.json';
   // ...
   resources: {
     en: { translation: en },
     es: { translation: es },
     fr: { translation: fr }
   }
   ```
3. Add the language option to the select in `src/components/NavBar.js`.
4. If the language is RTL, add its code to the `RTL_LANGS` set in `src/i18n/index.js`.

### Adding New Translation Keys
- Add the new key to all translation files in `src/locales/<lang>/translation.json`.
- Use it in components via `const { t } = useTranslation();` and `t('your.key')`.

### Localized Book Data from Backend
Backend responses may include localized fields:
- `title_translations`: `{ "en": "Title", "es": "Título" }`
- `description_translations`: `{ "en": "Description", "es": "Descripción" }`

The frontend maps these into locale-aware getters in `src/services/api.js`:
- `book.titleFor(lang)` -> returns localized title with fallback to default `book.title`
- `book.descriptionFor(lang)` -> returns localized description with fallback to `book.description`

Your backend can populate these fields for supported languages. If they’re missing, the UI gracefully falls back to the default fields.

#### Example backend book object
```
{
  "id": "1",
  "title": "The Ocean Between Us",
  "author": "Sarah Daniels",
  "year": 2021,
  "isbn": "9781234567890",
  "tags": ["Fiction", "Drama"],
  "description": "A moving tale...",
  "title_translations": { "es": "El Océano Entre Nosotros" },
  "description_translations": { "es": "Un relato conmovedor..." }
}
```

## Notifications

### Overview
The app includes a Notifications Center with:
- Types: due_date, new_arrival, personalized
- Read/unread state and timestamps
- Actions: View Book, Snooze, Mark as Read, Mark All as Read
- Preferences: enable/disable categories, frequency (immediate/daily), default snooze duration

A client-side scheduler (every 60s) synthesizes due date reminders from mock loans.

### UI Components
- `NotificationsBell` (in NavBar): shows unread count badge.
- `NotificationsCenter` (modal): lists notifications with actions.
- `PreferencesModal`: manage categories, frequency, snooze.
- `ToastProvider`: transient feedback (e.g., "Marked as read").

### Persistence
- Notifications stored at `localStorage["notifications.list"]`
- Preferences stored at `localStorage["notifications.preferences"]`

### Mock vs Backend
Currently a mock service is provided in `src/services/api.js`. To integrate a real backend, implement these endpoints on your server and set `REACT_APP_API_BASE`:

Expected API (suggested shapes):
- GET `/notifications` -> `[ { id, type, timestamp, read, bookId?, bookTitle?, dueAt?, snoozedUntil? } ]`
- POST `/notifications/:id/read` -> `{ ok: true }`
- POST `/notifications/read-all` -> `{ ok: true }`
- POST `/notifications/:id/snooze` body: `{ durationMinutes }` -> `{ ok: true, snoozedUntil }`
- GET `/notification-preferences` -> `{ enableDueDate, enableNewArrival, enablePersonalized, frequency, defaultSnooze }`
- PUT `/notification-preferences` body: same shape -> saved preferences

The frontend is ready to switch to real endpoints by replacing the mock storage calls in `src/services/api.js` with `apiFetch` calls.

### Accessibility
- Modal dialogs: `role="dialog"` and Escape to close.
- Buttons with ARIA labels.
- Live region for toasts.
- Keyboard reachable controls.

## Project Structure
- `src/components` — NavBar, SearchBar, BookCard, BookGrid, BookDetailModal, NotificationsBell, NotificationsCenter, PreferencesModal, ToastContext
- `src/pages` — Home (search + grid), BookDetails (route)
- `src/services/api.js` — API base and functions; books APIs and notifications service
- `src/theme/ThemeContext.js` — Light/Dark theme toggle
- `src/i18n/index.js` — i18n initialization (provider is loaded at `src/index.js`)
- `src/locales/<lang>/translation.json` — Translation resources
- `src/App.js` — Router and app shell

## Accessibility
- Keyboard-friendly buttons and links
- Proper `role="dialog"` aria markup for modal
- Live regions are kept minimal to avoid noise
- Labelled search input
- Language select with accessible label
- Document direction updated for RTL languages

## Styling
Ocean Professional palette:
- Primary: `#2563EB`
- Secondary: `#F59E0B`
- Error: `#EF4444`
- Background: `#f9fafb`
- Surface: `#ffffff`
- Text: `#111827`

Utilities live in `src/index.css`. Component-level styles are inline for simplicity but can be migrated to CSS modules if preferred.

## Where to Extend
- Add pagination or filters in `Home.js`
- Add create/edit functionality and forms
- Replace mock images with real cover URLs from API
- Replace mock notifications with backend polling, webhooks, or WebSockets
