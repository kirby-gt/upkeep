import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db, schema } from '../db/client.js';
import { requireAuth } from '../auth/middleware.js';
import type { AuthedVariables } from '../auth/middleware.js';

export const visitsRoute = new Hono<{ Variables: AuthedVariables }>();

visitsRoute.use('*', requireAuth);

visitsRoute.get('/properties/:id/visits', async (c) => {
  const propertyId = c.req.param('id');
  const rows = await db
    .select()
    .from(schema.visits)
    .where(eq(schema.visits.propertyId, propertyId))
    .orderBy(desc(schema.visits.date));
  return c.json(rows);
});

visitsRoute.post('/properties/:id/visits', async (c) => {
  const propertyId = c.req.param('id');
  const body = await c.req.json().catch(() => null);

  if (!String(body?.date ?? '').trim()) {
    return c.json({ error: 'Visit date is required.' }, 400);
  }

  const [row] = await db
    .insert(schema.visits)
    .values({
      propertyId,
      date: body.date,
      type: body.type ?? 'Initial Site Visit',
      status: body.status ?? 'Scheduled',
      attendees: Number.isFinite(Number(body.attendees)) ? Number(body.attendees) : 1,
      client: body.client || 'Internal',
    })
    .returning();

  return c.json(row, 201);
});
