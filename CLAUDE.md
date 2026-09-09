# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Upkeep is a self-hosted property sourcing, leasing, and maintenance-ticketing
system for a Guyana-based operation. No third-party BaaS (auth, database, or
storage) — everything runs on infrastructure this project owns.

The codebase is currently **Slice 0** of a 13-slice build roadmap
(`docs/build-roadmap.html`): a walking skeleton that proves login → API →
Postgres works end to end before any real feature is built. Expect most of
the app to not exist yet — `users`/`sessions` and a single "am I connected"
screen are the entire feature set right now.

## Stack

- **API** — Hono on Node (`apps/api`), TypeScript, run with `tsx`
- **Web** — React + Vite (`apps/web`), TypeScript
- **Database** — PostgreSQL 16 via Docker Compose, schema/migrations managed
  with Drizzle ORM / drizzle-kit
- **Auth** — self-rolled session-cookie auth; no external auth provider.
  Passwords are hashed with Node's built-in `scrypt` (`apps/api/src/auth/password.ts`)
  on purpose, to avoid a native dependency like bcrypt — keep it that way
  unless there's a specific reason to change it.
- npm workspaces monorepo: root `package.json` has `workspaces: ["apps/*"]`,
  no shared packages yet.

## Commands

Run from the repo root unless noted.

```bash
npm install                # installs both workspaces

docker compose up -d       # starts Postgres (host port 5433, not 5432)

npm run db:generate         # drizzle-kit generate — writes SQL into apps/api/migrations/
npm run db:migrate          # applies pending migrations to the running Postgres container
npm run db:seed             # seeds one PM login (steve@upkeep.local / upkeep-dev by default)

npm run dev:api              # apps/api, http://localhost:8787
npm run dev:web              # apps/web, http://localhost:5173 (Vite proxies /api -> :8787)
```

There is no test suite and no lint command configured yet — don't invent
one. To build for production:

```bash
npm run build --workspace=apps/api   # tsc -> apps/api/dist
npm run build --workspace=apps/web   # tsc -b && vite build
```

Config: copy `apps/api/.env.example` to `apps/api/.env` and set
`SESSION_SECRET` (the root `.env.example` is Postgres credentials only, for
reference — docker-compose.yml already hardcodes matching values for local
dev).

## Architecture

**Request flow**: browser → Vite dev server (proxies `/api/*` to the API,
same-origin so the session cookie needs no CORS config; Caddy does the same
proxying in production) → Hono app → route handler → Drizzle → Postgres.

**apps/api/src/**
- `index.ts` — mounts each route module under `/api` and starts the server.
- `routes/` — one Hono sub-app per resource (`health.ts`, `auth.ts`,
  `me.ts`). Add new resources the same way: a new file exporting a
  `Hono` instance, mounted in `index.ts`.
- `auth/session.ts` — session cookie lifecycle (`createSession`,
  `destroySession`, `getSessionUser`); sessions are rows in Postgres, not
  signed/stateless tokens.
- `auth/middleware.ts` — `requireAuth` guards protected routes and sets
  `c.var.user`. Nothing renders in the web app without passing through it.
- `auth/password.ts` — scrypt hashing/verification.
- `db/client.ts` — the shared Drizzle `db` instance + re-exported `schema`;
  import both from here rather than constructing a new client.
- `db/schema.ts` — table definitions (source of truth for the schema).
- `db/migrate.ts` — applies `migrations/*.sql` to whatever `DATABASE_URL`
  points at; run via `npm run db:migrate`.
- `seed.ts` — idempotent seed script for one PM account, driven by
  `SEED_PM_EMAIL`/`SEED_PM_PASSWORD` env vars.

**Schema change workflow**: edit `db/schema.ts` → `npm run db:generate`
(writes a new file into `apps/api/migrations/` + updates `migrations/meta/`)
→ `npm run db:migrate`. Never hand-edit files under `migrations/meta/` or
renumber existing migration files.

**apps/web/src/** — deliberately minimal: `App.tsx` is the entire UI
(login form + a "connected" status screen), `api.ts` is a small typed
fetch wrapper (`credentials: 'include'` for the session cookie, throws on
non-2xx using the JSON `{error}` body), `main.tsx` bootstraps React. No
router, no state library, no component library yet — don't add one
preemptively; the roadmap below indicates when real UI is due to land.

**users table** currently doubles as the login table for every role (`pm`
| `maintenance` | `tenant` stored as plain text, no enum/check constraint).
Per `db/schema.ts`, Slice 5 and Slice 7 add dedicated staff/tenant tables —
`users` stays the auth record for every human account regardless of role
when that happens, so don't restructure it preemptively.

## Roadmap context (docs/build-roadmap.html)

Useful for knowing what's *not* built yet and why a piece of code looks
provisional. Slices in order: 0 walking skeleton (current) → 1 pipeline
capture & board → 2 activity & visits → 3 real photo storage → 4 units &
leases → 5 tenant accounts → 6 maintenance tickets → 7 maintenance team →
8 live updates → 9 portfolio reporting → 10 documents → 11 utility accounts
→ 12 backups & hardening. Slices 1–3 mostly wire up an existing UI
(*Upkeep Property Pipeline*) to the backend; Slices 4–7 are net-new data and
are considered the actual product, with Slice 6 (maintenance tickets) as
the core; Slices 9–11 are unordered relative to each other; Slice 12
(backups) should start as soon as Slice 1 has real data, not as a one-time
final step.
