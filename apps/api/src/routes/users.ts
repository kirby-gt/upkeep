import { Hono } from 'hono';
import { desc, eq, inArray } from 'drizzle-orm';
import { db, schema } from '../db/client.js';
import { requireAuth } from '../auth/middleware.js';
import type { AuthedVariables } from '../auth/middleware.js';
import { hashPassword } from '../auth/password.js';

export const usersRoute = new Hono<{ Variables: AuthedVariables }>();

usersRoute.use('*', requireAuth);

// role stays plain text on the shared `users` table (see db/schema.ts).
// Hierarchy: admin can see/create/remove any role; pm is scoped to the
// "lower tiers" (maintenance, tenant) and can't touch pm or admin
// accounts. Everyone else gets a flat 403 off this whole route.
const LOWER_TIER_ROLES = ['maintenance', 'tenant'] as const;
const CREATABLE_ROLES: Record<string, readonly string[]> = {
  admin: ['admin', 'pm', ...LOWER_TIER_ROLES],
  pm: LOWER_TIER_ROLES,
};

const SAFE_COLUMNS = {
  id: schema.users.id,
  email: schema.users.email,
  role: schema.users.role,
  createdAt: schema.users.createdAt,
};

type Role = keyof typeof CREATABLE_ROLES;

function managedRoles(c: { get: (key: 'user') => typeof schema.users.$inferSelect }): readonly string[] | null {
  const role = c.get('user').role;
  return CREATABLE_ROLES[role as Role] ?? null;
}

usersRoute.get('/users', async (c) => {
  const role = c.get('user').role;
  const allowed = managedRoles(c);
  if (!allowed) return c.json({ error: 'You do not have access to user management.' }, 403);

  const rows =
    role === 'admin'
      ? await db.select(SAFE_COLUMNS).from(schema.users).orderBy(desc(schema.users.createdAt))
      : await db
          .select(SAFE_COLUMNS)
          .from(schema.users)
          .where(inArray(schema.users.role, [...allowed]))
          .orderBy(desc(schema.users.createdAt));

  return c.json(rows);
});

usersRoute.post('/users', async (c) => {
  const allowed = managedRoles(c);
  if (!allowed) return c.json({ error: 'You do not have access to user management.' }, 403);

  const body = await c.req.json().catch(() => null);
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  const role = body?.role;

  if (!email || !email.includes('@')) {
    return c.json({ error: 'A valid email is required.' }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters.' }, 400);
  }
  if (!allowed.includes(role)) {
    return c.json({ error: `You can only create users with one of these roles: ${allowed.join(', ')}` }, 403);
  }

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) {
    return c.json({ error: 'A user with that email already exists.' }, 409);
  }

  const [row] = await db
    .insert(schema.users)
    .values({ email, passwordHash: hashPassword(password), role })
    .returning(SAFE_COLUMNS);

  return c.json(row, 201);
});

usersRoute.delete('/users/:id', async (c) => {
  const allowed = managedRoles(c);
  if (!allowed) return c.json({ error: 'You do not have access to user management.' }, 403);

  const id = c.req.param('id');
  if (id === c.get('user').id) {
    return c.json({ error: 'You cannot remove your own account.' }, 400);
  }

  const [target] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!target) return c.json({ error: 'User not found.' }, 404);
  if (!allowed.includes(target.role)) {
    return c.json({ error: 'You do not have permission to remove this user.' }, 403);
  }

  await db.delete(schema.users).where(eq(schema.users.id, id));
  return c.json({ ok: true });
});

usersRoute.post('/users/:id/reset-password', async (c) => {
  const allowed = managedRoles(c);
  if (!allowed) return c.json({ error: 'You do not have access to user management.' }, 403);

  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const password = String(body?.password ?? '');
  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters.' }, 400);
  }

  const [target] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!target) return c.json({ error: 'User not found.' }, 404);
  if (!allowed.includes(target.role)) {
    return c.json({ error: "You do not have permission to reset this user's password." }, 403);
  }

  await db.update(schema.users).set({ passwordHash: hashPassword(password) }).where(eq(schema.users.id, id));
  // A password reset should also kill any session already open under the
  // old password, the same way removing a user cascades its sessions.
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, id));

  return c.json({ ok: true });
});
