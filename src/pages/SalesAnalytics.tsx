import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { monthlySales, weeklyData, regionalData } from '../data/mockData'
import { Card, SectionHeader, FilterBar, Select, Btn, PageHeader, ProgressBar } from '../components/ui'
import { useTheme } from '../components/Layout'

const comparisonData = monthlySales.map(m => ({
  month: m.month,
  'This Year': m.revenue,
  'Last Year': Math.round(m.revenue * 0.82),
}))

export default function SalesAnalytics() {
  const { dark } = useTheme()
  const ax = dark ? '#475569' : '#94a3b8'
  const grid = dark ? '#1e293b' : '#f1f5f9'

  const fmt = (v: number) => `$${(v / 1000).toFixed(0)}K`

  const TT = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ fontWeight: 600, margin: '0 0 6px', color: dark ? '#f8fafc' : '#0f172a' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ margin: '2px 0', color: p.color }}>{p.dataKey}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}</p>
        ))}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Sales Analytics"
        subtitle="Deep-dive into sales performance, trends, and regional breakdown"
        actions={<><Btn variant="outline">↓ Export CSV</Btn><Btn variant="outline">↓ Export PDF</Btn></>}
      />

      <FilterBar>
        <Select label="Date Range" options={['Last 7 days', 'Last 30 days', 'Last 90 days', 'This Year']} />
        <Select label="Category" options={['Electronics', 'Sports', 'Beauty', 'Home & Garden']} />
        <Select label="Region" options={['All Regions', 'Northeast', 'West Coast', 'Southeast']} />
        <Select label="Sales Rep" options={['All Reps', 'Patricia Chen', 'Marcus Williams']} />
        <Btn>Apply Filters</Btn>
        <Btn variant="ghost" style={{ color: '#94a3b8', fontSize: 13 }}>Reset</Btn>
      </FilterBar>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Total Sales', v: '$312,480', d: '↑ 18.4%', c: '#22c55e' },
          { l: 'Avg. Order Value', v: '$114.83', d: '↑ 3.2%', c: '#22c55e' },
          { l: 'Conversion Rate', v: '3.84%', d: '↓ 0.2%', c: '#ef4444' },
          { l: 'Refund Rate', v: '1.2%', d: '↓ 0.4%', c: '#22c55e' },
        ].map(k => (
          <Card key={k.l} style={{ padding: 18 }}>
            <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{k.l}</p>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: dark ? '#f8fafc' : '#0f172a' }}>{k.v}</p>
            <p style={{ fontSize: 12, margin: '4px 0 0', color: k.c, fontWeight: 600 }}>{k.d} vs last period</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Daily/Weekly bar */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Daily Sales — This Week" subtitle="Revenue and orders by day" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barGap={6}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rev" tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Bar yAxisId="rev" dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Bar yAxisId="ord" dataKey="orders" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={40} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Year-over-year */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Revenue Comparison YoY" subtitle="2026 vs 2025" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={comparisonData}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: 12, color: ax }} />
              <Line dataKey="This Year" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line dataKey="Last Year" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Regional Sales */}
      <Card style={{ padding: 22 }}>
        <SectionHeader title="Regional Sales Performance" subtitle="Revenue by geography · Last 12 months" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {regionalData.map(r => {
            const maxRev = Math.max(...regionalData.map(x => x.revenue))
            return (
              <div key={r.region} style={{ padding: 16, borderRadius: 12, background: dark ? '#0f172a' : '#f8fafc', border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a', margin: 0 }}>{r.region}</p>
                    <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '2px 0 0' }}>{r.orders.toLocaleString()} orders</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.growth > 0 ? '#22c55e' : '#ef4444' }}>↑ {r.growth}%</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', margin: '0 0 8px' }}>${(r.revenue / 1000).toFixed(0)}K</p>
                <ProgressBar value={r.revenue} max={maxRev} color="#2563eb" />
              </div>
            )
          })}
        </div>

        {/* Pseudo-map */}
        <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: dark ? '#0f172a' : '#f8fafc', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: dark ? '#64748b' : '#94a3b8', marginBottom: 12, fontWeight: 500 }}>US Regional Heatmap — Revenue Intensity</div>
          <svg viewBox="0 0 600 360" style={{ width: '100%', maxHeight: 260, borderRadius: 8 }}>
            <rect width="600" height="360" fill={dark ? '#1e293b' : '#e2e8f0'} rx="8" />
            {/* Simplified US region blocks */}
            {[
              { x: 460, y: 60, w: 110, h: 140, label: 'West Coast', val: '$1.02M', opacity: 0.9 },
              { x: 340, y: 40, w: 110, h: 100, label: 'Mountain', val: '$241K', opacity: 0.35 },
              { x: 270, y: 130, w: 130, h: 100, label: 'Midwest', val: '$521K', opacity: 0.55 },
              { x: 370, y: 140, w: 80, h: 100, label: 'Southwest', val: '$389K', opacity: 0.45 },
              { x: 400, y: 40, w: 0, h: 0, label: '', val: '', opacity: 0 },
              { x: 90, y: 40, w: 170, h: 130, label: 'Northeast', val: '$842K', opacity: 0.8 },
              { x: 200, y: 160, w: 160, h: 120, label: 'Southeast', val: '$614K', opacity: 0.65 },
            ].filter(r => r.w > 0).map(r => (
              <g key={r.label}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="6" fill="#2563eb" opacity={r.opacity} />
                <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 8} textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="Inter">{r.label}</text>
                <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="10" fontFamily="Inter">{r.val}</text>
              </g>
            ))}
          </svg>
        </div>
      </Card>
    </div>
  )
}
