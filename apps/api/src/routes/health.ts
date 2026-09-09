import { Hono } from 'hono';

export const healthRoute = new Hono();

// Public liveness check — no session required. This is what Docker's
// healthcheck or a deploy script pings, so it must never depend on auth.
healthRoute.get('/health', (c) => c.json({ status: 'ok' }));
