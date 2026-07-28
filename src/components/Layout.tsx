import { useState, createContext, useContext, type ReactNode } from "react"
import { NavLink, useLocation } from 'react-router-dom'

// ─── Theme Context ────────────────────────────────────────────────────────────
interface ThemeCtx { dark: boolean; toggle: () => void }
const ThemeContext = createContext<ThemeCtx>({ dark: false, toggle: () => {} })
export const useTheme = () => useContext(ThemeContext)

// ─── Icons (inline SVG helpers) ──────────────────────────────────────────────
const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const icons: Record<string, string> = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  chart: 'M18 20V10M12 20V4M6 20v-6',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  brain: 'M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12A10 10 0 0 1 12 2zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  report: 'M9 17H7a2 2 0 0 0-2 2v2h10v-2a2 2 0 0 0-2-2h-2zM12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9zM12 7v5l3 3',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  search: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  sun: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 1 0 0 14A7 7 0 0 0 12 5z',
  menu: 'M3 12h18M3 6h18M3 18h18',
  chevronRight: 'M9 18l6-6-6-6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  invoice: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
}

const navItems = [
  { label: 'Executive Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Sales Analytics', path: '/sales', icon: 'chart' },
  { label: 'Customer Intelligence', path: '/customers', icon: 'users' },
  { label: 'AI Forecasting', path: '/forecasting', icon: 'brain' },
  { label: 'Inventory', path: '/inventory', icon: 'box' },
  { label: 'Product Recommendations', path: '/recommendations', icon: 'star' },
  { label: 'Anomaly Detection', path: '/anomalies', icon: 'alert' },
  { label: 'Invoices', path: '/invoices', icon: 'invoice' },
  { label: 'Reports', path: '/reports', icon: 'report' },
  { label: 'User Management', path: '/users', icon: 'users' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
]

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Executive Dashboard',
  sales: 'Sales Analytics',
  customers: 'Customer Intelligence',
  forecasting: 'AI Forecasting',
  inventory: 'Inventory Management',
  recommendations: 'Product Recommendations',
  anomalies: 'Anomaly Detection',
  invoices: 'Invoices & Transactions',
  reports: 'Reports & Analytics',
  users: 'User Management',
  settings: 'Settings',
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, dark }: { collapsed: boolean; onToggle: () => void; dark: boolean }) {
  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minHeight: '100vh',
        background: dark ? '#0f172a' : '#ffffff',
        borderRight: dark ? '1px solid #1e293b' : '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 10, minHeight: 64, borderBottom: dark ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>MarketMind AI</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>Sales Intelligence</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            style={{ marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <span style={{ flexShrink: 0 }}><Icon d={icons[item.icon]} size={17} /></span>
            {!collapsed && <span style={{ fontSize: 13 }}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: dark ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
        <div className="sidebar-link" style={{ justifyContent: collapsed ? 'center' : 'flex-start', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <span style={{ flexShrink: 0 }}><Icon d={icons.logout} size={17} /></span>
          {!collapsed && <span style={{ fontSize: 13 }}>Sign out</span>}
        </div>
      </div>
    </aside>
  )
}

// ─── Top Nav ─────────────────────────────────────────────────────────────────
function TopNav({ sidebarCollapsed, onMenuToggle, dark, onDarkToggle }: {
  sidebarCollapsed: boolean
  onMenuToggle: () => void
  dark: boolean
  onDarkToggle: () => void
}) {
  const location = useLocation()
  const segment = location.pathname.replace('/', '') || 'dashboard'
  const pageLabel = breadcrumbLabels[segment] || 'Dashboard'
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header style={{
      position: 'fixed', top: 0, right: 0,
      left: sidebarCollapsed ? 64 : 240,
      height: 64,
      background: dark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: dark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 40,
      transition: 'left 0.25s ease',
    }}>
      {/* Left: hamburger + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onMenuToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#94a3b8' : '#64748b', padding: 4, borderRadius: 6 }}>
          <Icon d={icons.menu} size={20} />
        </button>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ color: dark ? '#64748b' : '#94a3b8' }}>MarketMind AI</span>
          <Icon d={icons.chevronRight} size={14} />
          <span style={{ color: dark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>{pageLabel}</span>
        </nav>
      </div>

      {/* Right: search, notifs, dark toggle, avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 10, color: dark ? '#64748b' : '#94a3b8' }}><Icon d={icons.search} size={15} /></div>
          <input
            placeholder="Search..."
            style={{
              paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: 8,
              border: dark ? '1px solid #334155' : '1px solid #e2e8f0',
              background: dark ? '#1e293b' : '#f8fafc',
              color: dark ? '#f8fafc' : '#0f172a',
              fontSize: 13, outline: 'none', width: 200,
            }}
          />
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen(!notifOpen)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#94a3b8' : '#64748b', padding: 6, borderRadius: 8 }}>
            <Icon d={icons.bell} size={18} />
            <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: dark ? '2px solid #0f172a' : '2px solid #fff' }} />
          </button>
          {notifOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 8,
              width: 300, borderRadius: 12, padding: 12,
              background: dark ? '#1e293b' : '#fff',
              border: dark ? '1px solid #334155' : '1px solid #e2e8f0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              zIndex: 100,
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: dark ? '#f8fafc' : '#0f172a' }}>Notifications</div>
              {['Anomaly detected in Electronics sales', 'New forecast report ready', 'Low stock alert: Smart Hub Pro'].map((n, i) => (
                <div key={i} style={{ fontSize: 12, color: dark ? '#94a3b8' : '#64748b', padding: '8px 0', borderBottom: i < 2 ? (dark ? '1px solid #334155' : '1px solid #f1f5f9') : 'none' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', display: 'inline-block', marginRight: 8 }} />
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dark toggle */}
        <button onClick={onDarkToggle} style={{ background: dark ? '#1e293b' : '#f1f5f9', border: 'none', cursor: 'pointer', color: dark ? '#f59e0b' : '#64748b', padding: 6, borderRadius: 8 }}>
          <Icon d={dark ? icons.sun : icons.moon} size={18} />
        </button>

        {/* Avatar */}
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
          PC
        </div>
      </div>
    </header>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function Layout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark) }}>
      <div style={{ minHeight: '100vh', background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f8fafc' : '#0f172a' }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} dark={dark} />
        <TopNav sidebarCollapsed={collapsed} onMenuToggle={() => setCollapsed(!collapsed)} dark={dark} onDarkToggle={() => setDark(!dark)} />
        <main style={{
          marginLeft: collapsed ? 64 : 240,
          marginTop: 64,
          padding: '28px 28px',
          minHeight: 'calc(100vh - 64px)',
          transition: 'margin-left 0.25s ease',
        }}>
          {children}
        </main>
      </div>
    </ThemeContext.Provider>
  )
}
