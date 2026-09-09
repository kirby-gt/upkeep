import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Slice 0 — just enough to log one person in and prove the round trip.
// role is a plain text column for now ('pm' | 'maintenance' | 'tenant');
// Slice 5 and 7 add real staff/tenant tables — this stays the login table
// for every human account regardless of role.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('pm'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
