import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { db, schema } from '../db/client.js';
import { requireAuth } from '../auth/middleware.js';
import type { AuthedVariables } from '../auth/middleware.js';
import { hashPassword } from '../auth/password.js';

export const usersRoute = new Hono<{ Variables: AuthedVariables }>();

usersRoute.use('*', requireAuth);

// role stays plain text on the shared `users` table (see db/schema.ts) —
// this is the list of values the management portal is allowed to assign.
const ROLES = ['pm', 'maintenance', 'tenant'] as const;

const SAFE_COLUMNS = {
  id: schema.users.id,
  email: schema.users.email,
  role: schema.users.role,
  createdAt: schema.users.createdAt,
};

// User management is a PM-only capability — everyone else still just
// gets requireAuth like every other route.
function isPm(c: { get: (key: 'user') => typeof schema.users.$inferSelect }) {
  return c.get('user').role === 'pm';
}

usersRoute.get('/users', async (c) => {
  if (!isPm(c)) return c.json({ error: 'Only property managers can view the user list.' }, 403);

  const rows = await db.select(SAFE_COLUMNS).from(schema.users).orderBy(desc(schema.users.createdAt));
  return c.json(rows);
});

usersRoute.post('/users', async (c) => {
  if (!isPm(c)) return c.json({ error: 'Only property managers can add users.' }, 403);

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
  if (!ROLES.includes(role)) {
    return c.json({ error: `Role must be one of: ${ROLES.join(', ')}` }, 400);
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
  if (!isPm(c)) return c.json({ error: 'Only property managers can remove users.' }, 403);

  const id = c.req.param('id');
  if (id === c.get('user').id) {
    return c.json({ error: 'You cannot remove your own account.' }, 400);
  }

  const [row] = await db.delete(schema.users).where(eq(schema.users.id, id)).returning({ id: schema.users.id });
  if (!row) return c.json({ error: 'User not found.' }, 404);

  return c.json({ ok: true });
});
