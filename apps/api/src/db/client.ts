import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy apps/api/.env.example to apps/api/.env and fill it in.'
  );
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export { schema };
