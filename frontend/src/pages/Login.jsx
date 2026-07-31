import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardRouteForRole } from '../api/auth';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn(email, password);
      navigate(dashboardRouteForRole(result.roleId));
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Could not sign in. Check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mm-auth-shell">
      <div className="mm-auth-side">
        <span className="mark">MarketMind AI</span>
        <div className="pitch">
          <h1>The ledger that reads itself.</h1>
          <p>
            Sales, stock, and customers in one place — with forecasts that tell you
            what's coming before it shows up in the numbers.
          </p>
        </div>
        <span className="ledger-line">— entry logged, welcome back —</span>
      </div>

      <div className="mm-auth-form-wrap">
        <div className="mm-auth-card">
          <div className="mm-brand">
            <h1>📊 MarketMindAI</h1>
            <p>AI-Powered Sales & Inventory Management System</p>
        </div>
          <h2>Sign in</h2>
          <p className="sub">Enter your credentials to reach your dashboard.</p>

          {error && <div className="mm-alert-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mm-field">
              <label htmlFor="email">📧 Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="mm-field">
              <label htmlFor="password">🔒 Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="mm-btn" type="submit" disabled={loading}>
              {loading ? '⏳ Signing In...' : '🚀 Sign In'}
            </button>
          </form>

          <div className="mm-auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
