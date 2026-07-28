import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { monthlySales } from '../data/mockData'
import { Card, SectionHeader, PageHeader, Btn } from '../components/ui'
import { useTheme } from '../components/Layout'

const reportTemplates = [
  { id: 1, name: 'Executive Summary', desc: 'High-level KPIs, revenue performance, and strategic insights', icon: '📊', category: 'Executive', lastRun: '2 hours ago' },
  { id: 2, name: 'Sales Performance Report', desc: 'Detailed revenue breakdown, trends, and rep performance', icon: '📈', category: 'Sales', lastRun: '1 day ago' },
  { id: 3, name: 'Customer Analytics', desc: 'Segmentation, LTV, churn, and retention analysis', icon: '👥', category: 'Customer', lastRun: '3 hours ago' },
  { id: 4, name: 'Inventory Health Report', desc: 'Stock levels, turnover, and reorder recommendations', icon: '📦', category: 'Inventory', lastRun: '6 hours ago' },
  { id: 5, name: 'AI Forecast Report', desc: 'Demand predictions, confidence intervals, seasonal analysis', icon: '🤖', category: 'Forecast', lastRun: '12 hours ago' },
  { id: 6, name: 'Financial Summary', desc: 'P&L, cash flow, invoice aging, and payment analytics', icon: '💰', category: 'Finance', lastRun: '1 day ago' },
]

export default function Reports() {
  const { dark } = useTheme()
  const ax = dark ? '#475569' : '#94a3b8'
  const grid = dark ? '#1e293b' : '#f1f5f9'
  const [dateRange, setDateRange] = useState('Last 30 days')
  const [generating, setGenerating] = useState<number | null>(null)

  const handleGenerate = (id: number) => {
    setGenerating(id)
    setTimeout(() => setGenerating(null), 2000)
  }

  const TT = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ fontWeight: 600, margin: '0 0 6px', color: dark ? '#f8fafc' : '#0f172a' }}>{label}</p>
        {payload.map((p: any) => <p key={p.dataKey} style={{ margin: '2px 0', color: p.color }}>{p.name}: ${(p.value / 1000).toFixed(0)}K</p>)}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate, schedule, and download business intelligence reports"
        actions={<><Btn variant="outline">Schedule Report</Btn><Btn>+ Custom Report</Btn></>}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', padding: '14px 16px', background: dark ? '#1e293b' : '#fff', borderRadius: 12, border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: dark ? '#94a3b8' : '#475569' }}>Report Period:</span>
        {['Last 7 days', 'Last 30 days', 'Last Quarter', 'Last Year', 'Custom'].map(r => (
          <button key={r} onClick={() => setDateRange(r)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: dateRange === r ? '#2563eb' : (dark ? '#0f172a' : '#f1f5f9'), color: dateRange === r ? '#fff' : (dark ? '#94a3b8' : '#475569') }}>
            {r}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input type="date" defaultValue="2026-07-01" style={{ padding: '6px 12px', borderRadius: 8, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f8fafc' : '#0f172a', fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
        <span style={{ fontSize: 13, color: dark ? '#64748b' : '#94a3b8' }}>to</span>
        <input type="date" defaultValue="2026-07-24" style={{ padding: '6px 12px', borderRadius: 8, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f8fafc' : '#0f172a', fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
      </div>

      {/* Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {reportTemplates.map(r => (
          <Card key={r.id} style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{r.icon}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: dark ? '#f8fafc' : '#0f172a' }}>{r.name}</p>
                <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: 0, lineHeight: 1.4 }}>{r.desc}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>{r.category}</span>
              <span style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8' }}>Last run: {r.lastRun}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleGenerate(r.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: generating === r.id ? '#93c5fd' : '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                {generating === r.id ? 'Generating…' : 'Generate'}
              </button>
              <button style={{ padding: '7px 10px', borderRadius: 8, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: 'transparent', fontSize: 12, color: dark ? '#94a3b8' : '#64748b', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>PDF</button>
              <button style={{ padding: '7px 10px', borderRadius: 8, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: 'transparent', fontSize: 12, color: dark ? '#94a3b8' : '#64748b', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>CSV</button>
            </div>
          </Card>
        ))}
      </div>

      {/* Visualization Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Revenue Performance" subtitle="Monthly overview · 2026" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlySales.slice(0, 8)} barSize={22}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip content={<TT />} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} name="Revenue" />
              <Bar dataKey="profit" fill="#22c55e" radius={[6, 6, 0, 0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 22 }}>
          <SectionHeader title="Order Volume Trend" subtitle="Monthly orders YTD" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlySales.slice(0, 8)}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Line dataKey="orders" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3, fill: '#4f46e5' }} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card style={{ padding: 24 }}>
        <SectionHeader title="Executive Summary — July 2026" subtitle="Auto-generated · 2 hours ago" action={<Btn variant="outline" style={{ fontSize: 12, padding: '5px 12px' }}>↓ Download PDF</Btn>} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { title: 'Revenue Performance', items: ['Total Revenue: $312,480 (↑18.4% MoM)', 'Gross Profit: $98,200 (margin: 31.4%)', 'YTD Revenue: $2.67M (tracking +8% vs target)', 'Best category: Electronics at 34% share'] },
            { title: 'Customer Health', items: ['Active customers: 5,124 (↑31.2% YoY)', 'Avg. LTV: $2,840 (↑12.4%)', 'Churn risk: 18.3% of base (improving)', 'NPS score: 72 (industry avg: 45)'] },
            { title: 'Operational Metrics', items: ['Order fulfillment: 97.8% on-time', 'Inventory turnover: 6.4x (healthy)', '14 SKUs below reorder threshold', 'Fraud prevented: $84K this week'] },
          ].map(s => (
            <div key={s.title} style={{ padding: 16, borderRadius: 10, background: dark ? '#0f172a' : '#f8fafc', border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', margin: '0 0 10px', paddingBottom: 8, borderBottom: dark ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>{s.title}</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {s.items.map(item => (
                  <li key={item} style={{ fontSize: 12, color: dark ? '#94a3b8' : '#475569', lineHeight: 1.4 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
