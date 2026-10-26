# LifeOS

LifeOS is a responsive personal dashboard for tasks, goals, habits, daily planning, expenses, and activity analytics.

## Frontend-only college demo

The Vercel frontend does not require the Express backend or a database. The sign-in screen uses local demo accounts stored in the current browser. Passwords are stored as salted PBKDF2 hashes, but browser-side authentication is **DEMO ONLY** and is not secure authentication. Do not use a real password or sensitive information. Each browser has its own demo accounts and data.

Run the frontend locally:

```sh
npm install
npm run dev
```

Open the Vite URL printed in the terminal (usually http://localhost:5173). Register a demo account, then use its username or email and password to sign in. `npm run dev` starts only Vite; it does not start or contact Express. You can deploy the frontend to Vercel without setting an API URL.

## Local persistence

Demo account records are stored in `localStorage` under `lifeos_demo_accounts_v1`; they contain password hashes and salts, never plaintext passwords. The active demo session uses `lifeos_demo_session_v1`. Tasks, goals, habits, planner events, and expenses continue to use the existing account-scoped keys `lifeos_data_v1_<account-id>`.

Signing out removes only the active demo session. It does not remove accounts or LifeOS activity. Existing storage keys from previous versions are left untouched. Since old server account IDs cannot be reliably matched to a new browser-only demo account without the backend, their data is not automatically moved or shared; it remains in localStorage under its original key.

## Existing Express backend

The optional backend remains in `server/` and is not used by the frontend demo. Start it separately only if you are working on backend development:

```sh
npm run server
```

The backend currently persists users in `server/data/users.json`. A serverless Vercel filesystem is not a persistent database, so that backend can continue to report a filesystem error if deployed there. It can remain undeployed/unused for the college demonstration; the frontend no longer sends auth or data requests to it.

## Features

- Responsive dashboard, charts, and analytics.
- Task create/edit/delete, status changes, due dates, priorities, filtering, search, and sorting.
- Goal progress, habit check-ins, weekly history, planner events, and expense tracking.
- Profile preferences, JSON export, and demo-data clearing.
- Local demo registration/login by username or email, persistent browser session, and logout.
