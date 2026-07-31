import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardRouteForRole, roleName } from '../api/auth';

const NAV_ITEMS = [
  { to: null, label: 'Dashboard', dynamic: true },
  { to: '/inventory', label: 'Inventory', minRole: 3 }, // roles 1,2,3
  { to: '/users', label: 'Users', minRole: 1 }, // role 1 only
  { to: '/predict', label: 'Sales Forecast' },
  { to: '/profile', label: 'Profile & Settings' },
];

export default function AppLayout({ eyebrow, title, subtitle, children }) {
  const { username, roleId, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const dashboardHome = dashboardRouteForRole(roleId);
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.minRole) return true;
    return Number(roleId) <= item.minRole; // lower role_id = more access
  });

  return (
    <div className="mm-shell">
      <aside className="mm-sidebar">
        <div className="mm-brand-mark">
          <span className="mark">MarketMind</span>
          <span className="tag">AI</span>
        </div>

        <nav className="mm-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.dynamic ? dashboardHome : item.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
              end
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mm-sidebar-footer">
          <div className="mm-user-chip">
            <span className="name">{username || 'Signed in'}</span>
            <span className="role">{roleId ? roleName(roleId) : 'user'}</span>
          </div>
          <button className="mm-logout-btn" onClick={handleLogout} type="button">
            Log out
          </button>
        </div>
      </aside>

      <main className="mm-main">
        {(eyebrow || title) && (
          <div className="mm-page-header">
            <div>
              {eyebrow && <span className="mm-eyebrow">{eyebrow}</span>}
              {title && <h1 className="mm-page-title">{title}</h1>}
              {subtitle && <p className="mm-page-sub">{subtitle}</p>}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
