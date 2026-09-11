export type Owner = {
  id: string;
  firstName: string;
  lastName: string;
  company: boolean;
  companyName: string;
  mobile: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
};

export type PropertySpecs = {
  buildingSize?: string;
  landSize?: string;
  bedrooms?: string;
  bathrooms?: string;
  parking?: string;
  furnished?: string;
};

export type Property = {
  id: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  village: string;
  region: string;
  country: string;
  gps: string;
  typeCategory: string;
  typeSub: string;
  specs: PropertySpecs;
  features: string[];
  contactName: string;
  contactMobile: string;
  contactHome: string;
  contactOffice: string;
  contactEmail: string;
  contactRole: string;
  ownerId: string | null;
  targetClients: string[];
  pipelineStatus: string;
  landlordCost: string | null;
  clientRental: string | null;
  deposit: string | null;
  leaseStart: string | null;
  leaseEnd: string | null;
  renewalDate: string | null;
  createdAt: string;
};

export type ActivityEntry = {
  id: string;
  propertyId: string;
  type: string;
  text: string;
  nextAction: string;
  followUpDate: string | null;
  by: string;
  at: string;
};

export type Visit = {
  id: string;
  propertyId: string;
  date: string;
  type: string;
  status: string;
  attendees: number;
  client: string;
  createdAt: string;
};

export type Photo = {
  id: string;
  propertyId: string;
  storageKey: string;
  position: number;
  createdAt: string;
};

export type NewOwnerInput = {
  firstName: string;
  lastName: string;
  company: boolean;
  companyName: string;
  mobile: string;
  email: string;
  address: string;
};
