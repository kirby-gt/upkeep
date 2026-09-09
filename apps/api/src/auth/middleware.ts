import type { Context, Next } from 'hono';
import { getSessionUser } from './session.js';

// Attaches the signed-in user to c.var.user, or rejects with 401.
// Nothing renders in the web app without passing through this first —
// that's the whole point of Slice 0.
export async function requireAuth(c: Context, next: Next) {
  const user = await getSessionUser(c);
  if (!user) {
    return c.json({ error: 'Not signed in.' }, 401);
  }
  c.set('user', user);
  await next();
}
