import { useMemo, useState } from 'react';
import {
  CONTACT_ROLES,
  FEATURE_OPTIONS,
  PROPERTY_TYPES,
  REGIONS,
  TARGET_CLIENT_PRESETS,
} from '../constants.js';
import type { NewOwnerInput, Owner, Property, PropertySpecs } from '../types.js';
import { createOwner, createProperty, uploadPhotos, type NewPropertyInput } from '../api.js';
import { ownerDisplayName } from '../lib/format.js';

type OwnerMode = 'search' | 'create';

const EMPTY_SPECS: PropertySpecs = {
  buildingSize: '',
  landSize: '',
  bedrooms: '',
  bathrooms: '',
  parking: '',
  furnished: '',
};

const EMPTY_NEW_OWNER: NewOwnerInput = {
  firstName: '',
  lastName: '',
  company: false,
  companyName: '',
  mobile: '',
  email: '',
  address: '',
};

type PropertyForm = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  village: string;
  region: string;
  gps: string;
  typeCategory: string;
  typeSub: string;
  specs: PropertySpecs;
  contactName: string;
  contactMobile: string;
  contactHome: string;
  contactOffice: string;
  contactEmail: string;
  contactRole: string;
  landlordCost: string;
};

const EMPTY_PROPERTY: PropertyForm = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  village: '',
  region: '',
  gps: '',
  typeCategory: 'Residential',
  typeSub: '',
  specs: EMPTY_SPECS,
  contactName: '',
  contactMobile: '',
  contactHome: '',
  contactOffice: '',
  contactEmail: '',
  contactRole: 'Owner',
  landlordCost: '',
};

export default function AddPropertyModal({
  owners,
  onClose,
  onCreated,
  onOwnerCreated,
}: {
  owners: Owner[];
  onClose: () => void;
  onCreated: (property: Property) => void;
  onOwnerCreated: (owner: Owner) => void;
}) {
  const [form, setForm] = useState<PropertyForm>(EMPTY_PROPERTY);
  const [features, setFeatures] = useState<string[]>([]);
  const [targetClients, setTargetClients] = useState<string[]>([]);
  const [customTarget, setCustomTarget] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  // Owner selection state is deliberately independent of `ownerMode`, and
  // switching modes never clears either set of fields — that was Slice 0's
  // "form resets on toggle" bug, and it doesn't get to come back here.
  const [ownerMode, setOwnerMode] = useState<OwnerMode>('search');
  const [ownerQuery, setOwnerQuery] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [newOwner, setNewOwner] = useState<NewOwnerInput>(EMPTY_NEW_OWNER);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subTypes = PROPERTY_TYPES[form.typeCategory] ?? [];

  const filteredOwners = useMemo(() => {
    const q = ownerQuery.trim().toLowerCase();
    if (!q) return owners.slice(0, 20);
    return owners.filter((o) => ownerDisplayName(o).toLowerCase().includes(q)).slice(0, 20);
  }, [owners, ownerQuery]);

  function set<K extends keyof PropertyForm>(key: K, value: PropertyForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setSpec<K extends keyof PropertySpecs>(key: K, value: string) {
    setForm((f) => ({ ...f, specs: { ...f.specs, [key]: value } }));
  }
  function setNewOwnerField<K extends keyof NewOwnerInput>(key: K, value: NewOwnerInput[K]) {
    setNewOwner((o) => ({ ...o, [key]: value }));
  }

  function toggleFeature(feature: string) {
    setFeatures((f) => (f.includes(feature) ? f.filter((x) => x !== feature) : [...f, feature]));
  }
  function toggleTarget(target: string) {
    setTargetClients((t) => (t.includes(target) ? t.filter((x) => x !== target) : [...t, target]));
  }
  function addCustomTarget() {
    const value = customTarget.trim();
    if (value && !targetClients.includes(value)) setTargetClients((t) => [...t, value]);
    setCustomTarget('');
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    setPhotos((prev) => [...prev, ...incoming].slice(0, 5));
  }
  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError('Property name is required.');
    if (!form.line1.trim()) return setError('Address line 1 is required.');
    if (!form.contactName.trim()) return setError('A property contact name is required.');
    if (!form.contactMobile.trim()) return setError('A property contact mobile number is required.');
    if (ownerMode === 'create' && !newOwner.mobile.trim()) {
      return setError('The new owner needs a mobile number.');
    }
    if (
      ownerMode === 'create' &&
      newOwner.company &&
      !newOwner.companyName.trim()
    ) {
      return setError('Company name is required for a company owner.');
    }

    setSubmitting(true);
    try {
      let ownerId = selectedOwnerId;

      if (ownerMode === 'create' && (newOwner.mobile.trim() || newOwner.firstName.trim() || newOwner.companyName.trim())) {
        const owner = await createOwner(newOwner);
        onOwnerCreated(owner);
        ownerId = owner.id;
      }

      const input: Partial<NewPropertyInput> = {
        name: form.name.trim(),
        line1: form.line1.trim(),
        line2: form.line2,
        city: form.city,
        village: form.village,
        region: form.region,
        country: 'Guyana',
        gps: form.gps,
        typeCategory: form.typeCategory,
        typeSub: form.typeSub,
        specs: form.specs,
        features,
        contactName: form.contactName.trim(),
        contactMobile: form.contactMobile.trim(),
        contactHome: form.contactHome,
        contactOffice: form.contactOffice,
        contactEmail: form.contactEmail,
        contactRole: form.contactRole,
        ownerId,
        targetClients,
        landlordCost: form.landlordCost || null,
      };

      const property = await createProperty(input);

      if (photos.length > 0) {
        await uploadPhotos(property.id, photos);
      }

      onCreated(property);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <h2>Add Property to Pipeline</h2>
        <p className="modal-sub">Capture a lead property — you can fill in the rest as the deal progresses.</p>
        <form onSubmit={handleSubmit}>
          <div className="section-title">Property</div>
          <div className="field">
            <label>Property name</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="form-cols">
            <div className="field">
              <label>Address line 1</label>
              <input type="text" value={form.line1} onChange={(e) => set('line1', e.target.value)} required />
            </div>
            <div className="field">
              <label>Address line 2</label>
              <input type="text" value={form.line2} onChange={(e) => set('line2', e.target.value)} />
            </div>
          </div>
          <div className="form-cols">
            <div className="field">
              <label>City / Town</label>
              <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="field">
              <label>Village / Area</label>
              <input type="text" value={form.village} onChange={(e) => set('village', e.target.value)} />
            </div>
          </div>
          <div className="form-cols">
            <div className="field">
              <label>Region</label>
              <select value={form.region} onChange={(e) => set('region', e.target.value)}>
                <option value="">Select region…</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>GPS coordinates</label>
              <input type="text" value={form.gps} onChange={(e) => set('gps', e.target.value)} placeholder="lat, lng" />
            </div>
          </div>
          <div className="form-cols">
            <div className="field">
              <label>Type</label>
              <select
                value={form.typeCategory}
                onChange={(e) => setForm((f) => ({ ...f, typeCategory: e.target.value, typeSub: '' }))}
              >
                {Object.keys(PROPERTY_TYPES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Subtype</label>
              <select value={form.typeSub} onChange={(e) => set('typeSub', e.target.value)}>
                <option value="">Select subtype…</option>
                {subTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="subfieldset">
            <div className="form-cols">
              <div className="field">
                <label>Building size</label>
                <input type="text" value={form.specs.buildingSize} onChange={(e) => setSpec('buildingSize', e.target.value)} placeholder="sq ft" />
              </div>
              <div className="field">
                <label>Land size</label>
                <input type="text" value={form.specs.landSize} onChange={(e) => setSpec('landSize', e.target.value)} placeholder="sq ft" />
              </div>
            </div>
            <div className="form-cols">
              <div className="field">
                <label>Bedrooms</label>
                <input type="text" value={form.specs.bedrooms} onChange={(e) => setSpec('bedrooms', e.target.value)} />
              </div>
              <div className="field">
                <label>Bathrooms</label>
                <input type="text" value={form.specs.bathrooms} onChange={(e) => setSpec('bathrooms', e.target.value)} />
              </div>
            </div>
            <div className="form-cols">
              <div className="field">
                <label>Parking</label>
                <input type="text" value={form.specs.parking} onChange={(e) => setSpec('parking', e.target.value)} />
              </div>
              <div className="field">
                <label>Furnished</label>
                <input type="text" value={form.specs.furnished} onChange={(e) => setSpec('furnished', e.target.value)} placeholder="Unfurnished / Semi / Fully" />
              </div>
            </div>
          </div>

          <div className="field">
            <label>Features</label>
            <div className="feature-grid">
              {FEATURE_OPTIONS.map((feature) => (
                <label className="feature-chip" key={feature}>
                  <input type="checkbox" checked={features.includes(feature)} onChange={() => toggleFeature(feature)} />
                  {feature}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Photos ({photos.length}/5)</label>
            <div className="file-row">
              <label className="file-btn">
                Choose files…
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  disabled={photos.length >= 5}
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              {photos.map((file, i) => (
                <div className="photo-thumb-wrap" key={i}>
                  <img className="photo-thumb" src={URL.createObjectURL(file)} alt={file.name} />
                  <button type="button" className="photo-thumb-remove" onClick={() => removePhoto(i)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <span className="field-hint">Up to 5 photos, JPG/PNG/WEBP/GIF, 8MB max each.</span>
          </div>

          <div className="section-title">Property contact</div>
          <div className="form-cols">
            <div className="field">
              <label>Contact name</label>
              <input type="text" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} required />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={form.contactRole} onChange={(e) => set('contactRole', e.target.value)}>
                {CONTACT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-cols">
            <div className="field">
              <label>Mobile</label>
              <input type="text" value={form.contactMobile} onChange={(e) => set('contactMobile', e.target.value)} required />
            </div>
            <div className="field">
              <label>Home / office</label>
              <input type="text" value={form.contactHome} onChange={(e) => set('contactHome', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
          </div>

          <div className="section-title">Owner</div>
          <div className="radio-row" style={{ marginBottom: 10 }}>
            <label className={`radio-opt${ownerMode === 'search' ? ' checked' : ''}`}>
              <input type="radio" checked={ownerMode === 'search'} onChange={() => setOwnerMode('search')} />
              Find existing owner
            </label>
            <label className={`radio-opt${ownerMode === 'create' ? ' checked' : ''}`}>
              <input type="radio" checked={ownerMode === 'create'} onChange={() => setOwnerMode('create')} />
              Add new owner
            </label>
          </div>

          {ownerMode === 'search' ? (
            <div className="field">
              <input
                type="text"
                placeholder="Search owners by name…"
                value={ownerQuery}
                onChange={(e) => setOwnerQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  if (filteredOwners.length > 0) setSelectedOwnerId(filteredOwners[0].id);
                }}
              />
              <div className="owner-search-list">
                {filteredOwners.length === 0 && <div className="owner-search-item">No owners match.</div>}
                {filteredOwners.map((owner) => (
                  <div
                    key={owner.id}
                    className={`owner-search-item${selectedOwnerId === owner.id ? ' picked' : ''}`}
                    onClick={() => setSelectedOwnerId(owner.id === selectedOwnerId ? null : owner.id)}
                  >
                    {ownerDisplayName(owner)} · {owner.mobile}
                  </div>
                ))}
              </div>
              {selectedOwnerId && <span className="field-hint">Owner selected — will be linked to this property.</span>}
            </div>
          ) : (
            <div className="subfieldset">
              <div className="radio-row" style={{ marginBottom: 13 }}>
                <label className={`radio-opt${!newOwner.company ? ' checked' : ''}`}>
                  <input type="radio" checked={!newOwner.company} onChange={() => setNewOwnerField('company', false)} />
                  Individual
                </label>
                <label className={`radio-opt${newOwner.company ? ' checked' : ''}`}>
                  <input type="radio" checked={newOwner.company} onChange={() => setNewOwnerField('company', true)} />
                  Company
                </label>
              </div>
              {newOwner.company ? (
                <div className="field">
                  <label>Company name</label>
                  <input type="text" value={newOwner.companyName} onChange={(e) => setNewOwnerField('companyName', e.target.value)} />
                </div>
              ) : (
                <div className="form-cols">
                  <div className="field">
                    <label>First name</label>
                    <input type="text" value={newOwner.firstName} onChange={(e) => setNewOwnerField('firstName', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Last name</label>
                    <input type="text" value={newOwner.lastName} onChange={(e) => setNewOwnerField('lastName', e.target.value)} />
                  </div>
                </div>
              )}
              <div className="form-cols">
                <div className="field">
                  <label>Mobile</label>
                  <input type="text" value={newOwner.mobile} onChange={(e) => setNewOwnerField('mobile', e.target.value)} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={newOwner.email} onChange={(e) => setNewOwnerField('email', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="section-title">Target clients &amp; asking cost</div>
          <div className="field">
            <label>Target clients</label>
            <div className="tag-picker">
              {TARGET_CLIENT_PRESETS.map((preset) => (
                <span
                  key={preset}
                  className={`tag-opt${targetClients.includes(preset) ? ' picked' : ''}`}
                  onClick={() => toggleTarget(preset)}
                >
                  {preset}
                </span>
              ))}
            </div>
            <div className="file-row" style={{ marginTop: 8 }}>
              <input
                type="text"
                placeholder="Add another target client…"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTarget();
                  }
                }}
                style={{ flex: 1, minWidth: 160 }}
              />
              <button type="button" className="btn btn-sm" onClick={addCustomTarget}>
                Add
              </button>
            </div>
            {targetClients.filter((t) => !TARGET_CLIENT_PRESETS.includes(t)).length > 0 && (
              <div className="tag-list" style={{ marginTop: 8 }}>
                {targetClients
                  .filter((t) => !TARGET_CLIENT_PRESETS.includes(t))
                  .map((t) => (
                    <span className="tag tag-brand" key={t}>
                      {t}
                      <span className="tag-x" onClick={() => toggleTarget(t)}>
                        ×
                      </span>
                    </span>
                  ))}
              </div>
            )}
          </div>
          <div className="field">
            <label>Landlord asking cost (GYD/month)</label>
            <input type="number" value={form.landlordCost} onChange={(e) => set('landlordCost', e.target.value)} />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add to Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
