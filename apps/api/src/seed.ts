import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db, schema } from './db/client.js';
import { hashPassword } from './auth/password.js';

// Seeds a small set of logins (one per role) plus a realistic pipeline
// dataset — owners, properties spread across every board column, activity
// history, and visits — so the app has something to look at beyond an
// empty board on a fresh checkout. Everything here is idempotent: re-run
// `npm run db:seed` as often as you like, it only inserts what's missing.
const PRIMARY_EMAIL = process.env.SEED_PM_EMAIL ?? 'steve@upkeep.local';
const PRIMARY_PASSWORD = process.env.SEED_PM_PASSWORD ?? 'upkeep-dev';

const SAMPLE_USERS = [
  { email: PRIMARY_EMAIL, password: PRIMARY_PASSWORD, role: 'admin' },
  { email: 'maria@upkeep.local', password: 'upkeep-dev', role: 'pm' },
  { email: 'raj@upkeep.local', password: 'upkeep-dev', role: 'maintenance' },
  { email: 'tenant@upkeep.local', password: 'upkeep-dev', role: 'tenant' },
] as const;

const REGION_4 = 'Region 4 – Demerara-Mahaica';

const SAMPLE_OWNERS = [
  {
    key: 'chan',
    firstName: 'Michael',
    lastName: 'Chan',
    company: false,
    companyName: '',
    mobile: '592-623-1145',
    email: 'mchan.gy@gmail.com',
    address: '14 Camp Street, Georgetown',
    notes: '',
  },
  {
    key: 'persaud',
    firstName: 'Anand',
    lastName: 'Persaud',
    company: false,
    companyName: '',
    mobile: '592-615-8820',
    email: 'anand.persaud@yahoo.com',
    address: 'Lot 7 Better Hope, East Coast Demerara',
    notes: '',
  },
  {
    key: 'demerara-holdings',
    firstName: '',
    lastName: '',
    company: true,
    companyName: 'Demerara Holdings Inc.',
    mobile: '592-227-4410',
    email: 'info@demerarholdings.gy',
    address: '45 Robb Street, Georgetown',
    notes: 'Owns several commercial units around Georgetown; prefers email for the first contact.',
  },
  {
    key: 'fraser',
    firstName: 'Denise',
    lastName: 'Fraser',
    company: false,
    companyName: '',
    mobile: '592-642-3390',
    email: 'denise.fraser@outlook.com',
    address: '22 Queenstown, Georgetown',
    notes: '',
  },
] as const;

type OwnerKey = (typeof SAMPLE_OWNERS)[number]['key'];

const SAMPLE_PROPERTIES = [
  {
    key: 'duke-street-office',
    name: '14 Duke Street Office Suite',
    line1: '14 Duke Street',
    city: 'Georgetown',
    region: REGION_4,
    typeCategory: 'Commercial',
    typeSub: 'Office',
    specs: { buildingSize: '2,400 sq ft', parking: '6 spaces', furnished: 'Unfurnished' },
    features: ['Air Conditioning', 'Generator', 'Internet'],
    contactName: 'Michael Chan',
    contactMobile: '592-623-1145',
    contactEmail: 'mchan.gy@gmail.com',
    contactRole: 'Owner',
    ownerKey: 'chan' as OwnerKey,
    targetClients: ['ExxonMobil'],
    pipelineStatus: 'new_lead',
    landlordCost: '350000',
  },
  {
    key: 'good-hope-house',
    name: 'Lot 22 Good Hope Housing Scheme',
    line1: 'Lot 22 Good Hope',
    city: 'Good Hope',
    region: REGION_4,
    typeCategory: 'Residential',
    typeSub: 'Single-Family',
    specs: { bedrooms: '3', bathrooms: '2', parking: '2', furnished: 'Semi' },
    features: ['Water Storage', 'Gated Property'],
    contactName: 'Anand Persaud',
    contactMobile: '592-615-8820',
    contactEmail: 'anand.persaud@yahoo.com',
    contactRole: 'Owner',
    ownerKey: 'persaud' as OwnerKey,
    targetClients: [],
    pipelineStatus: 'contacted',
    landlordCost: '180000',
  },
  {
    key: 'providence-warehouse',
    name: 'Providence Warehouse Complex',
    line1: 'Providence Industrial Site',
    city: 'Providence',
    region: REGION_4,
    typeCategory: 'Commercial',
    typeSub: 'Warehouse',
    specs: { buildingSize: '18,000 sq ft', landSize: '1.5 acres', parking: '20 spaces' },
    features: ['Security System', 'CCTV Cameras', 'Gated Property'],
    contactName: 'Demerara Holdings — Facilities',
    contactMobile: '592-227-4410',
    contactEmail: 'info@demerarholdings.gy',
    contactRole: 'Agent',
    ownerKey: 'demerara-holdings' as OwnerKey,
    targetClients: ['MODEC', 'Saipem'],
    pipelineStatus: 'site_visit_scheduled',
    landlordCost: '900000',
  },
  {
    key: 'sheriff-street-apts',
    name: '37 Sheriff Street Apartments',
    line1: '37 Sheriff Street',
    city: 'Georgetown',
    region: REGION_4,
    typeCategory: 'Residential',
    typeSub: 'Apartment Building',
    specs: { buildingSize: '9,000 sq ft', bedrooms: '2 (per unit)', bathrooms: '1 (per unit)' },
    features: ['Air Conditioning', 'Security Hut', 'Elevator'],
    contactName: 'Michael Chan',
    contactMobile: '592-623-1145',
    contactEmail: 'mchan.gy@gmail.com',
    contactRole: 'Owner',
    ownerKey: 'chan' as OwnerKey,
    targetClients: [],
    pipelineStatus: 'site_visit_completed',
    landlordCost: '420000',
  },
  {
    key: 'diamond-retail-plaza',
    name: 'Diamond Retail Plaza Unit 3',
    line1: 'Diamond Public Road, Unit 3',
    city: 'Diamond',
    region: REGION_4,
    typeCategory: 'Commercial',
    typeSub: 'Retail',
    specs: { buildingSize: '1,800 sq ft', parking: '8 spaces' },
    features: ['Air Conditioning', 'CCTV Cameras'],
    contactName: 'Demerara Holdings — Leasing',
    contactMobile: '592-227-4410',
    contactEmail: 'info@demerarholdings.gy',
    contactRole: 'Agent',
    ownerKey: 'demerara-holdings' as OwnerKey,
    targetClients: ['TechnipFMC'],
    pipelineStatus: 'negotiation',
    landlordCost: '275000',
    clientRental: '300000',
  },
  {
    key: 'meadowbrook-gardens',
    name: '12 Meadowbrook Gardens',
    line1: '12 Meadowbrook Gardens',
    city: 'Georgetown',
    region: REGION_4,
    typeCategory: 'Residential',
    typeSub: 'Townhouse',
    specs: { bedrooms: '3', bathrooms: '2.5', parking: '2', furnished: 'Fully' },
    features: ['Air Conditioning', 'Generator', 'Gated Property', 'Internet'],
    contactName: 'Denise Fraser',
    contactMobile: '592-642-3390',
    contactEmail: 'denise.fraser@outlook.com',
    contactRole: 'Owner',
    ownerKey: 'fraser' as OwnerKey,
    targetClients: [],
    pipelineStatus: 'under_agreement',
    landlordCost: '240000',
    clientRental: '260000',
    deposit: '260000',
  },
  {
    key: 'croal-street-guest-house',
    name: '8 Croal Street Guest House',
    line1: '8 Croal Street',
    city: 'Georgetown',
    region: REGION_4,
    typeCategory: 'Residential',
    typeSub: 'Multi-Family',
    specs: { bedrooms: '6', bathrooms: '6', furnished: 'Fully' },
    features: ['Air Conditioning', 'Generator', 'Security System', 'Internet', 'Laundry'],
    contactName: 'Michael Chan',
    contactMobile: '592-623-1145',
    contactEmail: 'mchan.gy@gmail.com',
    contactRole: 'Owner',
    ownerKey: 'chan' as OwnerKey,
    targetClients: ['MODEC'],
    pipelineStatus: 'leased',
    landlordCost: '500000',
    clientRental: '540000',
    deposit: '540000',
    leaseStart: '2026-06-01',
    leaseEnd: '2027-05-31',
    renewalDate: '2027-03-01',
  },
  {
    key: 'timehri-storage-yard',
    name: 'Timehri Storage Yard',
    line1: 'Timehri Public Road',
    city: 'Timehri',
    region: REGION_4,
    typeCategory: 'Commercial',
    typeSub: 'Storage',
    specs: { landSize: '2 acres' },
    features: ['Gated Property'],
    contactName: 'Anand Persaud',
    contactMobile: '592-615-8820',
    contactEmail: 'anand.persaud@yahoo.com',
    contactRole: 'Owner',
    ownerKey: 'persaud' as OwnerKey,
    targetClients: [],
    pipelineStatus: 'rejected',
    landlordCost: '150000',
  },
] as const;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const SAMPLE_ACTIVITY: Record<string, Array<{ type: string; text: string; nextAction?: string; followUpDate?: string; by: string; at: Date }>> = {
  'duke-street-office': [
    { type: 'Note', text: 'Property added to pipeline.', by: PRIMARY_EMAIL, at: daysAgo(10) },
    {
      type: 'Phone Call',
      text: "Spoke with the owner about lease terms and general availability.",
      nextAction: 'Schedule a follow-up call once ExxonMobil confirms interest.',
      followUpDate: isoDate(daysFromNow(3)),
      by: 'maria@upkeep.local',
      at: daysAgo(8),
    },
  ],
  'good-hope-house': [
    { type: 'Note', text: 'Property added to pipeline.', by: PRIMARY_EMAIL, at: daysAgo(14) },
    { type: 'WhatsApp', text: 'Sent an introductory message and pricing sheet to the owner.', by: 'maria@upkeep.local', at: daysAgo(12) },
    {
      type: 'Phone Call',
      text: 'Owner confirmed interest and requested a formal proposal.',
      nextAction: 'Draft and send a proposal.',
      followUpDate: isoDate(daysFromNow(5)),
      by: 'maria@upkeep.local',
      at: daysAgo(9),
    },
  ],
  'providence-warehouse': [
    { type: 'Note', text: 'Property added to pipeline.', by: PRIMARY_EMAIL, at: daysAgo(20) },
    {
      type: 'Follow-Up',
      text: 'Scheduled a site visit with the facilities manager to assess the warehouse for MODEC.',
      by: PRIMARY_EMAIL,
      at: daysAgo(6),
    },
  ],
  'sheriff-street-apts': [
    { type: 'Note', text: 'Property added to pipeline.', by: PRIMARY_EMAIL, at: daysAgo(25) },
    { type: 'Site Visit', text: 'Completed the initial site visit with the owner present.', by: PRIMARY_EMAIL, at: daysAgo(4) },
  ],
  'diamond-retail-plaza': [
    { type: 'Note', text: 'Property added to pipeline.', by: PRIMARY_EMAIL, at: daysAgo(30) },
    {
      type: 'Negotiation',
      text: 'Proposed GYD 275,000/month; owner countered at GYD 310,000/month.',
      nextAction: 'Confirm counter-offer with TechnipFMC before responding.',
      followUpDate: isoDate(daysFromNow(2)),
      by: 'maria@upkeep.local',
      at: daysAgo(3),
    },
  ],
  'meadowbrook-gardens': [
    { type: 'Note', text: 'Property added to pipeline.', by: PRIMARY_EMAIL, at: daysAgo(35) },
    { type: 'Document Sent', text: 'Sent the draft lease agreement to the owner for review.', by: PRIMARY_EMAIL, at: daysAgo(9) },
    { type: 'Document Received', text: 'Signed lease agreement received from the owner, pending countersignature.', by: PRIMARY_EMAIL, at: daysAgo(2) },
  ],
  'croal-street-guest-house': [
    { type: 'Note', text: 'Property added to pipeline.', by: PRIMARY_EMAIL, at: daysAgo(60) },
    { type: 'Document Received', text: 'Fully executed lease on file. Tenant moves in next week.', by: PRIMARY_EMAIL, at: daysAgo(5) },
  ],
  'timehri-storage-yard': [
    { type: 'Note', text: 'Property added to pipeline.', by: PRIMARY_EMAIL, at: daysAgo(40) },
    { type: 'Phone Call', text: 'Owner rejected the proposed terms; pipeline closed.', by: 'maria@upkeep.local', at: daysAgo(15) },
  ],
};

const SAMPLE_VISITS: Record<string, Array<{ date: string; type: string; status: string; attendees: number; client: string }>> = {
  'providence-warehouse': [
    { date: isoDate(daysFromNow(4)), type: 'Initial Site Visit', status: 'Scheduled', attendees: 3, client: 'MODEC' },
  ],
  'sheriff-street-apts': [
    { date: isoDate(daysAgo(4)), type: 'Initial Site Visit', status: 'Completed', attendees: 2, client: 'Internal' },
  ],
  'croal-street-guest-house': [
    { date: isoDate(daysAgo(3)), type: 'Move-In Inspection', status: 'Completed', attendees: 1, client: 'MODEC' },
  ],
};

async function seedUsers() {
  for (const { email, password, role } of SAMPLE_USERS) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing.length > 0) {
      console.log(`Already seeded user: ${email}`);
      continue;
    }
    await db.insert(schema.users).values({ email, passwordHash: hashPassword(password), role });
    console.log(`Seeded ${role} login — email: ${email}  password: ${password}`);
  }
  console.log('Override the primary PM login with SEED_PM_EMAIL / SEED_PM_PASSWORD env vars if you want different values.');
}

async function seedOwners(): Promise<Map<OwnerKey, string>> {
  const ids = new Map<OwnerKey, string>();

  for (const owner of SAMPLE_OWNERS) {
    const [existing] = await db.select().from(schema.owners).where(eq(schema.owners.mobile, owner.mobile)).limit(1);
    if (existing) {
      console.log(`Already seeded owner: ${owner.mobile}`);
      ids.set(owner.key, existing.id);
      continue;
    }

    const [row] = await db
      .insert(schema.owners)
      .values({
        firstName: owner.firstName,
        lastName: owner.lastName,
        company: owner.company,
        companyName: owner.companyName,
        mobile: owner.mobile,
        email: owner.email,
        address: owner.address,
        notes: owner.notes,
      })
      .returning();

    console.log(`Seeded owner: ${owner.company ? owner.companyName : `${owner.firstName} ${owner.lastName}`}`);
    ids.set(owner.key, row.id);
  }

  return ids;
}

async function seedProperties(ownerIds: Map<OwnerKey, string>): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const property of SAMPLE_PROPERTIES) {
    const [existing] = await db.select().from(schema.properties).where(eq(schema.properties.name, property.name)).limit(1);
    if (existing) {
      console.log(`Already seeded property: ${property.name}`);
      ids.set(property.key, existing.id);
      continue;
    }

    const [row] = await db
      .insert(schema.properties)
      .values({
        name: property.name,
        line1: property.line1,
        city: property.city,
        region: property.region,
        typeCategory: property.typeCategory,
        typeSub: property.typeSub,
        specs: property.specs,
        features: [...property.features],
        contactName: property.contactName,
        contactMobile: property.contactMobile,
        contactEmail: property.contactEmail,
        contactRole: property.contactRole,
        ownerId: ownerIds.get(property.ownerKey) ?? null,
        targetClients: [...property.targetClients],
        pipelineStatus: property.pipelineStatus,
        landlordCost: property.landlordCost ?? null,
        clientRental: 'clientRental' in property ? property.clientRental : null,
        deposit: 'deposit' in property ? property.deposit : null,
        leaseStart: 'leaseStart' in property ? property.leaseStart : null,
        leaseEnd: 'leaseEnd' in property ? property.leaseEnd : null,
        renewalDate: 'renewalDate' in property ? property.renewalDate : null,
      })
      .returning();

    console.log(`Seeded property: ${property.name}`);
    ids.set(property.key, row.id);
  }

  return ids;
}

async function seedActivity(propertyIds: Map<string, string>) {
  for (const [key, entries] of Object.entries(SAMPLE_ACTIVITY)) {
    const propertyId = propertyIds.get(key);
    if (!propertyId) continue;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.activityLog)
      .where(eq(schema.activityLog.propertyId, propertyId));
    if (Number(count) > 0) {
      console.log(`Already seeded activity for: ${key}`);
      continue;
    }

    for (const entry of entries) {
      await db.insert(schema.activityLog).values({
        propertyId,
        type: entry.type,
        text: entry.text,
        nextAction: entry.nextAction ?? '',
        followUpDate: entry.followUpDate ?? null,
        by: entry.by,
        at: entry.at,
      });
    }
    console.log(`Seeded ${entries.length} activity entries for: ${key}`);
  }
}

async function seedVisits(propertyIds: Map<string, string>) {
  for (const [key, visits] of Object.entries(SAMPLE_VISITS)) {
    const propertyId = propertyIds.get(key);
    if (!propertyId) continue;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.visits)
      .where(eq(schema.visits.propertyId, propertyId));
    if (Number(count) > 0) {
      console.log(`Already seeded visits for: ${key}`);
      continue;
    }

    for (const visit of visits) {
      await db.insert(schema.visits).values({ propertyId, ...visit });
    }
    console.log(`Seeded ${visits.length} visit(s) for: ${key}`);
  }
}

async function main() {
  await seedUsers();
  const ownerIds = await seedOwners();
  const propertyIds = await seedProperties(ownerIds);
  await seedActivity(propertyIds);
  await seedVisits(propertyIds);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
