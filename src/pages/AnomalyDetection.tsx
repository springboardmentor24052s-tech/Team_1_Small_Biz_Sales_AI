import { useState } from 'react'
// recharts imported for future chart additions
import { anomalies } from '../data/mockData'
import { Card, SectionHeader, Badge, AIInsight, PageHeader, Btn } from '../components/ui'
import { useTheme } from '../components/Layout'

const heatmapData = [
  { cat: 'Electronics', mon: 12, tue: 8, wed: 45, thu: 22, fri: 18, sat: 6, sun: 4 },
  { cat: 'Sports', mon: 4, tue: 6, wed: 8, thu: 52, fri: 28, sat: 12, sun: 8 },
  { cat: 'Beauty', mon: 8, tue: 4, wed: 6, thu: 8, fri: 14, sat: 38, sun: 22 },
  { cat: 'Home', mon: 6, tue: 8, wed: 4, thu: 6, fri: 8, sat: 18, sun: 6 },
  { cat: 'Apparel', mon: 10, tue: 12, wed: 8, thu: 10, fri: 32, sat: 44, sun: 18 },
]

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const alertTimeline = [
  { time: '10:24 AM', event: 'Fraud pattern detected — Electronics', severity: 'critical', status: 'open' },
  { time: '09:18 AM', event: 'Sales spike: Running Shoes +340%', severity: 'info', status: 'open' },
  { time: '08:45 AM', event: 'Stock depletion forecast: Smart Hub Pro', severity: 'high', status: 'investigating' },
  { time: '07:30 AM', event: 'Credential stuffing attempt blocked', severity: 'critical', status: 'resolved' },
  { time: 'Yesterday', event: 'Revenue dip: Beauty category -28%', severity: 'medium', status: 'resolved' },
  { time: 'Yesterday', event: 'Unusual bulk order: 4,200 units via API', severity: 'high', status: 'resolved' },
]

function RiskHeatmap() {
  const { dark } = useTheme()
  const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  const max = 55

  const getColor = (v: number) => {
    const pct = v / max
    if (pct < 0.15) return dark ? '#1e293b' : '#f1f5f9'
    if (pct < 0.35) return '#fef9c3'
    if (pct < 0.6) return '#fde68a'
    if (pct < 0.8) return '#fb923c'
    return '#ef4444'
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(7, 1fr)`, gap: 3, marginBottom: 6 }}>
        <div />
        {days.map(d => <div key={d} style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', textAlign: 'center', fontWeight: 500 }}>{d}</div>)}
      </div>
      {heatmapData.map(row => (
        <div key={row.cat} style={{ display: 'grid', gridTemplateColumns: `80px repeat(7, 1fr)`, gap: 3, marginBottom: 3 }}>
          <div style={{ fontSize: 12, color: dark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', fontWeight: 500 }}>{row.cat}</div>
          {keys.map(k => {
            const v = row[k] as number
            return (
              <div key={k} title={`Risk score: ${v}`} style={{ height: 32, borderRadius: 4, background: getColor(v), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: v > 35 ? '#fff' : '#64748b', cursor: 'default', transition: 'transform 0.1s' }}>
                {v}
              </div>
            )
          })}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8' }}>Risk Level:</span>
        {[['Low', '#f1f5f9'], ['Medium', '#fde68a'], ['High', '#fb923c'], ['Critical', '#ef4444']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnomalyDetection() {
  const { dark } = useTheme()
  const [selected, setSelected] = useState<string | null>(null)

  const sevColor: Record<string, string> = { critical: '#ef4444', high: '#fb923c', medium: '#f59e0b', info: '#2563eb' }
  const statusColor: Record<string, string> = { open: '#ef4444', investigating: '#f59e0b', resolved: '#22c55e' }

  return (
    <div>
      <PageHeader
        title="Anomaly Detection"
        subtitle="Real-time fraud alerts, unusual patterns, and risk intelligence"
        actions={<><Btn variant="outline">Configure Rules</Btn><Btn style={{ background: '#ef4444' }}>5 Active Alerts</Btn></>}
      />

      {/* Alert summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Active Alerts', v: '5', d: '↑ 2 today', c: '#ef4444' },
          { l: 'Fraud Attempts', v: '14', d: '↑ 8 today', c: '#ef4444' },
          { l: 'Anomalies Found', v: '38', d: 'this week', c: '#f59e0b' },
          { l: 'Risk Score', v: '68/100', d: '↑ 12pts', c: '#f59e0b' },
        ].map(k => (
          <Card key={k.l} style={{ padding: 18, borderLeft: `3px solid ${k.c}` }}>
            <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{k.l}</p>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: dark ? '#f8fafc' : '#0f172a' }}>{k.v}</p>
            <p style={{ fontSize: 12, margin: '4px 0 0', fontWeight: 600, color: k.c }}>{k.d}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Active Anomalies */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Active Anomalies" subtitle="Requires attention" action={
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>● LIVE</span>
          } />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {anomalies.map(a => (
              <div
                key={a.id}
                onClick={() => setSelected(selected === a.id ? null : a.id)}
                style={{
                  padding: 14, borderRadius: 10,
                  background: selected === a.id ? (dark ? '#1e293b' : '#eff6ff') : (dark ? '#0f172a' : '#f8fafc'),
                  border: `1px solid ${selected === a.id ? '#2563eb40' : (dark ? '#334155' : '#e2e8f0')}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sevColor[a.severity], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a' }}>{a.title}</span>
                  </div>
                  <Badge status={a.severity} />
                </div>
                <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 6px' }}>{a.desc}</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8' }}>🕐 {a.time}</span>
                  <span style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8' }}>📦 {a.product}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Alert Timeline */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Alert Timeline" subtitle="Last 48 hours" />
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: dark ? '#334155' : '#e2e8f0' }} />
            {alertTimeline.map((a, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 18 }}>
                <div style={{ position: 'absolute', left: -17, top: 3, width: 10, height: 10, borderRadius: '50%', background: sevColor[a.severity] ?? '#94a3b8', border: dark ? '2px solid #0f172a' : '2px solid #fff' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: dark ? '#f8fafc' : '#0f172a', margin: 0, flex: 1 }}>{a.event}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: `${statusColor[a.status]}20`, color: statusColor[a.status] }}>{a.status}</span>
                </div>
                <p style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', margin: '3px 0 0' }}>{a.time}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Risk Heatmap */}
      <Card style={{ padding: 22 }}>
        <SectionHeader title="Risk Heatmap" subtitle="Anomaly frequency by category and day of week" />
        <RiskHeatmap />
        <div style={{ marginTop: 20 }}>
          <AIInsight title="Pattern Identified" body="Electronics category shows peak risk on Wednesdays — consistent with known competitor price-scraping activity. Automated protection rules have been triggered." type="warning" />
          <AIInsight title="Fraud Prevention Active" body="ML fraud model blocked $84,200 in fraudulent transactions this week. Rule engine operating at 99.1% uptime." type="success" />
        </div>
      </Card>
    </div>
  )
}
