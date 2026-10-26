# LifeOS

LifeOS is a responsive personal life dashboard for tasks, goals, habits, planning, expenses, and activity analytics. The client uses React, Vite, Tailwind CSS, React Router, Framer Motion, Lucide, and Recharts. No database is required for the demo.

## Run locally

Requirements: Node.js 20+ and npm.

```sh
npm install
cd server && npm install && cd ..
copy .env.example .env
copy server/.env.example server/.env
npm run dev
```

The root development command starts both the Vite client and Express API. Keep that terminal open while using LifeOS. The client runs at http://localhost:5173 and the API at http://localhost:4000.

Open http://localhost:5173 and register an account. Authentication is handled by the Express API; the browser stores no password or password hash. App activity persists in localStorage, keyed by the authenticated account ID, so separate accounts have separate task, goal, habit, planner, and expense data.

## Express authentication API

The Express API includes registration, login, logout, current-user, profile update, Google/GitHub OAuth callbacks, and health endpoints. Account records and bcrypt hashes are stored server-side in `server/data/users.json`; they are never written to browser storage or returned by the API. This file store survives restarts but is a local-demo store, not a production database. Protect and back up this file, and replace the repository with Mongoose when adding MongoDB.

```sh
cd server
npm install
copy .env.example .env
npm run dev
```

Set `SESSION_SECRET` to a long random value and `CLIENT_ORIGIN` to the client origin(s). The API uses HttpOnly, same-site cookies and bcrypt password hashes. MongoDB is not currently connected. In the current design, browser localStorage contains only LifeOS app data keyed by the server-issued account ID; logout does not erase that data.

API routes include `GET /api/health`, register/login/logout/me/profile routes, and `/api/auth/google` and `/api/auth/github` OAuth starts with matching `/callback` routes. Password recovery returns 501 until email delivery is configured.

## Optional Google and GitHub sign-in

OAuth is implemented but stays unavailable until provider credentials are configured. Create OAuth apps with these local callback URLs:

- Google authorized redirect URI: `http://localhost:4000/api/auth/google/callback`
- GitHub authorization callback URL: `http://localhost:4000/api/auth/github/callback`

Copy `server/.env.example` to `server/.env`, then fill in `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`. Keep those secrets in the server environment only. The configured callback URL must exactly match the provider console. Google requests `openid email profile`; GitHub requests `read:user user:email` and needs a verified email address. On a deployed site, use the deployed HTTPS API callback URL and set `API_ORIGIN` and `CLIENT_ORIGIN` to the matching origins.

## Features

- Responsive dark dashboard with live task, goal, and habit metrics and a seven-day activity chart.
- Backend registration and sign-in by username or email, OAuth starts/callbacks, password visibility and strength hints, and account-scoped local data.
- Task create/edit/delete, status changes, due dates, priorities, filtering, search, and sorting.
- Goal progress tracking, habit check-ins and weekly history, daily planner events, expense categories and history.
- Analytics from actual stored activity, profile/preferences, JSON export, and demo-data clearing.
- Express auth endpoints with server-side validation, bcrypt, HttpOnly cookie sessions, CORS, and centralized errors.

## Notes and optional integrations

OAuth login creates or finds an account only after the provider callback and verified identity succeed; missing credentials return a clear login-page error. Email recovery still needs an email provider. For a deployment, persist app entities server-side and add rate limiting. See `server/.env.example` for provider variables.
