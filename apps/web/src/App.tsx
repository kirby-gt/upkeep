import { useEffect, useState } from 'react';
import { login, logout, fetchMe, type Me } from './api.js';

type Status = 'checking' | 'signed-out' | 'signed-in';

export default function App() {
  const [status, setStatus] = useState<Status>('checking');
  const [me, setMe] = useState<Me | null>(null);
  const [email, setEmail] = useState('steve@upkeep.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const result = await fetchMe();
      setMe(result);
      setStatus('signed-in');
    } catch {
      setStatus('signed-out');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  async function handleLogout() {
    await logout();
    setMe(null);
    setStatus('signed-out');
  }

  if (status === 'checking') {
    return <Shell>Checking session…</Shell>;
  }

  if (status === 'signed-out') {
    return (
      <Shell>
        <h1 style={{ marginBottom: 4 }}>Upkeep</h1>
        <p style={{ color: '#5b6b78', marginTop: 0 }}>Sign in to continue.</p>
        <form onSubmit={handleLogin} style={{ display: 'grid', gap: 10, maxWidth: 320 }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
          {error && <p style={{ color: '#b5342a', margin: 0 }}>{error}</p>}
          <button type="submit" style={buttonStyle}>
            Sign in
          </button>
        </form>
        <p style={{ color: '#8593a0', fontSize: 13, marginTop: 18 }}>
          Seeded login: <code>steve@upkeep.local</code> / <code>upkeep-dev</code> (or whatever
          you set with <code>SEED_PM_EMAIL</code> / <code>SEED_PM_PASSWORD</code>).
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 style={{ marginBottom: 4 }}>Upkeep</h1>
      <p style={{ color: '#2f7a5e', fontWeight: 600, marginTop: 0 }}>● Connected</p>
      <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '4px 12px', fontSize: 14 }}>
        <dt style={{ color: '#5b6b78' }}>Signed in as</dt>
        <dd style={{ margin: 0 }}>{me?.email}</dd>
        <dt style={{ color: '#5b6b78' }}>Role</dt>
        <dd style={{ margin: 0 }}>{me?.role}</dd>
        <dt style={{ color: '#5b6b78' }}>Database server time</dt>
        <dd style={{ margin: 0 }}>{me?.serverTime}</dd>
      </dl>
      <p style={{ color: '#8593a0', fontSize: 13 }}>
        That timestamp comes from a real <code>select now()</code> against Postgres — this
        page never renders it from a hardcoded string.
      </p>
      <button onClick={handleLogout} style={{ ...buttonStyle, marginTop: 10 }}>
        Sign out
      </button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: 480,
        margin: '80px auto',
        padding: '0 20px',
        color: '#14202b',
      }}
    >
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  marginTop: 4,
  border: '1px solid #d3dbd8',
  borderRadius: 6,
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  padding: '9px 16px',
  background: '#14202b',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  cursor: 'pointer',
};
