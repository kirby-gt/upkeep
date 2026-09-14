import { useState } from 'react';
import type { AppUser } from '../types.js';
import { resetUserPassword } from '../api.js';
import { generatePassword } from '../lib/password.js';

export default function ResetPasswordModal({
  user,
  onClose,
}: {
  user: AppUser;
  onClose: () => void;
}) {
  const [password, setPassword] = useState(generatePassword());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setSubmitting(true);
    try {
      await resetUserPassword(user.id, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <h2>Password Reset</h2>
          <p className="modal-sub">Share this with them now — it won&rsquo;t be shown again. They&rsquo;ve been signed out everywhere.</p>
          <div className="subfieldset">
            <div className="field">
              <label>Email</label>
              <input type="text" value={user.email} readOnly />
            </div>
            <div className="field">
              <label>New password</label>
              <input type="text" value={password} readOnly />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>
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
        <h2>Reset Password</h2>
        <p className="modal-sub">
          Set a new password for <strong>{user.email}</strong>. This immediately invalidates their current session.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>New password</label>
            <div className="file-row">
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} style={{ flex: 1 }} required />
              <button type="button" className="btn btn-sm" onClick={() => setPassword(generatePassword())}>
                Generate
              </button>
            </div>
            <span className="field-hint">At least 8 characters.</span>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
