# Upkeep

Property sourcing, leasing, and maintenance ticketing for a Guyana-based
operation. Self-hosted — no third-party BaaS.

This is **Slice 0** of the [build roadmap](./docs/build-roadmap.html): a
walking skeleton. It proves login → API → Postgres works end to end before
any real feature is built on top of it.

## Stack

- **API** — Hono on Node, `apps/api`
- **Web** — React + Vite, `apps/web`
- **Database** — PostgreSQL 16, run via Docker Compose, schema managed with
  Drizzle migrations
- **Auth** — self-rolled session cookies (no external auth service)

## Prerequisites

- Docker Desktop running
- Node.js 20+ and npm

## First-time setup

```bash
# 1. Install dependencies for both apps
npm install

# 2. Start Postgres
docker compose up -d

# 3. Configure the API
cp apps/api/.env.example apps/api/.env
# open apps/api/.env and set SESSION_SECRET to something random
# (openssl rand -hex 32 works well) — the DATABASE_URL default already
# matches docker-compose.yml, no change needed there

# 4. Create the database schema
npm run db:generate   # writes SQL into apps/api/migrations/
npm run db:migrate    # applies it to the running Postgres container

# 5. Seed one Property Manager login
npm run db:seed
# prints the email/password it created — steve@upkeep.local / upkeep-dev
# by default, override with SEED_PM_EMAIL / SEED_PM_PASSWORD env vars
```

## Running it

Two terminals:

```bash
npm run dev:api   # http://localhost:8787
npm run dev:web   # http://localhost:5173
```

Open `http://localhost:5173`, sign in with the seeded login, and you
should see a "● Connected" screen with your email, role, and the
database's current server time — pulled live from Postgres on every load,
not hardcoded.

## What "done" looks like for this slice

- [ ] `docker compose up -d` brings up Postgres cleanly
- [ ] `npm run db:migrate` creates `users` and `sessions` tables
- [ ] `npm run db:seed` creates a login you can actually use
- [ ] Signing in at `localhost:5173` sets a session cookie and shows a
      real database timestamp
- [ ] Signing out clears the session and returns you to the login screen
- [ ] The repo is pushed to GitHub

Everything after this is Slice 1 onward in the roadmap — the pipeline
board, tickets, tenants, and the rest.
