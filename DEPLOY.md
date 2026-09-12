# Deployment

Live at **https://upkeep.glassgroup.co** on the Hostinger VPS `2.25.85.86`
(`srv1832648`), in `/docker/upkeep/`.

## How it's wired

The VPS already runs a shared **Traefik v3** (`/docker/traefik/`) on the host
network: Docker-label provider, `letsencrypt` HTTP-01 cert resolver, global
HTTP→HTTPS redirect. This app plugs into it via labels in
[`docker-compose.prod.yml`](docker-compose.prod.yml) — no host ports are
published, Traefik is the only public entry point.

Routing for the single hostname:

| Request | Router (priority) | Goes to |
| --- | --- | --- |
| `upkeep.glassgroup.co/api/*` | `upkeep-api` (100) | `api:8787` (Hono) |
| everything else | `upkeep-web` (1) | `web:80` (nginx serving the built SPA) |

Unlike some sibling apps on this box, the `/api` prefix is **not** stripped —
`apps/web/src/api.ts` already calls same-origin `/api/...` paths, and the
Hono app itself mounts every route under `/api` (`apps/api/src/index.ts`), so
Traefik forwards the request unchanged. No CORS or mixed-content concerns.

`db` is an internal `postgres:16-alpine` with a named volume
`upkeep_db_data`. Unlike a plain-SQL app, schema changes here are Drizzle
migrations under `apps/api/migrations/` — they are **not** auto-applied on
container init and must be run by hand (see below).

Property photos (`apps/api/src/routes/photos.ts`) live on disk inside the
`api` container under `apps/api/data/photos/`, backed by a named volume
`upkeep_photos_data` so they survive every redeploy.

## Secrets

`/docker/upkeep/.env` on the VPS (git-ignored, generated on first deploy):

```
DB_PASSWORD=<32 hex chars>
SESSION_SECRET=<64 hex chars>
```

Both `db` (`POSTGRES_PASSWORD`) and `api` (`DATABASE_URL`) read `DB_PASSWORD`,
so they stay in sync. `POSTGRES_PASSWORD` only takes effect on first init —
changing it later needs `ALTER USER` inside the db container as well.

## First deploy

The VPS clones straight from GitHub (public repo, no deploy key needed) —
nothing is uploaded from the workstation.

```bash
ssh root@2.25.85.86 'git clone https://github.com/kirby-gt/upkeep.git /docker/upkeep'

ssh root@2.25.85.86 'cat > /docker/upkeep/.env <<EOF
DB_PASSWORD='"$(openssl rand -hex 16)"'
SESSION_SECRET='"$(openssl rand -hex 32)"'
EOF'

ssh root@2.25.85.86 'cd /docker/upkeep && docker compose -f docker-compose.prod.yml up -d --build'

# Schema doesn't exist until migrations run once:
ssh root@2.25.85.86 'cd /docker/upkeep && docker compose -f docker-compose.prod.yml exec -T api npx tsx src/db/migrate.ts'
```

## Logins, roles, and sample data

`apps/api/src/seed.ts` does two things: it seeds one login per role, and it
seeds a full **fictional demo pipeline dataset** (owners, properties spread
across every board column, activity history, visits) so a fresh dev checkout
has something to look at. **Do not run it as-is against this production
database** — the demo owners/properties are fake, and the seeded passwords
(`upkeep-dev` by default) are printed in this repo's history and README, so
they must never be the real credentials on a public, internet-reachable
login.

To create real accounts instead, hash a strong, freshly-generated password
with the same scrypt scheme `apps/api/src/auth/password.ts` uses (the `api`
container runs from source via `tsx`, not a `dist/` build, so hash it with
plain `node -e` rather than importing the TS file), then insert the row:

```bash
PASSWORD=$(openssl rand -base64 18 | tr -d '=+/' | cut -c1-20)
HASH=$(docker compose -f docker-compose.prod.yml exec -T api node -e \
  'const c=require("crypto");const p=process.argv[1];const s=c.randomBytes(16).toString("hex");console.log(s+":"+c.scryptSync(p,s,64).toString("hex"))' \
  "$PASSWORD")
docker compose -f docker-compose.prod.yml exec -T db psql -U upkeep -d upkeep \
  -c "INSERT INTO users (email, password_hash, role) VALUES ('you@example.com', '$HASH', 'pm');"
echo "Password: $PASSWORD"   # only shown once — save it
```

(There's no admin UI for user management yet — Slice 5/7 add real
staff/tenant accounts; until then this is the only door in.)

## Redeploy after code changes

Push to `main` on the workstation first, then on the VPS:

```bash
ssh root@2.25.85.86 'cd /docker/upkeep && git pull && \
  docker compose -f docker-compose.prod.yml up -d --build'
```

`.env` isn't tracked (git-ignored), so `git pull` never touches it. If the
change included a new migration, apply it:

```bash
ssh root@2.25.85.86 'cd /docker/upkeep && \
  docker compose -f docker-compose.prod.yml exec -T api npx tsx src/db/migrate.ts'
```

## Backups

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U upkeep upkeep | gzip > backup-$(date +%F).sql.gz
```

Property photos live in the `upkeep_photos_data` volume — back that up too
once there's real data in it:

```bash
docker run --rm -v upkeep_photos_data:/data -v "$(pwd)":/backup alpine \
  tar czf /backup/photos-$(date +%F).tar.gz -C /data .
```

## Ops quick reference

```bash
cd /docker/upkeep
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml down          # stop (keeps volumes)
```
