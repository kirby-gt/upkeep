import type { Owner, Property, ActivityEntry, Visit, Photo, NewOwnerInput, AppUser, NewUserInput } from './types.js';

export type Me = {
  email: string;
  role: string;
  serverTime: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: init?.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

// ---------- Auth ----------

export function login(email: string, password: string) {
  return request<{ ok: true }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request<{ ok: true }>('/auth/logout', { method: 'POST' });
}

export function fetchMe() {
  return request<Me>('/me');
}

// ---------- Users ----------

export function fetchUsers() {
  return request<AppUser[]>('/users');
}

export function createUser(input: NewUserInput) {
  return request<AppUser>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteUser(id: string) {
  return request<{ ok: true }>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export function resetUserPassword(id: string, password: string) {
  return request<{ ok: true }>(`/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// ---------- Properties ----------

export function fetchProperties() {
  return request<Property[]>('/properties');
}

export function fetchProperty(id: string) {
  return request<Property>(`/properties/${id}`);
}

export type NewPropertyInput = Omit<
  Property,
  'id' | 'pipelineStatus' | 'createdAt' | 'leaseStart' | 'leaseEnd' | 'renewalDate' | 'clientRental' | 'deposit'
>;

export function createProperty(input: Partial<NewPropertyInput>) {
  return request<Property>('/properties', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updatePropertyStatus(id: string, pipelineStatus: string) {
  return request<Property>(`/properties/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ pipelineStatus }),
  });
}

export function updateProperty(id: string, input: Partial<NewPropertyInput>) {
  return request<Property>(`/properties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

// ---------- Owners ----------

export function fetchOwners() {
  return request<Owner[]>('/owners');
}

export function createOwner(input: NewOwnerInput) {
  return request<Owner>('/owners', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateOwner(id: string, input: NewOwnerInput) {
  return request<Owner>(`/owners/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

// ---------- Activity ----------

export function fetchActivity(propertyId: string) {
  return request<ActivityEntry[]>(`/properties/${propertyId}/activity`);
}

export function createActivity(
  propertyId: string,
  input: { type: string; text: string; nextAction?: string; followUpDate?: string | null }
) {
  return request<ActivityEntry>(`/properties/${propertyId}/activity`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ---------- Visits ----------

export function fetchVisits(propertyId: string) {
  return request<Visit[]>(`/properties/${propertyId}/visits`);
}

export function createVisit(
  propertyId: string,
  input: { date: string; type: string; status: string; attendees?: number; client?: string }
) {
  return request<Visit>(`/properties/${propertyId}/visits`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ---------- Photos ----------

export function fetchPhotos(propertyId: string) {
  return request<Photo[]>(`/properties/${propertyId}/photos`);
}

export function uploadPhotos(propertyId: string, files: File[]) {
  const formData = new FormData();
  for (const file of files) formData.append('photos', file);
  return request<Photo[]>(`/properties/${propertyId}/photos`, {
    method: 'POST',
    body: formData,
  });
}

export function deletePhoto(propertyId: string, photoId: string) {
  return request<{ ok: true }>(`/properties/${propertyId}/photos/${photoId}`, {
    method: 'DELETE',
  });
}

export function photoUrl(propertyId: string, storageKey: string) {
  // storageKey is "<propertyId>/<filename>" — the route is /api/photos/:propertyId/:filename
  const filename = storageKey.split('/').pop();
  return `/api/photos/${propertyId}/${filename}`;
}
