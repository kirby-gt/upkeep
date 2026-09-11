export const REGIONS = [
  'Region 1 – Barima-Waini',
  'Region 2 – Pomeroon-Supenaam',
  'Region 3 – Essequibo Islands-West Demerara',
  'Region 4 – Demerara-Mahaica',
  'Region 5 – Mahaica-Berbice',
  'Region 6 – East Berbice-Corentyne',
  'Region 7 – Cuyuni-Mazaruni',
  'Region 8 – Potaro-Siparuni',
  'Region 9 – Upper Takutu-Upper Essequibo',
  'Region 10 – Upper Demerara-Berbice',
];

export const PROPERTY_TYPES: Record<string, string[]> = {
  Residential: ['Single-Family', 'Condo', 'Townhouse', 'Multi-Family', 'Apartment Building', 'Other Residential'],
  Commercial: ['Office', 'Retail', 'Shopping Center', 'Industrial', 'Warehouse', 'Storage', 'Parking', 'Other Commercial'],
};

export const FEATURE_OPTIONS = [
  'Air Conditioning',
  'Swimming Pool',
  'Generator',
  'Security Hut',
  'Security System',
  'CCTV Cameras',
  'Gym',
  'Elevator',
  'Laundry',
  'Kitchen',
  'Internet',
  'Water Storage',
  'Parking',
  'Gated Property',
  'Fire Alarm',
  'Fire Suppression',
  'Pets Allowed',
];

export const TARGET_CLIENT_PRESETS = ['MODEC', 'TechnipFMC', 'Saipem', 'ExxonMobil'];

export const CONTACT_ROLES = ['Owner', 'Landlord', 'Agent', 'Property Manager', 'Broker', 'Representative', 'Other'];

export const VISIT_TYPES = [
  'Initial Site Visit',
  'Property Inspection',
  'Client Showing',
  'Follow-Up Showing',
  'Final Inspection',
  'Move-In Inspection',
  'Move-Out Inspection',
  'Other',
];

export const VISIT_STATUSES = ['Not Scheduled', 'Scheduled', 'Confirmed', 'Completed', 'Rescheduled', 'Cancelled', 'No Show'];

export const ACTIVITY_TYPES = [
  'Note',
  'Phone Call',
  'Email',
  'WhatsApp',
  'Site Visit',
  'Client Showing',
  'Negotiation',
  'Price Change',
  'Document Received',
  'Document Sent',
  'Follow-Up',
];

export const PIPELINE_STATUS: Record<string, { label: string; group: string }> = {
  new_lead: { label: 'New Lead', group: 'lead' },
  under_review: { label: 'Under Review', group: 'lead' },
  contacted: { label: 'Contacted', group: 'lead' },
  site_visit_scheduled: { label: 'Site Visit Scheduled', group: 'visit' },
  site_visit_completed: { label: 'Site Visit Completed', group: 'visit' },
  property_evaluation: { label: 'Property Evaluation', group: 'negotiation' },
  negotiation: { label: 'Negotiation', group: 'negotiation' },
  terms_proposed: { label: 'Terms Proposed', group: 'negotiation' },
  awaiting_owner_decision: { label: 'Awaiting Owner Decision', group: 'negotiation' },
  under_agreement: { label: 'Under Agreement', group: 'agreement' },
  leased: { label: 'Leased', group: 'leased' },
  rejected: { label: 'Rejected', group: 'lost' },
  withdrawn: { label: 'Withdrawn', group: 'lost' },
  lost: { label: 'Lost', group: 'lost' },
};

export const PIPELINE_STATUS_ORDER = Object.keys(PIPELINE_STATUS);

export const BOARD_GROUPS = [
  { key: 'lead', label: 'Lead / Review', color: 'var(--st-new)' },
  { key: 'visit', label: 'Site Visit', color: 'var(--st-ack)' },
  { key: 'negotiation', label: 'Negotiation', color: 'var(--st-inprog)' },
  { key: 'agreement', label: 'Under Agreement', color: 'var(--st-sched)' },
  { key: 'leased', label: 'Leased', color: 'var(--st-closed)' },
  { key: 'lost', label: 'Lost / Declined', color: 'var(--st-cancelled)' },
];
