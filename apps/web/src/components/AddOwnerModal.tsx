import { useState } from 'react';
import type { NewOwnerInput, Owner } from '../types.js';
import { createOwner, updateOwner } from '../api.js';

const EMPTY: NewOwnerInput = {
  firstName: '',
  lastName: '',
  company: false,
  companyName: '',
  mobile: '',
  email: '',
  address: '',
  notes: '',
};

function formFromOwner(owner: Owner): NewOwnerInput {
  return {
    firstName: owner.firstName,
    lastName: owner.lastName,
    company: owner.company,
    companyName: owner.companyName,
    mobile: owner.mobile,
    email: owner.email,
    address: owner.address,
    notes: owner.notes,
  };
}

export default function AddOwnerModal({
  owner,
  onClose,
  onCreated,
  onUpdated,
}: {
  owner?: Owner;
  onClose: () => void;
  onCreated?: (owner: Owner) => void;
  onUpdated?: (owner: Owner) => void;
}) {
  const isEdit = Boolean(owner);
  const [form, setForm] = useState<NewOwnerInput>(owner ? formFromOwner(owner) : EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof NewOwnerInput>(key: K, value: NewOwnerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEdit && owner) {
        const updated = await updateOwner(owner.id, form);
        onUpdated?.(updated);
      } else {
        const created = await createOwner(form);
        onCreated?.(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{isEdit ? 'Edit Owner' : 'Add Owner'}</h2>
        <p className="modal-sub">
          {isEdit ? 'Update this owner’s details.' : 'Add a landlord, agent, or company to your contact list.'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="radio-row" style={{ marginBottom: 13 }}>
            <label className={`radio-opt${!form.company ? ' checked' : ''}`}>
              <input type="radio" checked={!form.company} onChange={() => set('company', false)} />
              Individual
            </label>
            <label className={`radio-opt${form.company ? ' checked' : ''}`}>
              <input type="radio" checked={form.company} onChange={() => set('company', true)} />
              Company
            </label>
          </div>

          {form.company ? (
            <div className="field">
              <label>Company name</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="form-cols">
              <div className="field">
                <label>First name</label>
                <input type="text" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </div>
              <div className="field">
                <label>Last name</label>
                <input type="text" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
              </div>
            </div>
          )}

          <div className="field">
            <label>Mobile</label>
            <input type="text" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="field">
            <label>Address</label>
            <textarea value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save Changes' : 'Add Owner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
