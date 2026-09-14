import { useState } from 'react';
import type { AppUser, NewUserInput } from '../types.js';
import { createUser } from '../api.js';
import { USER_ROLES } from '../constants.js';

function generatePassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export default function AddUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (user: AppUser) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [role, setRole] = useState('pm');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<AppUser | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes('@')) return setError('A valid email is required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setSubmitting(true);
    try {
      const input: NewUserInput = { email: email.trim().toLowerCase(), password, role };
      const user = await createUser(input);
      setCreatedUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (createdUser) {
    return (
      <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <h2>User Added</h2>
          <p className="modal-sub">Share these credentials with them now — the password won&rsquo;t be shown again.</p>
          <div className="subfieldset">
            <div className="field">
              <label>Email</label>
              <input type="text" value={createdUser.email} readOnly />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="text" value={password} readOnly />
            </div>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onCreated(createdUser);
                onClose();
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Add User</h2>
        <p className="modal-sub">Create a login so someone can start using Upkeep.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {Object.entries(USER_ROLES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Temporary password</label>
            <div className="file-row">
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} style={{ flex: 1 }} required />
              <button type="button" className="btn btn-sm" onClick={() => setPassword(generatePassword())}>
                Generate
              </button>
            </div>
            <span className="field-hint">At least 8 characters. Share it with them directly — there&rsquo;s no email delivery yet.</span>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
