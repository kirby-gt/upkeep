import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db, schema } from '../db/client.js';
import { requireAuth } from '../auth/middleware.js';
import type { AuthedVariables } from '../auth/middleware.js';

export const activityRoute = new Hono<{ Variables: AuthedVariables }>();

activityRoute.use('*', requireAuth);

activityRoute.get('/properties/:id/activity', async (c) => {
  const propertyId = c.req.param('id');
  const rows = await db
    .select()
    .from(schema.activityLog)
    .where(eq(schema.activityLog.propertyId, propertyId))
    .orderBy(desc(schema.activityLog.at));
  return c.json(rows);
});

activityRoute.post('/properties/:id/activity', async (c) => {
  const propertyId = c.req.param('id');
  const body = await c.req.json().catch(() => null);

  if (!String(body?.text ?? '').trim()) {
    return c.json({ error: 'Activity note text is required.' }, 400);
  }

  const [row] = await db
    .insert(schema.activityLog)
    .values({
      propertyId,
      type: body.type ?? 'Note',
      text: body.text.trim(),
      nextAction: body.nextAction ?? '',
      followUpDate: body.followUpDate || null,
      // by is set from the signed-in session, never trusted from the client
      by: c.get('user').email,
    })
    .returning();

  return c.json(row, 201);
});
