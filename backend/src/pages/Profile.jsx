import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { getProfile } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { roleName } from '../api/auth';

function labelize(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Profile() {
  const { username, roleId } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getProfile()
      .then((user) => {
        setProfileUser(user);
        setError('');
      })
      .catch(() => setError('Could not load your profile from the backend.'))
      .finally(() => setLoading(false));
  }, []);

  // GET /profile just verifies the JWT and echoes back whatever
  // get_current_user returns — its exact shape isn't confirmed, so this
  // renders every scalar field it finds rather than assuming names.
  const entries = profileUser
    ? Object.entries(profileUser).filter(([, v]) => typeof v !== 'object')
    : [];

  return (
    <AppLayout eyebrow="Account" title="Profile & settings" subtitle="Your account details.">
      {error && <div className="mm-alert-banner">{error}</div>}

      <div className="mm-panel" style={{ maxWidth: 480 }}>
        <div className="mm-panel-title">Account details</div>
        <div className="mm-panel-sub">From GET /profile (token verification payload)</div>

        {loading ? (
          <p className="mm-loading-tag">Loading profile…</p>
        ) : (
          <table className="mm-table">
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Username</td>
                <td>{username || '—'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Role</td>
                <td>{roleId ? roleName(roleId) : '—'}</td>
              </tr>
              {entries.map(([key, value]) => (
                <tr key={key}>
                  <td style={{ fontWeight: 600 }}>{labelize(key)}</td>
                  <td>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
