import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { db, schema } from '../db/client.js';
import { requireAuth } from '../auth/middleware.js';
import type { AuthedVariables } from '../auth/middleware.js';

export const ownersRoute = new Hono<{ Variables: AuthedVariables }>();

ownersRoute.use('*', requireAuth);

ownersRoute.get('/owners', async (c) => {
  const rows = await db.select().from(schema.owners).orderBy(desc(schema.owners.createdAt));
  return c.json(rows);
});

ownersRoute.post('/owners', async (c) => {
  const body = await c.req.json().catch(() => null);
  const isCompany = Boolean(body?.company);

  if (isCompany && !String(body?.companyName ?? '').trim()) {
    return c.json({ error: 'Company name is required for a company owner.' }, 400);
  }
  if (!isCompany && !String(body?.firstName ?? '').trim() && !String(body?.lastName ?? '').trim()) {
    return c.json({ error: 'First or last name is required.' }, 400);
  }
  if (!String(body?.mobile ?? '').trim()) {
    return c.json({ error: 'A mobile number is required.' }, 400);
  }

  const [row] = await db
    .insert(schema.owners)
    .values({
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      company: isCompany,
      companyName: body.companyName ?? '',
      mobile: body.mobile.trim(),
      email: body.email ?? '',
      address: body.address ?? '',
      notes: body.notes ?? '',
    })
    .returning();

  return c.json(row, 201);
});

ownersRoute.patch('/owners/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const isCompany = Boolean(body?.company);

  if (isCompany && !String(body?.companyName ?? '').trim()) {
    return c.json({ error: 'Company name is required for a company owner.' }, 400);
  }
  if (!isCompany && !String(body?.firstName ?? '').trim() && !String(body?.lastName ?? '').trim()) {
    return c.json({ error: 'First or last name is required.' }, 400);
  }
  if (!String(body?.mobile ?? '').trim()) {
    return c.json({ error: 'A mobile number is required.' }, 400);
  }

  const [row] = await db
    .update(schema.owners)
    .set({
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      company: isCompany,
      companyName: body.companyName ?? '',
      mobile: body.mobile.trim(),
      email: body.email ?? '',
      address: body.address ?? '',
      notes: body.notes ?? '',
    })
    .where(eq(schema.owners.id, id))
    .returning();

  if (!row) return c.json({ error: 'Owner not found.' }, 404);
  return c.json(row);
});
