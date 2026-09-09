import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { healthRoute } from './routes/health.js';
import { authRoute } from './routes/auth.js';
import { meRoute } from './routes/me.js';

const app = new Hono();

app.use('*', logger());

app.route('/api', healthRoute);
app.route('/api', authRoute);
app.route('/api', meRoute);

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Upkeep API listening on http://localhost:${info.port}`);
});
