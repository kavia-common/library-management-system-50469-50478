# Ocean Library Frontend

This React app implements a clean, responsive Library Management UI featuring:
- Top navbar, global search
- Responsive grid of book cards
- Details modal and deep link route /books/:id
- Book Management page (/manage) with Create, Update, Delete
- Dashboard (/dashboard) with summary cards and recent additions
- Favorites and Reviews with API-first behavior and localStorage fallback
- Borrow/Return with due dates, reminders on Home and Dashboard
- User Profiles (/profile): profile customization, personal reading lists, borrowing history
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

## User Profiles

Navigate to "Profile" from the top navbar or /profile.

Includes:
- Profile Info
  - Edit display name
  - Avatar URL or initials (fallback badge when no avatar URL)
  - Theme preference: light, dark, or system (stored client-side and via API when available)
- Reading Lists
  - Default lists: Want to Read, Currently Reading, Finished
  - Create/Rename/Delete custom lists
  - Add/Remove books to/from lists from BookCard and BookDetailsModal via "Lists ▾" menus
  - API-first persistence with localStorage fallback
- Borrowing History
  - Chronological list of borrowed/returned books with dates and dueDate
  - Filters: all, active (not returned yet), returned, overdue
  - Uses backend when available; otherwise relies on client-side recorded events

### Expected backend endpoints (API-first)

Base URL controlled by REACT_APP_API_BASE or REACT_APP_BACKEND_URL.

Profile:
- GET    {BASE}/user/profile
  - returns { displayName, avatarUrl, initials, theme }
- PUT    {BASE}/user/profile
  - body: { displayName?: string, avatarUrl?: string, initials?: string, theme?: "light"|"dark"|"system" }
  - returns updated profile

Reading Lists:
- GET    {BASE}/user/reading-lists
  - returns { lists: [{ id, name, isDefault, bookIds: [string] }, ...] }
- POST   {BASE}/user/reading-lists
  - body: { name: string }
  - returns { lists: [...] }
- PATCH  {BASE}/user/reading-lists/:listId
  - body: { name: string }
  - returns { lists: [...] }
- DELETE {BASE}/user/reading-lists/:listId
  - returns { lists: [...] }
- POST   {BASE}/user/reading-lists/:listId/books
  - body: { bookId: string }
  - returns { lists: [...] }
- DELETE {BASE}/user/reading-lists/:listId/books/:bookId
  - returns { lists: [...] }

Borrowing History:
- GET    {BASE}/user/borrow-history?filter=(all|active|returned|overdue)
  - returns [{ id, bookId, title, borrowedAt, returnedAt|null, dueDate|null }, ...]

Fallback storage keys when no API:
- ocean-library-user-profile
- ocean-library-reading-lists
- ocean-library-borrow-history

## Borrowing System

Books include:
- borrowed: boolean
- dueDate: ISO string or null

UI:
- Book cards and details show a status badge (Available/Borrowed) and due date when borrowed.
- Details modal provides:
  - Borrow action with quick presets (1 week, 2 weeks, 30 days) and a date input for custom due date.
  - Return action when a book is borrowed.
  - Borrow is disabled when already borrowed.
- Manage Books includes optional quick Borrow/Return row actions (quick borrow sets 2-week due date).

Reminders:
- Home shows two small cards:
  - Due Soon (within 3 days)
  - Overdue
- Dashboard adds:
  - Overdue count summary card
  - "Upcoming Due Dates" list (top 5)
These are computed client-side from borrowed/dueDate.

### Backend expectations (API-first)

When API is configured via REACT_APP_API_BASE or REACT_APP_BACKEND_URL, the app calls:

- GET    {BASE}/books
- POST   {BASE}/books
- GET    {BASE}/books/:id
- PUT    {BASE}/books/:id
- DELETE {BASE}/books/:id
- OPTIONAL: GET {BASE}/books/summary
- OPTIONAL: GET {BASE}/books?sort=createdAt&limit=N

Borrow/Return endpoints:
- Preferred:
  - POST {BASE}/books/:id/borrow
    - body: { dueDate: "2025-01-31T23:59:59.000Z" }
    - returns updated book
  - POST {BASE}/books/:id/return
    - returns updated book
- Fallback (if above not available):
  - PATCH {BASE}/books/:id with { borrowed: true, dueDate }
  - PATCH {BASE}/books/:id with { borrowed: false, dueDate: null }

Response shape:
- For both borrow and return, server should return the updated book object including borrowed and dueDate.

### Fallback (no API or API error)

- Uses localStorage key `ocean-library-books`.
- Seeded from src/mocks/books.json on first run.
- Fields:
  - createdAt: generated when missing
  - borrowed: inferred from `available === false` when missing; default false
  - dueDate: null by default
- The borrow/return actions update localStorage accordingly.

## Dashboard

Navigate to "Dashboard" from the top navbar or /dashboard.

Shows:
- Summary cards:
  - Total Books
  - Borrowed Books
  - Overdue (past due date)
- Upcoming Due Dates:
  - List of up to 5 borrowed books due within the next 3 days
- Recent Additions:
  - Latest books sorted by `createdAt` and their timestamps

## Book Management

Navigate to "Manage Books" from the top navbar or /manage.

Features:
- Add new books (title, author, genre, year)
- Edit existing books
- Delete books with confirmation
- Optional quick borrow/return per row
- Client-side validation with accessible labels and error messages
- Optimistic updates with automatic list refresh and error handling

## Favorites

- Mark/unmark a book as favorite from:
  - Book card (star button on the top-right of cover)
  - Book details modal (Favorite button in header)
- Filter favorites from Home via the "☆ Favorites" toggle next to search.

Persistence (API-first):
- If REACT_APP_API_BASE or REACT_APP_BACKEND_URL is configured, the app attempts API endpoints:
  - GET    {BASE}/favorites -> returns ["1","2",... ] or { ids: ["1","2"] }
  - POST   {BASE}/favorites/:id/toggle -> toggles and returns updated list OR
  - PUT    {BASE}/favorites/:id (set) and DELETE {BASE}/favorites/:id (unset) as fallback
- If API not configured/unavailable, localStorage is used:
  - Key: ocean-library-favorites (array of book IDs)

## Reviews

- In the Book Details modal:
  - See a Reviews list with average rating.
  - Submit a new review with an interactive 1..5 star rating and text.
- Average rating shown on cards and in details (computed from reviews when available).

Persistence (API-first):
- GET  {BASE}/books/:id/reviews -> returns array [{ id, user, rating, text, createdAt }, ...] or { reviews: [...] }
- POST {BASE}/books/:id/reviews with body { rating: 1..5, text: string } -> creates review, returns new review or list.
- Fallback: localStorage
  - Key: ocean-library-reviews (object keyed by bookId: string -> array of reviews)

Review data:
- rating: integer 1..5
- text: string
- user: optional (defaults "Anonymous" in fallback)
- createdAt: ISO string

## Data Service (API-first with mock fallback)

The service checks for an API base URL using:
- REACT_APP_API_BASE
- REACT_APP_BACKEND_URL

When API is not configured or a request fails, the app falls back to localStorage:
- Key: ocean-library-books
- Initially seeded from src/mocks/books.json
- createBook, updateBook, deleteBook, borrowBook, returnBook persist to localStorage
- createdAt, borrowed, dueDate normalized when missing

Form payloads:
- { title, author, genre, year }
The service normalizes genre(s) to an array.

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
