# Library Frontend (Ocean Professional)

React frontend for the Library app with a modern, responsive UI.

## Features
- Top navigation with theme toggle (light/dark)
- Staff management (mock RBAC, localStorage-backed data, ready for backend)
- Language switcher (i18n) with persistence
- Search bar for books
- Responsive book grid and details view
- Accessible details modal (ESC/backdrop close)
- Environment-driven API base URL with mock fallback
- Locale-aware book fields (title, description) with graceful fallback
- RTL direction support for RTL languages
- Notifications Center with mock data and preferences (Due Dates, New Arrivals, Personalized)
- Recommendations: Trending, Favorites-based, and Users-also-borrowed
- Gamification: Achievements, daily streaks, and leaderboard (with mock localStorage fallback)
- Events & Activities: Calendar/list, event details with RSVP/reminders, and Reading Challenges
- Tags & Genres taxonomy: manage genres/tags, tag books, and filter grid

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
- `REACT_APP_FEATURE_FLAGS` (JSON) for optional flags like `{ "gamification": true }`

Create a `.env` file (do not commit secrets):
```
REACT_APP_API_BASE=https://your-backend.example.com
```

## Internationalization (i18n)
We use `i18next` + `react-i18next` with a default language `en` and `es` as an example. See `src/i18n/index.js` for initialization. Translation keys live in `src/locales/<lang>/translation.json`.

## Tags & Genres (Taxonomy)

This frontend supports customizable Tags and Genres for improved organization and discovery.

Features:
- Staff management UI (Staff → Taxonomy) for CRUD on Tags and Genres.
- Book-level tagging via a Tagging Panel in Book Details (visible to staff with manage_inventory; available in mock mode).
- Home FiltersBar for multi-select filtering by tags and genres.
- i18n support (en/es) for all labels and messages.

Dual mode:
- Real API mode: when `REACT_APP_API_BASE` is defined, requests are sent to:
  - `GET /taxonomy/genres?q=...`
  - `POST /taxonomy/genres` { name, description?, color? }
  - `PUT /taxonomy/genres/:id`
  - `DELETE /taxonomy/genres/:id`
  - `GET /taxonomy/tags?q=...`
  - `POST /taxonomy/tags`
  - `PUT /taxonomy/tags/:id`
  - `DELETE /taxonomy/tags/:id`
  - `GET /books/:id/taxonomy`
  - `PUT /books/:id/taxonomy` { tags: [tagId], genres: [genreId] }

- Mock mode: when `REACT_APP_API_BASE` is not set, the app uses localStorage:
  - Keys: `taxonomy:genres`, `taxonomy:tags`, `taxonomy:bookIndex`.
  - Seeds: Genres (Fiction, Non-Fiction, Mystery, Sci-Fi) and Tags (Award-winning, Classic, New).
  - IDs are stable for seeds and UUID for new items.
  - `services/api.getBooks()` merges taxonomy assignments so filters work uniformly in both modes.

Validation:
- Name is required and must be unique (case-insensitive) within its type.

Accessibility & Styling:
- Ocean Professional theme: subtle shadows, rounded corners, focus-visible outlines.
- Modals and lists include ARIA attributes and keyboard-accessible controls.

Example payloads:
- Create Tag: `{ "name": "Bestseller", "description": "Top selling books", "color": "#F59E0B" }`
- Assign to book: `{ "tags": ["tag_award"], "genres": ["genre_scifi"] }`

## Recommendations
Includes Trending, Favorites-based, and Users-also-borrowed flows. See `src/services/api.js`.

## Gamification
UI components:
- BadgeIcon: accessible badge visuals with tooltips and labels.
- AchievementsPanel: lists earned/locked badges + progress (pages towards 100, early bird/night owl).
- StreakCounter: current and best daily streak with a “Log reading” CTA.
- Leaderboard: weekly/monthly/all-time tabs with keyboard navigation.
- GamificationSummary: compact header widget showing points, streak, and next badge.

Page/Route:
- /gamification shows streak, log form, achievements, and leaderboard.
- Home and NavBar show a compact summary.

State & Services:
- `src/services/gamification.js` exports:
  - getUserStats(), recordReadingActivity(), getLeaderboard(), listBadgesCatalog(), getOrCreateUserId()
- Mock mode uses localStorage; set REACT_APP_API_BASE to switch to real backend.

## Events & Activities

Route:
- `/events` — EventsPage with Calendar + List, Filters, and Reading Challenges section.

Components:
- EventsCalendar (month/week/list toggles) with keyboard navigation and ARIA roles
- EventsList (accessible grouped list)
- EventDetails modal with full details, RSVP (Going/Interested/Not going), Add to calendar (ICS), and Remind me (1h/1d)
- ChallengesSection for reading challenges (join/leave, progress)

Services:
- `src/services/events.js` exports:
  - getEvents({ from, to, category, libraryId })
  - getEventById(id)
  - rsvpEvent(id, status) // 'going' | 'interested' | 'not_going' | null
  - getRsvps()
  - buildIcs(event), downloadIcs(event)
  - remindMe(eventId, option) // '1h' | '1d'
  - getChallenges(), joinChallenge(id), leaveChallenge(id), recordChallengeProgress(id, { amount })

Mock data and persistence (when REACT_APP_API_BASE is not set):
- Seeds sample events: library events, monthly book club (simple recurrence), workshops.
- Seeds reading challenges (“20 Books in 2025”, “Winter Reading Sprint”).
- Persists to localStorage keys:
  - `events:data`, `events:rsvps`, `events:challenges`, `events:reminders`.

Suggested backend contracts (switch-ready):
- GET `/events?from=&to=&category=&libraryId=` -> `[Event]`
- GET `/events/:id` -> `Event`
- POST `/events/:id/rsvp` body `{ status: 'going'|'interested'|'not_going' }`
- GET `/events/rsvps` -> `{ [eventId]: 'going'|'interested'|'not_going' }`
- GET `/challenges` -> `{ list: Challenge[], memberships: { [challengeId]: { progress:number, joinedAt } } }`
- POST `/challenges/:id/join`
- POST `/challenges/:id/leave`
- POST `/challenges/:id/progress` body `{ amount:number }`

Event model (suggestion):
```
{
  id: string,
  title: string,
  category: 'library'|'book_club'|'workshop'|'challenge',
  description: string,
  organizer?: string,
  location?: { libraryId: string, room?: string },
  start: ISOString,
  end: ISOString,
  capacity?: number,
  referencedBookIsbn?: string
}
```

Challenge model:
```
{
  id: string,
  title: string,
  description: string,
  unit: 'pages'|'books',
  target: number,
  start: ISOString,
  end: ISOString,
  active: boolean
}
```

Examples:
- Filter by category: `getEvents({ category: 'book_club' })`
- Filter by date range: `getEvents({ from: '2025-01-01', to: '2025-02-01' })`
- RSVP example: `rsvpEvent('evt-1','going')`
- Join challenge: `joinChallenge('ch-20-books-2025')` then `recordChallengeProgress('ch-20-books-2025', { amount: 1 })`

Notifications integration:
- "Remind me" schedules a mock notification at event start minus 1 hour or 1 day, storing in localStorage and optionally calling a notifications mock. Replace with a real notification service as needed.

## Notifications
Mock notifications with Preferences are persisted in localStorage. See `src/components/NotificationsCenter.js`.

## Accessibility
- Modal dialogs: role="dialog", Escape to close.
- Buttons with ARIA labels.
- Live region for toasts.
- Calendar and lists: ARIA roles (grid/list), keyboard navigation, focus-visible outlines.

## Project Structure
- `src/components` — UI components
- `src/pages` — pages
- `src/services` — API services
- `src/i18n` — i18n initialization

## Staff Management (RBAC & Mock Backend)
Routes:
- /staff — StaffDashboard
- /staff/libraries — Libraries CRUD (name, address, hours)
- /staff/users — Staff list, assign roles & permissions
- /staff/roles — Role definitions and permissions toggles
- /staff/activity — Recent activity
- /staff/login — Mock login to choose role when no backend
- /staff/taxonomy — Manage Tags & Genres (new)

Auth & RBAC:
- src/context/AuthContext.js provides currentUser, hasRole(), hasPermission(), loginAsRole() for mock.

Suggested Backend Contracts for Taxonomy:
- GET /taxonomy/genres?q=
- POST /taxonomy/genres
- PUT /taxonomy/genres/:id
- DELETE /taxonomy/genres/:id
- GET /taxonomy/tags?q=
- POST /taxonomy/tags
- PUT /taxonomy/tags/:id
- DELETE /taxonomy/tags/:id
- GET /books/:id/taxonomy
- PUT /books/:id/taxonomy

Styling & Theme:
- Ocean Professional styling with keyboard-friendly controls, ARIA labels for tables and dialogs.

Tests:
- Staff protected route behavior and CRUD in mock store
- Events: calendar render, RSVP updates, reminders, challenges progress, i18n keys resolve
- Taxonomy: CRUD via mock service, book tagging flows update UI, filters reduce grid results
