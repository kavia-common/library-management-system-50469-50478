# Ocean Library Frontend

This React app implements a clean, responsive Library Management UI featuring:
- Top navbar, global search
- Responsive grid of book cards
- Details modal and deep link route /books/:id
- Env-aware data service (REACT_APP_API_BASE or REACT_APP_BACKEND_URL), with mock fallback
- Accessibility for modal (ESC close, focus trap, alt text)

Environment variables (set via .env):
- REACT_APP_API_BASE
- REACT_APP_BACKEND_URL
- REACT_APP_PORT (defaults 3000)

Scripts:
- npm start
- npm run build

Design theme: Ocean Professional
