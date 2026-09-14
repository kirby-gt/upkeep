import type { AppUser } from '../types.js';
import { USER_ROLES } from '../constants.js';
import { formatDate } from '../lib/format.js';

export default function UsersList({
  users,
  currentEmail,
  onRemove,
  onResetPassword,
}: {
  users: AppUser[];
  currentEmail: string;
  onRemove: (id: string) => void;
  onResetPassword: (user: AppUser) => void;
}) {
  if (users.length === 0) {
    return (
      <div className="empty-note">
        No users yet. Click <strong>+ Add User</strong> to create the first login.
      </div>
    );
  }

  return (
    <div className="queue-list" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
      {users.map((user) => {
        const isSelf = user.email === currentEmail;
        return (
          <div className="owner-card" key={user.id} style={{ cursor: 'default' }}>
            <div>
              <div className="oc-name">
                {user.email}
                {isSelf && (
                  <span className="tag" style={{ marginLeft: 8 }}>
                    You
                  </span>
                )}
              </div>
              <div className="oc-meta">
                {USER_ROLES[user.role] ?? user.role} · Added {formatDate(user.createdAt)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn btn-sm" onClick={() => onResetPassword(user)}>
                Reset Password
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => onRemove(user.id)}
                disabled={isSelf}
                title={isSelf ? "You can't remove your own account." : 'Remove this user'}
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
