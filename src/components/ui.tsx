import type { ReactNode, CSSProperties } from 'react'
import { useTheme } from './Layout'

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, className = '' }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  const { dark } = useTheme()
  return (
    <div
      className={className}
      style={{
        background: dark ? '#1e293b' : '#ffffff',
        borderRadius: 16,
        border: dark ? '1px solid #334155' : '1px solid #e2e8f0',
        boxShadow: dark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export function KpiCard({
  label, value, delta, deltaDir, icon, color, subtext
}: {
  label: string; value: string; delta: string; deltaDir: 'up' | 'down'
  icon: ReactNode; color: string; subtext?: string
}) {
  const { dark } = useTheme()
  const deltaColor = deltaDir === 'up' ? '#22c55e' : '#ef4444'
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: dark ? '#64748b' : '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', margin: 0, lineHeight: 1.2 }}>{value}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: deltaColor }}>
              {deltaDir === 'up' ? '↑' : '↓'} {delta}
            </span>
            {subtext && <span style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{subtext}</span>}
          </div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const { dark } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: dark ? '#64748b' : '#94a3b8', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgeStyles: Record<string, { bg: string; color: string }> = {
  completed: { bg: '#dcfce7', color: '#16a34a' },
  paid: { bg: '#dcfce7', color: '#16a34a' },
  active: { bg: '#dcfce7', color: '#16a34a' },
  ok: { bg: '#dcfce7', color: '#16a34a' },
  pending: { bg: '#fef9c3', color: '#ca8a04' },
  low: { bg: '#fef9c3', color: '#ca8a04' },
  inactive: { bg: '#f1f5f9', color: '#64748b' },
  refunded: { bg: '#e0f2fe', color: '#0369a1' },
  overdue: { bg: '#fee2e2', color: '#dc2626' },
  failed: { bg: '#fee2e2', color: '#dc2626' },
  critical: { bg: '#fee2e2', color: '#dc2626' },
  out: { bg: '#fee2e2', color: '#dc2626' },
  high: { bg: '#ffedd5', color: '#c2410c' },
  medium: { bg: '#fef9c3', color: '#ca8a04' },
  info: { bg: '#dbeafe', color: '#1d4ed8' },
  draft: { bg: '#f1f5f9', color: '#64748b' },
  'cross-sell': { bg: '#ede9fe', color: '#6d28d9' },
  upsell: { bg: '#dbeafe', color: '#1d4ed8' },
  'frequently-bought': { bg: '#dcfce7', color: '#16a34a' },
}

export function Badge({ status }: { status: string }) {
  const s = badgeStyles[status] ?? { bg: '#f1f5f9', color: '#64748b' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', onClick, style }: { children: ReactNode; variant?: 'primary' | 'outline' | 'ghost'; onClick?: () => void; style?: CSSProperties }) {
  const { dark } = useTheme()
  const base: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', ...style }
  if (variant === 'primary') return <button onClick={onClick} style={{ ...base, background: '#2563eb', color: '#fff' }}>{children}</button>
  if (variant === 'outline') return <button onClick={onClick} style={{ ...base, background: 'transparent', color: dark ? '#94a3b8' : '#475569', border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }}>{children}</button>
  return <button onClick={onClick} style={{ ...base, background: 'transparent', color: dark ? '#94a3b8' : '#475569' }}>{children}</button>
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = '#2563eb', height = 6 }: { value: number; max?: number; color?: string; height?: number }) {
  const { dark } = useTheme()
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ height, borderRadius: 99, background: dark ? '#334155' : '#e2e8f0', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width 0.4s ease' }} />
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 16, style }: { width?: string | number; height?: number; style?: CSSProperties }) {
  return <div className="skeleton" style={{ width, height, ...style }} />
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  const { dark } = useTheme()
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f1f5f9' }}>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: dark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const { dark } = useTheme()
  return (
    <tr
      onClick={onClick}
      style={{ borderBottom: dark ? '1px solid #1e293b' : '1px solid #f8fafc', cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = dark ? '#0f172a' : '#f8fafc' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </tr>
  )
}

export function Td({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const { dark } = useTheme()
  return <td style={{ padding: '12px 16px', color: dark ? '#e2e8f0' : '#334155', ...style }}>{children}</td>
}

// ─── AI Insight Widget ────────────────────────────────────────────────────────
export function AIInsight({ title, body, type = 'info' }: { title: string; body: string; type?: 'info' | 'warning' | 'success' }) {
  const colors = { info: '#2563eb', warning: '#f59e0b', success: '#22c55e' }
  const bgs = { info: '#eff6ff', warning: '#fffbeb', success: '#f0fdf4' }
  const { dark } = useTheme()
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 10, background: dark ? `${colors[type]}15` : bgs[type], border: `1px solid ${colors[type]}30`, marginBottom: 8 }}>
      <div style={{ width: 6, borderRadius: 3, background: colors[type], flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: colors[type], margin: '0 0 2px' }}>✦ {title}</p>
        <p style={{ fontSize: 12, color: dark ? '#94a3b8' : '#475569', margin: 0, lineHeight: 1.5 }}>{body}</p>
      </div>
    </div>
  )
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
export function FilterBar({ children }: { children: ReactNode }) {
  const { dark } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
      {children}
    </div>
  )
}

export function Select({ label, options }: { label: string; options: string[] }) {
  const { dark } = useTheme()
  return (
    <select style={{ padding: '6px 12px', borderRadius: 8, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f8fafc' : '#334155', fontSize: 13, fontFamily: 'Inter, sans-serif', cursor: 'pointer', outline: 'none' }}>
      <option>{label}</option>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  )
}

// ─── Page Header ─────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  const { dark } = useTheme()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: dark ? '#64748b' : '#94a3b8', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  )
}

// ─── Gauge ────────────────────────────────────────────────────────────────────
export function Gauge({ value, label, color = '#22c55e' }: { value: number; label: string; color?: string }) {
  const { dark } = useTheme()
  const r = 54
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const dash = (value / 100) * arc
  const rotation = 135

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={140} height={100} viewBox="0 0 140 100">
        <circle cx="70" cy="70" r={r} fill="none" stroke={dark ? '#334155' : '#e2e8f0'} strokeWidth="10"
          strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={0}
          strokeLinecap="round" transform={`rotate(${rotation} 70 70)`} />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={0}
          strokeLinecap="round" transform={`rotate(${rotation} 70 70)`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill={dark ? '#f8fafc' : '#0f172a'} fontFamily="Inter">{value}%</text>
        <text x="70" y="84" textAnchor="middle" fontSize="11" fill={dark ? '#64748b' : '#94a3b8'} fontFamily="Inter">{label}</text>
      </svg>
    </div>
  )
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────
export function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  const { dark } = useTheme()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: dark ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 13, color: dark ? '#94a3b8' : '#64748b' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color ?? (dark ? '#f8fafc' : '#0f172a') }}>{value}</span>
    </div>
  )
}
