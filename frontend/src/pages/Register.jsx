import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, ROLES } from '../api/auth';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role_id: ROLES[3].id, // default to Sales Executive, least-privileged
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: field === 'role_id' ? Number(e.target.value) : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mm-auth-shell">
      <div className="mm-auth-side">
        <span className="mark">MarketMind AI</span>
        <div className="pitch">
          <h1>Open a new ledger.</h1>
          <p>Create an account to start tracking sales, stock, and customers.</p>
        </div>
        <span className="ledger-line">— new entry —</span>
      </div>

      <div className="mm-auth-form-wrap">
        <div className="mm-auth-card">
          <h2>Create account</h2>
          <p className="sub">A few details and you're in.</p>

          {error && <div className="mm-alert-banner">{error}</div>}
          {success && <div className="mm-success-banner">Account created — redirecting to sign in…</div>}

          <form onSubmit={handleSubmit}>
            <div className="mm-field">
              <label htmlFor="username">Username</label>
              <input id="username" value={form.username} onChange={update('username')} required />
            </div>
            <div className="mm-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={form.email} onChange={update('email')} required />
            </div>
            <div className="mm-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={update('password')}
                required
                minLength={8}
              />
            </div>
            <div className="mm-field">
              <label htmlFor="role_id">Role</label>
              <select id="role_id" value={form.role_id} onChange={update('role_id')}>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="mm-btn" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="mm-auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
