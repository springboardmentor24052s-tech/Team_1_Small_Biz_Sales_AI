import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { listUsers, updateUserStatus, updateUserRole, deleteUser } from '../api/users';
import { ROLES } from '../api/auth';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    listUsers()
      .then((data) => {
        setUsers(data);
        setError('');
      })
      .catch(() => setError('Could not load users from the backend.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleStatus = async (user) => {
    setBusyId(user.id);
    setError('');
    try {
      const next = !user.is_active;
      await updateUserStatus(user.id, next);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: next } : u)));
    } catch {
      setError("Could not update that user's status.");
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (user, newRoleId) => {
    setBusyId(user.id);
    setError('');
    try {
      await updateUserRole(user.id, newRoleId);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role_id: newRoleId } : u)));
    } catch {
      setError("Could not update that user's role.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user) => {
    setBusyId(user.id);
    setError('');
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      setError('Could not delete that user.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppLayout eyebrow="Access" title="Users" subtitle="Manage accounts, roles, and active status.">
      {error && <div className="mm-alert-banner">{error}</div>}

      <div className="mm-panel">
        <div className="mm-panel-title">All users</div>
        <div className="mm-panel-sub">
          From GET /users — Administrator only. Status/role changes call PUT
          /users/&#123;id&#125;/status and /role.
        </div>

        {loading ? (
          <p className="mm-loading-tag">Loading users…</p>
        ) : users.length === 0 ? (
          <div className="mm-empty-state">No users found.</div>
        ) : (
          <div className="mm-table-wrap">
            <table className="mm-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role_id}
                        onChange={(e) => changeRole(user, Number(e.target.value))}
                        disabled={busyId === user.id}
                        style={{ fontSize: 13, padding: '4px 6px' }}
                      >
                        {ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`mm-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="mm-btn secondary"
                        type="button"
                        onClick={() => toggleStatus(user)}
                        disabled={busyId === user.id}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="mm-btn danger"
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={busyId === user.id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
