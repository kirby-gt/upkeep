# Upkeep

Property sourcing, leasing, and maintenance ticketing for a Guyana-based
operation. Self-hosted — no third-party BaaS.

This repo currently covers **Slices 0–3** of the
[build roadmap](./docs/build-roadmap.html):

- **Slice 0** — walking skeleton: login → API → Postgres, proven end to end.
- **Slice 1** — pipeline capture & board: properties + owners, a real
  Kanban-style pipeline board, an Add Property flow (with an inline
  "find existing owner or add a new one" toggle), and an owners list.
- **Slice 2** — activity log & visits: a timeline of notes/calls/visits per
  property, and a scheduled-visits list, both editable from the property
  detail view.
- **Slice 3** — real photo storage: up to 5 photos per property, uploaded
  from the browser, stored on disk (a stand-in for a bind-mounted Docker
  volume / MinIO in production), served back through the API.

Everything after this is Slice 4 onward in the roadmap — tickets, tenants,
leases, and maintenance workflows.

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

### Already had Slice 0 running?

If you set this up before Slices 1–3 landed, you don't need to redo
anything from scratch — just pull the new code and:

```bash
npm install            # picks up any new dependencies
npm run db:migrate      # applies the new migration (owners, properties,
                         # activity_log, visits, property_photos tables)
```

Photos are written to disk under `apps/api/data/photos` by default in dev
(gitignored) — override the location with `PHOTOS_DIR` in `apps/api/.env`
if you'd rather point it somewhere else.

## Running it

Two terminals:

```bash
npm run dev:api   # http://localhost:8787
npm run dev:web   # http://localhost:5173
```

Open `http://localhost:5173`, sign in with the seeded login, and you land
on the pipeline board. From there you can:

- Click **+ Add Property** to capture a new lead — address, type, specs,
  features, a property contact, up to 5 photos, target clients, and an
  owner (search existing owners, or add a new one inline without losing
  what you've already typed elsewhere in the form).
- Click **+ Add Owner** to add a landlord/agent/company on its own.
- Click any card on the board to open a property's detail view: change its
  pipeline status (logged automatically to the activity timeline), add
  activity notes, schedule visits, and manage its photos.
- Click **Owners** in the left rail to see everyone on file and how many
  properties each one has.

## What "done" looks like for Slices 0–3

- [x] `docker compose up -d` brings up Postgres cleanly
- [x] `npm run db:migrate` creates all 7 tables (`users`, `sessions`,
      `owners`, `properties`, `activity_log`, `visits`, `property_photos`)
- [x] `npm run db:seed` creates a login you can actually use
- [x] Signing in sets a session cookie and shows a real database timestamp
- [x] Signing out clears the session and returns you to the login screen
- [x] Adding a property with a brand-new owner works, and toggling between
      "find existing owner" and "add new owner" never loses what's typed
      in either mode
- [x] The pipeline board groups properties by status and updates live when
      a status changes
- [x] Activity notes and visits can be added and show up immediately
- [x] Photos upload, preview, and delete correctly, capped at 5 per
      property
- [x] `npm run build` (in `apps/web`) produces a clean production bundle
- [ ] The repo is pushed to GitHub with these slices included

Everything after this is Slice 4 onward in the roadmap — tickets, tenants,
leases, and maintenance workflows.
