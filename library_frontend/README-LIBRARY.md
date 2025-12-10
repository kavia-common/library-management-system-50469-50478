# Ocean Library Frontend

This React app implements a clean, responsive Library Management UI featuring:
- Top navbar, global search
- Responsive grid of book cards
- Details modal and deep link route /books/:id
- Book Management page (/manage) with Create, Update, Delete
- Env-aware data service (REACT_APP_API_BASE or REACT_APP_BACKEND_URL), with localStorage-backed mock fallback
- Accessibility for modals/dialogs (ESC close, focus trap, alt text, labels and aria states)

Environment variables (set via .env):
- REACT_APP_API_BASE
- REACT_APP_BACKEND_URL
- REACT_APP_PORT (defaults 3000)

Scripts:
- npm start
- npm run build

Design theme: Ocean Professional

## Book Management

Navigate to "Manage Books" from the top navbar or /manage.

Features:
- Add new books (title, author, genre, year)
- Edit existing books
- Delete books with confirmation
- Client-side validation with accessible labels and error messages
- Optimistic updates with automatic list refresh and error handling

## Data Service (API-first with mock fallback)

The service checks for an API base URL using the first non-empty of:
- REACT_APP_API_BASE
- REACT_APP_BACKEND_URL

Endpoints expected when API is configured:
- GET    {BASE}/books
- POST   {BASE}/books
- GET    {BASE}/books/:id
- PUT    {BASE}/books/:id
- DELETE {BASE}/books/:id

When API is not configured or a request fails, the app falls back to mock data persisted in localStorage:
- Key: ocean-library-books
- Initially seeded from src/mocks/books.json
- createBook, updateBook, deleteBook persist to localStorage

Form payloads:
- { title, author, genre, year }
The service normalizes this to the internal structure (genres array).

## Accessibility

- Modals and confirmation dialog support:
  - aria-modal, role="dialog"
  - ESC to close
  - Focus trap within dialog
- Form fields include associated labels and aria-invalid/error descriptions.

## Environment

Create a .env file at project root (do not commit secrets). Example:

REACT_APP_API_BASE=https://api.example.com
# or
# REACT_APP_BACKEND_URL=https://backend.example.com
REACT_APP_PORT=3000

If neither REACT_APP_API_BASE nor REACT_APP_BACKEND_URL is set, the app operates entirely on localStorage-backed mock data.

