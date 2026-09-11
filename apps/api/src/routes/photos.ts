import { Hono } from 'hono';
import { eq, and, asc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync, createReadStream } from 'node:fs';
import path from 'node:path';
import { db, schema } from '../db/client.js';
import { requireAuth } from '../auth/middleware.js';
import type { AuthedVariables } from '../auth/middleware.js';

export const photosRoute = new Hono<{ Variables: AuthedVariables }>();

// In dev this is a plain folder on disk (gitignored). On the VPS it's the
// same idea as a bind-mounted Docker volume — one directory the API
// container owns — so nothing here changes when it's deployed; only
// PHOTOS_DIR moves. Swapping to MinIO later only touches this file.
const PHOTOS_DIR = process.env.PHOTOS_DIR ?? path.join(process.cwd(), 'data', 'photos');
const MAX_PHOTOS_PER_PROPERTY = 5;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB

photosRoute.use('*', requireAuth);

photosRoute.post('/properties/:id/photos', async (c) => {
  const propertyId = c.req.param('id');

  const [property] = await db
    .select({ id: schema.properties.id })
    .from(schema.properties)
    .where(eq(schema.properties.id, propertyId))
    .limit(1);
  if (!property) return c.json({ error: 'Property not found.' }, 404);

  const existing = await db
    .select({ id: schema.propertyPhotos.id })
    .from(schema.propertyPhotos)
    .where(eq(schema.propertyPhotos.propertyId, propertyId));
  const room = MAX_PHOTOS_PER_PROPERTY - existing.length;
  if (room <= 0) {
    return c.json({ error: `A property can have at most ${MAX_PHOTOS_PER_PROPERTY} photos.` }, 400);
  }

  const formData = await c.req.formData().catch(() => null);
  if (!formData) return c.json({ error: 'Expected multipart/form-data.' }, 400);

  type UploadedFile = { type: string; size: number; name: string; arrayBuffer: () => Promise<ArrayBuffer> };

  const files = formData
    .getAll('photos')
    .filter((v) => typeof v === 'object' && v !== null && 'arrayBuffer' in v)
    .map((v) => v as unknown as UploadedFile)
    .slice(0, room);
  if (files.length === 0) {
    return c.json({ error: 'No photo files were attached.' }, 400);
  }

  const dir = path.join(PHOTOS_DIR, propertyId);
  await mkdir(dir, { recursive: true });

  const inserted = [];
  for (const [i, file] of files.entries()) {
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return c.json({ error: `Unsupported file type: ${file.type || 'unknown'}` }, 400);
    }
    if (file.size > MAX_FILE_BYTES) {
      return c.json({ error: `${file.name} is larger than 8MB.` }, 400);
    }

    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    const [row] = await db
      .insert(schema.propertyPhotos)
      .values({
        propertyId,
        storageKey: `${propertyId}/${filename}`,
        position: existing.length + i,
      })
      .returning();
    inserted.push(row);
  }

  return c.json(inserted, 201);
});

photosRoute.get('/properties/:id/photos', async (c) => {
  const propertyId = c.req.param('id');
  const rows = await db
    .select()
    .from(schema.propertyPhotos)
    .where(eq(schema.propertyPhotos.propertyId, propertyId))
    .orderBy(asc(schema.propertyPhotos.position));
  return c.json(rows);
});

photosRoute.delete('/properties/:id/photos/:photoId', async (c) => {
  const propertyId = c.req.param('id');
  const photoId = c.req.param('photoId');

  const [row] = await db
    .select()
    .from(schema.propertyPhotos)
    .where(and(eq(schema.propertyPhotos.id, photoId), eq(schema.propertyPhotos.propertyId, propertyId)))
    .limit(1);
  if (!row) return c.json({ error: 'Photo not found.' }, 404);

  await db.delete(schema.propertyPhotos).where(eq(schema.propertyPhotos.id, photoId));

  const filePath = path.join(PHOTOS_DIR, row.storageKey);
  if (existsSync(filePath)) await unlink(filePath).catch(() => {});

  return c.json({ ok: true });
});

// Static serving — kept behind the same session gate as everything else
// for now. If photos ever need to be link-shareable without a login,
// that's a deliberate follow-up, not a default.
photosRoute.get('/photos/:propertyId/:filename', async (c) => {
  const { propertyId, filename } = c.req.param();
  const filePath = path.join(PHOTOS_DIR, propertyId, filename);
  if (!existsSync(filePath)) return c.json({ error: 'Not found.' }, 404);

  const ext = path.extname(filename).slice(1);
  const mime = Object.entries(ALLOWED_TYPES).find(([, e]) => e === ext)?.[0] ?? 'application/octet-stream';

  const stream = createReadStream(filePath);
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk as Uint8Array);

  return c.body(Buffer.concat(chunks), 200, { 'Content-Type': mime });
});
