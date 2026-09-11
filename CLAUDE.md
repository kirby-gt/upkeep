# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Upkeep is a self-hosted property sourcing, leasing, and maintenance-ticketing
system for a Guyana-based operation. No third-party BaaS (auth, database, or
storage) — everything runs on infrastructure this project owns.

The codebase is following a 13-slice build roadmap (`docs/build-roadmap.html`)
and currently has **Slices 0–3** built: login/session auth, the owner +
property pipeline board, activity log & visits, and real photo storage.
Slices 4 onward (units & leases, tenant accounts, maintenance tickets, live
updates, reporting, documents, utility accounts, backups) don't exist yet —
check the roadmap section below before assuming a feature is or isn't there.

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
npm run db:seed             # idempotent: seeds logins (steve@upkeep.local / upkeep-dev by
                             # default, plus one maintenance/tenant sample login) and a
                             # sample pipeline dataset (owners, properties, activity, visits)

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
- `routes/` — one Hono sub-app per resource: `health.ts`, `auth.ts`,
  `me.ts` (Slice 0); `properties.ts`, `owners.ts` (Slice 1); `activity.ts`,
  `visits.ts` (Slice 2); `photos.ts` (Slice 3). Add new resources the same
  way: a new file exporting a `Hono` instance, mounted in `index.ts`.
- `auth/session.ts` — session cookie lifecycle (`createSession`,
  `destroySession`, `getSessionUser`); sessions are rows in Postgres, not
  signed/stateless tokens.
- `auth/middleware.ts` — `requireAuth` guards protected routes and sets
  `c.var.user` (typed via the exported `AuthedVariables`). Nothing renders
  in the web app without passing through it, and every route added since
  Slice 0 still gates on it (`propertiesRoute.use('*', requireAuth)` etc).
- `auth/password.ts` — scrypt hashing/verification.
- `db/client.ts` — the shared Drizzle `db` instance + re-exported `schema`;
  import both from here rather than constructing a new client.
- `db/schema.ts` — table definitions (source of truth for the schema),
  organized in commented sections per slice: `users`/`sessions` (0),
  `owners`/`properties` (1), `activityLog`/`visits` (2), `propertyPhotos`
  (3). Enum-like columns (`pipelineStatus`, activity `type`, visit
  `type`/`status`) are plain `text` with the allowed values documented in a
  comment above the table — check `apps/web/src/constants.ts` for the
  client-side copy of the same lists (`PIPELINE_STATUS`, `ACTIVITY_TYPES`,
  `VISIT_TYPES`, `VISIT_STATUSES`) and keep both in sync if you add a value.
- `db/migrate.ts` — applies `migrations/*.sql` to whatever `DATABASE_URL`
  points at; run via `npm run db:migrate`.
- `seed.ts` — idempotent seed script: sample logins (one per role) plus a
  full sample pipeline dataset (owners, properties spread across every
  board column, activity history, visits). Re-running it only inserts what
  is missing — each section checks for an existing row (by email, mobile,
  or property name) before inserting.

**Schema change workflow**: edit `db/schema.ts` → `npm run db:generate`
(writes a new file into `apps/api/migrations/` + updates `migrations/meta/`)
→ `npm run db:migrate`. Never hand-edit files under `migrations/meta/` or
renumber existing migration files.

**Photo storage** (`routes/photos.ts`): files live on disk under
`PHOTOS_DIR` (default `apps/api/data/photos/<propertyId>/<uuid>.ext`,
gitignored), capped at 5 photos/property and 8MB/file, served back through
an authenticated static route. This is deliberately a plain directory so
swapping to object storage (e.g. MinIO) later only touches this one file.

**apps/web/src/** — a single-page workspace, no router (`view` state in
`App.tsx` switches between `board` / `owners` / `property`):
- `App.tsx` — top-level auth gate + the `Workspace` shell (sidebar nav,
  topbar, modals).
- `components/` — `PipelineBoard.tsx` (kanban grouped by
  `constants.BOARD_GROUPS`), `PropertyCard.tsx`, `PropertyDetail.tsx`,
  `OwnersList.tsx`, `AddPropertyModal.tsx`, `AddOwnerModal.tsx`.
- `constants.ts` — the client-side source of truth for dropdown/enum
  values (regions, property types, features, pipeline statuses grouped
  into board columns, activity/visit types). Mirrors the comments in
  `db/schema.ts` — update both together.
- `lib/format.ts` — small display helpers (`statusColor`, `statusLabel`,
  `formatDate`, `ownerDisplayName`); prefer extending these over
  formatting inline in a component.
- `types.ts` — hand-written types mirroring the API's row shapes (no
  codegen from the Drizzle schema — keep them in sync manually).
- `api.ts` — small typed fetch wrapper (`credentials: 'include'` for the
  session cookie, throws on non-2xx using the JSON `{error}` body).
- No state library or component library — don't add one preemptively.

**users table** currently doubles as the login table for every role (`pm`
| `maintenance` | `tenant` stored as plain text, no enum/check constraint).
Per `db/schema.ts`, Slice 5 and Slice 7 add dedicated staff/tenant tables —
`users` stays the auth record for every human account regardless of role
when that happens, so don't restructure it preemptively.

## Roadmap context (docs/build-roadmap.html)

Useful for knowing what's *not* built yet and why a piece of code looks
provisional. Slices in order: 0 walking skeleton → 1 pipeline capture &
board → 2 activity & visits → 3 real photo storage *(0–3 built — see
Architecture above)* → 4 units & leases → 5 tenant accounts → 6 maintenance
tickets → 7 maintenance team → 8 live updates → 9 portfolio reporting →
10 documents → 11 utility accounts → 12 backups & hardening *(4–12 not
started)*. Slices 1–3 mostly wired up an existing UI (*Upkeep Property
Pipeline*) to the backend; Slices 4–7 are net-new data and are considered
the actual product, with Slice 6 (maintenance tickets) as the core; Slices
9–11 are unordered relative to each other; Slice 12 (backups) should start
as soon as there's real data worth losing, not as a one-time final step.
