# Library Frontend (Ocean Professional)

React frontend for the Library app with a modern, responsive UI.

## Features
- Top navigation with theme toggle (light/dark)
- Search bar for books
- Responsive book grid and details view
- Accessible details modal (ESC/backdrop close)
- Environment-driven API base URL with mock fallback

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

## Connecting to a Real API
All API calls are centralized in `src/services/api.js`.
- Replace or extend `apiFetch` and the endpoints as needed.
- Current endpoints used:
  - `GET {API_BASE}/books` -> list of books
  - `GET {API_BASE}/books/:id` -> details for a book

If requests fail (e.g., no backend running), the UI falls back to mock data so you can continue development.

## Project Structure
- `src/components` — NavBar, SearchBar, BookCard, BookGrid, BookDetailModal
- `src/pages` — Home (search + grid), BookDetails (route)
- `src/services/api.js` — API base and functions
- `src/theme/ThemeContext.js` — Light/Dark theme toggle
- `src/App.js` — Router and app shell

## Accessibility
- Keyboard-friendly buttons and links
- Proper `role="dialog"` aria markup for modal
- Live regions are kept minimal to avoid noise
- Labelled search input

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
