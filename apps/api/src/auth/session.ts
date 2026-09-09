import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/client.js';

export const SESSION_COOKIE = 'upkeep_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(userId: string, c: Context) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const [session] = await db
    .insert(schema.sessions)
    .values({ userId, expiresAt })
    .returning();

  setCookie(c, SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });

  return session;
}

export async function destroySession(c: Context) {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export async function getSessionUser(c: Context) {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) return null;

  const [row] = await db
    .select({ user: schema.users, session: schema.sessions })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.id, sessionId))
    .limit(1);

  if (!row) return null;
  if (row.session.expiresAt.getTime() < Date.now()) return null;

  return row.user;
}
