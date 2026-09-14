import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { healthRoute } from './routes/health.js';
import { authRoute } from './routes/auth.js';
import { meRoute } from './routes/me.js';
import { usersRoute } from './routes/users.js';
import { propertiesRoute } from './routes/properties.js';
import { ownersRoute } from './routes/owners.js';
import { activityRoute } from './routes/activity.js';
import { visitsRoute } from './routes/visits.js';
import { photosRoute } from './routes/photos.js';

const app = new Hono();

app.use('*', logger());

app.route('/api', healthRoute);
app.route('/api', authRoute);
app.route('/api', meRoute);
app.route('/api', usersRoute);
app.route('/api', propertiesRoute);
app.route('/api', ownersRoute);
app.route('/api', activityRoute);
app.route('/api', visitsRoute);
app.route('/api', photosRoute);

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Upkeep API listening on http://localhost:${info.port}`);
});
