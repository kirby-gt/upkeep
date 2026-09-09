import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/client.js';
import { verifyPassword } from '../auth/password.js';
import { createSession, destroySession } from '../auth/session.js';

export const authRoute = new Hono();

authRoute.post('/auth/login', async (c) => {
  type LoginBody = { email?: string; password?: string };
  const body = await c.req.json<LoginBody>().catch<LoginBody>(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'Email and password are required.' }, 400);
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return c.json({ error: 'Incorrect email or password.' }, 401);
  }

  await createSession(user.id, c);
  return c.json({ ok: true, user: { email: user.email, role: user.role } });
});

authRoute.post('/auth/logout', async (c) => {
  await destroySession(c);
  return c.json({ ok: true });
});
