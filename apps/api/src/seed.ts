import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, schema } from './db/client.js';
import { hashPassword } from './auth/password.js';

// Seeds exactly one Property Manager login so Slice 0 has someone who can
// sign in. Real staff/tenant accounts land in Slices 5 and 7.
const EMAIL = process.env.SEED_PM_EMAIL ?? 'steve@upkeep.local';
const PASSWORD = process.env.SEED_PM_PASSWORD ?? 'upkeep-dev';

async function main() {
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Already seeded: ${EMAIL}`);
    return;
  }

  await db.insert(schema.users).values({
    email: EMAIL,
    passwordHash: hashPassword(PASSWORD),
    role: 'pm',
  });

  console.log(`Seeded PM login — email: ${EMAIL}  password: ${PASSWORD}`);
  console.log('Override with SEED_PM_EMAIL / SEED_PM_PASSWORD env vars if you want different values.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
