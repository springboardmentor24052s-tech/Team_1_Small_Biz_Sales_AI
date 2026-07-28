import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { monthlySales, categoryData, topProducts, recentTransactions } from '../data/mockData'
import { Card, KpiCard, SectionHeader, AIInsight, Badge, Table, Tr, Td, PageHeader, Btn } from '../components/ui'
import { useTheme } from '../components/Layout'

const kpis = [
  { label: 'Total Revenue', value: '$2.67M', delta: '18.4%', deltaDir: 'up' as const, subtext: 'vs last year', color: '#2563eb', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { label: 'Net Profit', value: '$774K', delta: '22.1%', deltaDir: 'up' as const, subtext: 'margin 29%', color: '#22c55e', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg> },
  { label: 'Total Orders', value: '23,510', delta: '14.8%', deltaDir: 'up' as const, subtext: 'this year', color: '#4f46e5', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { label: 'Customers', value: '5,124', delta: '31.2%', deltaDir: 'up' as const, subtext: 'new: 1,890', color: '#f59e0b', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Inventory Items', value: '2,841', delta: '3.2%', deltaDir: 'down' as const, subtext: '14 low stock', color: '#ef4444', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
]

const aiInsights = [
  { title: 'Revenue Momentum', body: 'Revenue grew 18.4% YoY. November seasonal uplift is tracking 12% ahead of forecast — increase inventory for Electronics category immediately.', type: 'success' as const },
  { title: 'Churn Risk Alert', body: '340 customers show high churn indicators. Recommend launching a win-back campaign within 48 hours to protect ~$280K in at-risk lifetime value.', type: 'warning' as const },
  { title: 'Cross-sell Opportunity', body: 'Customers who bought Running Shoes have 78% likelihood of purchasing Hydration Packs. Automated recommendation campaign could yield $42K incremental revenue.', type: 'info' as const },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  const { dark } = useTheme()
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a', margin: '0 0 6px' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ fontSize: 12, color: p.color, margin: '2px 0' }}>
          {p.dataKey.charAt(0).toUpperCase() + p.dataKey.slice(1)}: ${(p.value / 1000).toFixed(0)}K
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { dark } = useTheme()
  const axisColor = dark ? '#475569' : '#94a3b8'
  const gridColor = dark ? '#1e293b' : '#f1f5f9'

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        subtitle="Real-time overview of your business performance · Jul 24, 2026"
        actions={<><Btn variant="outline">Export PDF</Btn><Btn>+ New Report</Btn></>}
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Monthly Sales Line Chart */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Monthly Revenue vs Target" subtitle="12-month performance trend" action={<Btn variant="outline" style={{ fontSize: 12, padding: '5px 12px' }}>All time</Btn>} />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlySales}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" dot={false} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} fill="url(#profGrad)" dot={false} activeDot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
            {[['Revenue', '#2563eb'], ['Profit', '#22c55e'], ['Target', '#94a3b8']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 3, borderRadius: 99, background: c }} />
                <span style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{l}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Donut */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Sales by Category" subtitle="Revenue distribution" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={54} outerRadius={80} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}%`, 'Share']} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12, background: dark ? '#1e293b' : '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {categoryData.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                  <span style={{ fontSize: 12, color: dark ? '#94a3b8' : '#64748b' }}>{c.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a' }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Top Products */}
        <Card>
          <div style={{ padding: '20px 20px 0' }}>
            <SectionHeader title="Top Products" subtitle="By revenue, last 12 months" action={<Btn variant="ghost" style={{ fontSize: 12, padding: '5px 12px' }}>View all →</Btn>} />
          </div>
          <Table headers={['Product', 'Category', 'Units', 'Revenue', 'Growth', 'Stock']}>
            {topProducts.map(p => (
              <Tr key={p.id}>
                <Td><span style={{ fontSize: 13, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a' }}>{p.name}</span></Td>
                <Td><span style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{p.category}</span></Td>
                <Td>{p.units.toLocaleString()}</Td>
                <Td><span style={{ fontWeight: 600 }}>${(p.revenue / 1000).toFixed(0)}K</span></Td>
                <Td><span style={{ fontSize: 12, fontWeight: 600, color: p.growth > 0 ? '#22c55e' : '#ef4444' }}>{p.growth > 0 ? '↑' : '↓'} {Math.abs(p.growth)}%</span></Td>
                <Td><span style={{ fontSize: 12, color: p.stock < 50 ? '#ef4444' : dark ? '#94a3b8' : '#64748b' }}>{p.stock}</span></Td>
              </Tr>
            ))}
          </Table>
        </Card>

        {/* AI Insights */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="AI Insights" subtitle="Generated 2 min ago" action={<span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>LIVE</span>} />
          {aiInsights.map((i, idx) => <AIInsight key={idx} {...i} />)}
          <button style={{ width: '100%', marginTop: 10, padding: '8px 0', borderRadius: 8, border: '1px dashed #e2e8f0', background: 'transparent', fontSize: 12, color: dark ? '#64748b' : '#94a3b8', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            View all 12 insights →
          </button>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div style={{ padding: '20px 20px 0' }}>
          <SectionHeader title="Recent Transactions" subtitle="Last 24 hours" action={<Btn variant="outline" style={{ fontSize: 12, padding: '5px 12px' }}>View all</Btn>} />
        </div>
        <Table headers={['Transaction ID', 'Customer', 'Amount', 'Status', 'Date', 'Payment Method']}>
          {recentTransactions.map(t => (
            <Tr key={t.id}>
              <Td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#2563eb' }}>{t.id}</span></Td>
              <Td><span style={{ fontWeight: 500 }}>{t.customer}</span></Td>
              <Td><span style={{ fontWeight: 600 }}>${t.amount.toFixed(2)}</span></Td>
              <Td><Badge status={t.status} /></Td>
              <Td><span style={{ color: dark ? '#64748b' : '#94a3b8', fontSize: 12 }}>{t.date}</span></Td>
              <Td><span style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{t.method}</span></Td>
            </Tr>
          ))}
        </Table>
        <div style={{ height: 16 }} />
      </Card>
    </div>
  )
}
