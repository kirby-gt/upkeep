import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { requireAuth } from '../auth/middleware.js';
import type { schema } from '../db/client.js';

type Variables = {
  user: typeof schema.users.$inferSelect;
};

export const meRoute = new Hono<{ Variables: Variables }>();

// Protected — this is the "prove it's really connected" endpoint the
// dashboard shell calls after login. It round-trips a real query so the
// UI can never show "Connected" off a hardcoded string.
meRoute.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  const [row] = await db.execute<{ now: string }>(sql`select now() as now`);

  return c.json({
    email: user.email,
    role: user.role,
    serverTime: row?.now ?? null,
  });
});
