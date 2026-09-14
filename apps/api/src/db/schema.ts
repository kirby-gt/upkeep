import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  integer,
  numeric,
  date,
} from 'drizzle-orm/pg-core';

// ---------- Slice 0 ----------

// role is a plain text column for now ('admin' | 'pm' | 'maintenance' |
// 'tenant'); Slice 5 and 7 add real staff/tenant tables — this stays the
// login table for every human account regardless of role. admin has
// unrestricted access to user management; pm is scoped to creating and
// managing the "lower tier" maintenance/tenant accounts (see
// routes/users.ts) and can't touch pm or admin accounts.
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

// ---------- Slice 1: pipeline capture & board ----------

// A reusable landlord/owner record — one owner can hold several properties.
export const owners = pgTable('owners', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull().default(''),
  lastName: text('last_name').notNull().default(''),
  company: boolean('company').notNull().default(false),
  companyName: text('company_name').notNull().default(''),
  mobile: text('mobile').notNull().default(''),
  email: text('email').notNull().default(''),
  address: text('address').notNull().default(''),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// pipelineStatus values: new_lead, under_review, contacted,
// site_visit_scheduled, site_visit_completed, property_evaluation,
// negotiation, terms_proposed, awaiting_owner_decision, under_agreement,
// leased, rejected, withdrawn, lost — grouped client-side into the board
// columns (lead / visit / negotiation / agreement / leased / lost).
export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),

  line1: text('line1').notNull().default(''),
  line2: text('line2').notNull().default(''),
  city: text('city').notNull().default(''),
  village: text('village').notNull().default(''),
  region: text('region').notNull().default(''),
  country: text('country').notNull().default('Guyana'),
  gps: text('gps').notNull().default(''),

  typeCategory: text('type_category').notNull().default('Residential'),
  typeSub: text('type_sub').notNull().default(''),
  // { buildingSize, landSize, floors, bedrooms, bathrooms, rooms, parking, furnished }
  specs: jsonb('specs').notNull().default({}),
  features: text('features').array().notNull().default([]),

  contactName: text('contact_name').notNull().default(''),
  contactMobile: text('contact_mobile').notNull().default(''),
  contactHome: text('contact_home').notNull().default(''),
  contactOffice: text('contact_office').notNull().default(''),
  contactEmail: text('contact_email').notNull().default(''),
  contactRole: text('contact_role').notNull().default('Owner'),

  ownerId: uuid('owner_id').references(() => owners.id, { onDelete: 'set null' }),
  targetClients: text('target_clients').array().notNull().default([]),
  pipelineStatus: text('pipeline_status').notNull().default('new_lead'),

  landlordCost: numeric('landlord_cost'),
  clientRental: numeric('client_rental'),
  deposit: numeric('deposit'),
  leaseStart: date('lease_start'),
  leaseEnd: date('lease_end'),
  renewalDate: date('renewal_date'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Slice 2: activity & visits ----------

// type values: Note, Phone Call, Email, WhatsApp, Site Visit,
// Client Showing, Negotiation, Price Change, Document Received,
// Document Sent, Follow-Up
export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('Note'),
  text: text('text').notNull().default(''),
  nextAction: text('next_action').notNull().default(''),
  followUpDate: date('follow_up_date'),
  by: text('by').notNull().default(''),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

// type values: Initial Site Visit, Property Inspection, Client Showing,
// Follow-Up Showing, Final Inspection, Move-In Inspection,
// Move-Out Inspection, Other
// status values: Not Scheduled, Scheduled, Confirmed, Completed,
// Rescheduled, Cancelled, No Show
export const visits = pgTable('visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  type: text('type').notNull().default('Initial Site Visit'),
  status: text('status').notNull().default('Scheduled'),
  attendees: integer('attendees').notNull().default(1),
  client: text('client').notNull().default('Internal'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Slice 3: real photo storage ----------

// storageKey is a relative path under the photos volume, e.g.
// "<propertyId>/<uuid>.jpg" — served back by the API's static route.
export const propertyPhotos = pgTable('property_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  storageKey: text('storage_key').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
