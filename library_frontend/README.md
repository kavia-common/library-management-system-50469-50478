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
  - getUserStats() -> { points, currentStreak, bestStreak, lastReadDate, badges: [...], progress: {...}, pagesRead, minutesRead }
  - recordReadingActivity({ pages, minutes }) -> updates streak, badges, points; returns updated stats and `_newBadges` (mock)
  - getLeaderboard({ period }) -> array of { rank, userId, displayName, points, currentStreak, pagesRead }
  - listBadgesCatalog() -> badge catalog
  - getOrCreateUserId() -> persisted local user id
- If REACT_APP_API_BASE is unset or backend endpoints are unavailable, a mock service persists to localStorage:
  - streak increments for consecutive days; resets otherwise
  - badges: First Read, 7-day Streak, 30-day Streak, 100 Pages, Early Bird (3 mornings), Night Owl (3 nights)
  - leaderboard merges your local stats into seeded sample data

Backend Contract (switch-ready):
- GET /gamification/stats -> returns current user stats
- POST /gamification/activity { pages, minutes, timestamp? } -> returns updated stats
- GET /gamification/leaderboard?period=weekly|monthly|all -> returns leaderboard rows
Stats example:
{
  "userId": "u_xxx",
  "displayName": "You",
  "points": 120,
  "pagesRead": 80,
  "minutesRead": 60,
  "currentStreak": 3,
  "bestStreak": 5,
  "lastReadDate": "2025-01-12",
  "badges": [{ "id": "first_read", "nameKey": "gam.badges.firstRead.name", "descKey": "gam.badges.firstRead.desc", "emoji":"📖", "earnedAt":"2025-01-10T10:00:00Z" }],
  "progress": { "pages100": 80, "earlyBirdDays": 2, "nightOwlDays": 1 }
}

Integration:
- BookDetails has a “Log reading” button (5 pages / 10 minutes quick log).
- Home/NavBar display the GamificationSummary linking to the /gamification page.
- Toasts notify about recorded activity, continued streaks, or newly earned badges.

Styling & Accessibility:
- Ocean Professional theme, focus-visible outlines, ARIA roles for progress and table, keyboard navigation in leaderboard.
- Reduced-motion friendly: no heavy animations when prefers-reduced-motion is set.

Switching to a real backend:
- Set REACT_APP_API_BASE to your backend; the app will call the endpoints above.
- Ensure authentication and user identity handling is implemented server-side; on the frontend we keep a simple local userId only for mock mode.

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

## Staff Management (RBAC & Mock Backend)
Routes:
- /staff — StaffDashboard
- /staff/libraries — Libraries CRUD (name, address, hours)
- /staff/users — Staff list, assign roles & permissions
- /staff/roles — Role definitions and permissions toggles
- /staff/activity — Recent activity
- /staff/login — Mock login to choose role when no backend

Auth & RBAC:
- src/context/AuthContext.js provides currentUser, hasRole(), hasPermission(), loginAsRole() for mock.
- Default role-permission map:
  - ADMIN: [manage_libraries, manage_staff, manage_inventory, view_reports]
  - LIBRARIAN: [manage_inventory, view_reports]
  - ASSISTANT: [view_reports]

Services:
- src/services/staff.js exports:
  - getLibraries({ query, page, pageSize }), createLibrary(data), updateLibrary(id, data), deleteLibrary(id)
  - getStaffUsers(), updateStaffUserRoles(userId, roles)
  - getRoles(), updateRolePermissions(role, permissions)
  - getActivityLog()
- Mock mode uses localStorage keys: staff:libraries, staff:users, staff:roles, staff:activity. Seeded with sample data.
- Set REACT_APP_API_BASE to switch to real backend; endpoints expected under /staff/*.

Suggested Backend Contracts:
- GET /staff/libraries?q=&page=&pageSize=
  -> { items: [{ id, name, address, hours, createdAt }], total, page, pageSize }
- POST /staff/libraries { name, address, hours } -> created library
- PUT /staff/libraries/:id { name?, address?, hours? } -> updated
- DELETE /staff/libraries/:id -> { success: true }
- GET /staff/users -> [{ id, name, email, roles:[], permissions:[] }]
- PUT /staff/users/:id/roles { roles:[] } -> updated user
- GET /staff/roles -> { ROLE: [permissions...] }
- PUT /staff/roles/:role { permissions:[] } -> updated roles map
- GET /staff/activity -> [{ id, actor, action, meta?, timestamp }]

Accessibility & Theme:
- Ocean Professional styling with keyboard-friendly controls, ARIA labels for tables and dialogs.

Tests:
- Protected route behavior
- Libraries CRUD updates in mock store
- Role change reflects in users table
