import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db, schema } from '../db/client.js';
import { requireAuth } from '../auth/middleware.js';
import type { AuthedVariables } from '../auth/middleware.js';

export const propertiesRoute = new Hono<{ Variables: AuthedVariables }>();

propertiesRoute.use('*', requireAuth);

const PIPELINE_STATUSES = [
  'new_lead',
  'under_review',
  'contacted',
  'site_visit_scheduled',
  'site_visit_completed',
  'property_evaluation',
  'negotiation',
  'terms_proposed',
  'awaiting_owner_decision',
  'under_agreement',
  'leased',
  'rejected',
  'withdrawn',
  'lost',
] as const;

const PIPELINE_LABELS: Record<(typeof PIPELINE_STATUSES)[number], string> = {
  new_lead: 'New Lead',
  under_review: 'Under Review',
  contacted: 'Contacted',
  site_visit_scheduled: 'Site Visit Scheduled',
  site_visit_completed: 'Site Visit Completed',
  property_evaluation: 'Property Evaluation',
  negotiation: 'Negotiation',
  terms_proposed: 'Terms Proposed',
  awaiting_owner_decision: 'Awaiting Owner Decision',
  under_agreement: 'Under Agreement',
  leased: 'Leased',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  lost: 'Lost',
};

propertiesRoute.get('/properties', async (c) => {
  const rows = await db.select().from(schema.properties).orderBy(desc(schema.properties.createdAt));
  return c.json(rows);
});

propertiesRoute.get('/properties/:id', async (c) => {
  const id = c.req.param('id');
  const [row] = await db.select().from(schema.properties).where(eq(schema.properties.id, id)).limit(1);
  if (!row) return c.json({ error: 'Property not found.' }, 404);
  return c.json(row);
});

propertiesRoute.post('/properties', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return c.json({ error: 'Property name is required.' }, 400);
  }
  if (typeof body.line1 !== 'string' || !body.line1.trim()) {
    return c.json({ error: 'Address line 1 is required.' }, 400);
  }
  if (typeof body.contactName !== 'string' || !body.contactName.trim()) {
    return c.json({ error: 'A property contact name is required.' }, 400);
  }
  if (typeof body.contactMobile !== 'string' || !body.contactMobile.trim()) {
    return c.json({ error: 'A property contact mobile number is required.' }, 400);
  }

  const [row] = await db
    .insert(schema.properties)
    .values({
      name: body.name.trim(),
      line1: body.line1.trim(),
      line2: body.line2 ?? '',
      city: body.city ?? '',
      village: body.village ?? '',
      region: body.region ?? '',
      gps: body.gps ?? '',
      typeCategory: body.typeCategory ?? 'Residential',
      typeSub: body.typeSub ?? '',
      specs: body.specs ?? {},
      features: Array.isArray(body.features) ? body.features : [],
      contactName: body.contactName.trim(),
      contactMobile: body.contactMobile.trim(),
      contactHome: body.contactHome ?? '',
      contactOffice: body.contactOffice ?? '',
      contactEmail: body.contactEmail ?? '',
      contactRole: body.contactRole ?? 'Owner',
      ownerId: body.ownerId || null,
      targetClients: Array.isArray(body.targetClients) ? body.targetClients : [],
      landlordCost: body.landlordCost != null ? String(body.landlordCost) : null,
    })
    .returning();

  await db.insert(schema.activityLog).values({
    propertyId: row.id,
    type: 'Note',
    text: 'Property added to pipeline.',
    by: c.get('user').email,
  });

  return c.json(row, 201);
});

propertiesRoute.patch('/properties/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const status = body?.pipelineStatus;

  if (!PIPELINE_STATUSES.includes(status)) {
    return c.json({ error: `pipelineStatus must be one of: ${PIPELINE_STATUSES.join(', ')}` }, 400);
  }

  const [row] = await db
    .update(schema.properties)
    .set({ pipelineStatus: status })
    .where(eq(schema.properties.id, id))
    .returning();

  if (!row) return c.json({ error: 'Property not found.' }, 404);

  await db.insert(schema.activityLog).values({
    propertyId: id,
    type: 'Note',
    text: `Pipeline status moved to "${PIPELINE_LABELS[status as (typeof PIPELINE_STATUSES)[number]]}".`,
    by: c.get('user').email,
  });

  return c.json(row);
});
