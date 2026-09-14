import { useEffect, useState } from 'react';
import { login, logout, fetchMe, fetchProperties, fetchOwners, fetchUsers, deleteUser, type Me } from './api.js';
import type { AppUser, Owner, Property } from './types.js';
import PipelineBoard from './components/PipelineBoard.js';
import OwnersList from './components/OwnersList.js';
import OwnerDetail from './components/OwnerDetail.js';
import PropertyDetail from './components/PropertyDetail.js';
import UsersList from './components/UsersList.js';
import AddPropertyModal from './components/AddPropertyModal.js';
import AddOwnerModal from './components/AddOwnerModal.js';
import AddUserModal from './components/AddUserModal.js';
import ResetPasswordModal from './components/ResetPasswordModal.js';
import { ownerDisplayName } from './lib/format.js';
import { CREATABLE_ROLES } from './constants.js';

type AuthStatus = 'checking' | 'signed-out' | 'signed-in';
type View = 'board' | 'owners' | 'users' | 'property';
type Modal = 'add-property' | 'add-owner' | 'add-user' | 'edit-property' | 'edit-owner' | 'reset-password' | null;

export default function App() {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetchMe()
      .then((result) => {
        setMe(result);
        setStatus('signed-in');
      })
      .catch(() => setStatus('signed-out'));
  }, []);

  if (status === 'checking') {
    return (
      <div className="login-screen">
        <p style={{ color: 'var(--ink-soft)' }}>Checking session…</p>
      </div>
    );
  }

  if (status === 'signed-out') {
    return (
      <LoginScreen
        onSignedIn={async () => {
          const result = await fetchMe();
          setMe(result);
          setStatus('signed-in');
        }}
      />
    );
  }

  return (
    <Workspace
      me={me!}
      onSignOut={async () => {
        await logout();
        setMe(null);
        setStatus('signed-out');
      }}
    />
  );
}

function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('steve@upkeep.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 18 }}>
          <span className="brand-mark">U</span>
          <div>
            <div className="brand-name">Upkeep</div>
            <div className="brand-sub">Property pipeline</div>
          </div>
        </div>
        <form onSubmit={handleLogin}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="modal-error">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

      </div>
    </div>
  );
}

function Workspace({ me, onSignOut }: { me: Me; onSignOut: () => void }) {
  const [view, setView] = useState<View>('board');
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [returnView, setReturnView] = useState<View>('board');
  const [modal, setModal] = useState<Modal>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [resetPasswordUser, setResetPasswordUser] = useState<AppUser | null>(null);
  const creatableRoles = CREATABLE_ROLES[me.role] ?? [];
  const canManageUsers = creatableRoles.length > 0;

  async function refresh() {
    const [p, o] = await Promise.all([fetchProperties(), fetchOwners()]);
    setProperties(p);
    setOwners(o);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (canManageUsers) fetchUsers().then(setUsers);
  }, [canManageUsers]);

  async function handleRemoveUser(id: string) {
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  const ownerById = new Map(owners.map((o) => [o.id, o]));
  const selectedProperty = selectedPropertyId ? properties.find((p) => p.id === selectedPropertyId) ?? null : null;
  const selectedOwner = selectedOwnerId ? ownerById.get(selectedOwnerId) ?? null : null;

  function openProperty(id: string) {
    setReturnView(view);
    setSelectedPropertyId(id);
    setView('property');
  }

  function openOwner(id: string) {
    setSelectedOwnerId(id);
  }

  function handlePropertyUpdated(updated: Property) {
    setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleOwnerUpdated(updated: Owner) {
    setOwners((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <span className="brand-mark">U</span>
          <div>
            <div className="brand-name">Upkeep</div>
            <div className="brand-sub">Property pipeline</div>
          </div>
        </div>

        <div className="rail-section">
          <div className="rail-label">Workspace</div>
          <div className="filter-list">
            <button
              className={`filter-item${view === 'board' ? ' active' : ''}`}
              onClick={() => {
                setView('board');
                setSelectedPropertyId(null);
                setSelectedOwnerId(null);
              }}
            >
              Pipeline board
              <span className="count">{properties.length}</span>
            </button>
            <button
              className={`filter-item${view === 'owners' ? ' active' : ''}`}
              onClick={() => {
                setView('owners');
                setSelectedPropertyId(null);
                setSelectedOwnerId(null);
              }}
            >
              Owners
              <span className="count">{owners.length}</span>
            </button>
            {canManageUsers && (
              <button
                className={`filter-item${view === 'users' ? ' active' : ''}`}
                onClick={() => {
                  setView('users');
                  setSelectedPropertyId(null);
                  setSelectedOwnerId(null);
                }}
              >
                Users
                <span className="count">{users.length}</span>
              </button>
            )}
          </div>
        </div>

        <div className="rail-footer">
          <div className="prototype-tag" style={{ fontSize: 11.5 }}>
            Signed in as
            <br />
            <strong>{me.email}</strong>
          </div>
          <button className="reset-btn" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="stage">
        <div className="topbar">
          <div>
            <h1>
              {view === 'property' && selectedProperty
                ? selectedProperty.name
                : view === 'owners'
                  ? selectedOwner
                    ? ownerDisplayName(selectedOwner)
                    : 'Owners'
                  : view === 'users'
                    ? 'Users'
                    : 'Pipeline board'}
            </h1>
            <div className="sub">
              {view === 'board' && 'Track every lead from first contact to lease.'}
              {view === 'owners' && (selectedOwner ? 'Owner detail' : 'Landlords, agents, and companies you work with.')}
              {view === 'users' && 'Who can sign in to Upkeep.'}
              {view === 'property' && 'Property detail'}
            </div>
          </div>
          {view === 'users' ? (
            <div className="topbar-actions">
              <button className="btn btn-primary" onClick={() => setModal('add-user')}>
                + Add User
              </button>
            </div>
          ) : (
            view !== 'property' &&
            !selectedOwner && (
              <div className="topbar-actions">
                <button className="btn" onClick={() => setModal('add-owner')}>
                  + Add Owner
                </button>
                <button className="btn btn-primary" onClick={() => setModal('add-property')}>
                  + Add Property
                </button>
              </div>
            )
          )}
        </div>

        <div className="content">
          {loading ? (
            <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>
          ) : view === 'board' ? (
            <PipelineBoard properties={properties} owners={owners} onOpenProperty={openProperty} />
          ) : view === 'owners' ? (
            selectedOwner ? (
              <OwnerDetail
                owner={selectedOwner}
                properties={properties.filter((p) => p.ownerId === selectedOwner.id)}
                onBack={() => setSelectedOwnerId(null)}
                onOpenProperty={openProperty}
                onEdit={() => setModal('edit-owner')}
              />
            ) : (
              <OwnersList owners={owners} properties={properties} onOpenOwner={openOwner} />
            )
          ) : view === 'users' ? (
            <UsersList
              users={users}
              currentEmail={me.email}
              onRemove={handleRemoveUser}
              onResetPassword={(user) => {
                setResetPasswordUser(user);
                setModal('reset-password');
              }}
            />
          ) : selectedProperty ? (
            <PropertyDetail
              property={selectedProperty}
              owner={selectedProperty.ownerId ? ownerById.get(selectedProperty.ownerId) : null}
              onBack={() => {
                setView(returnView);
                setSelectedPropertyId(null);
              }}
              backLabel={returnView === 'owners' ? 'Back to owner' : 'Back to pipeline'}
              onStatusChanged={handlePropertyUpdated}
              onEdit={() => setModal('edit-property')}
            />
          ) : (
            <p style={{ color: 'var(--ink-soft)' }}>Property not found.</p>
          )}
        </div>
      </div>

      {modal === 'add-property' && (
        <AddPropertyModal
          owners={owners}
          onClose={() => setModal(null)}
          onOwnerCreated={(owner) => setOwners((prev) => [owner, ...prev])}
          onCreated={(property) => {
            setProperties((prev) => [property, ...prev]);
            setModal(null);
          }}
        />
      )}
      {modal === 'add-owner' && (
        <AddOwnerModal
          onClose={() => setModal(null)}
          onCreated={(owner) => {
            setOwners((prev) => [owner, ...prev]);
            setModal(null);
          }}
        />
      )}
      {modal === 'edit-property' && selectedProperty && (
        <AddPropertyModal
          owners={owners}
          property={selectedProperty}
          onClose={() => setModal(null)}
          onOwnerCreated={(owner) => setOwners((prev) => [owner, ...prev])}
          onUpdated={(updated) => {
            handlePropertyUpdated(updated);
            setModal(null);
          }}
        />
      )}
      {modal === 'edit-owner' && selectedOwner && (
        <AddOwnerModal
          owner={selectedOwner}
          onClose={() => setModal(null)}
          onUpdated={(updated) => {
            handleOwnerUpdated(updated);
            setModal(null);
          }}
        />
      )}
      {modal === 'add-user' && (
        <AddUserModal
          creatableRoles={creatableRoles}
          onClose={() => setModal(null)}
          onCreated={(user) => setUsers((prev) => [user, ...prev])}
        />
      )}
      {modal === 'reset-password' && resetPasswordUser && (
        <ResetPasswordModal
          user={resetPasswordUser}
          onClose={() => {
            setModal(null);
            setResetPasswordUser(null);
          }}
        />
      )}
    </div>
  );
}
