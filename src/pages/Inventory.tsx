import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { inventoryItems } from '../data/mockData'
import { Card, SectionHeader, Badge, Table, Tr, Td, AIInsight, ProgressBar, PageHeader, Btn } from '../components/ui'
import { useTheme } from '../components/Layout'

const movementData = [
  { sku: 'Headphones', received: 200, sold: 142, returned: 8 },
  { sku: 'Running Shoes', received: 80, sold: 120, returned: 5 },
  { sku: 'Smart Hub', received: 50, sold: 91, returned: 2 },
  { sku: 'Serum', received: 300, sold: 180, returned: 14 },
  { sku: 'Office Chair', received: 30, sold: 48, returned: 3 },
]

const warehouseZones = [
  { zone: 'Zone A — Electronics', capacity: 85, items: 14, alert: false },
  { zone: 'Zone B — Apparel', capacity: 62, items: 28, alert: false },
  { zone: 'Zone C — Home & Garden', capacity: 91, items: 9, alert: true },
  { zone: 'Zone D — Sports', capacity: 44, items: 22, alert: false },
  { zone: 'Zone E — Beauty', capacity: 38, items: 31, alert: false },
]

export default function Inventory() {
  const { dark } = useTheme()
  const ax = dark ? '#475569' : '#94a3b8'
  const grid = dark ? '#1e293b' : '#f1f5f9'

  const kpis = [
    { l: 'Total SKUs', v: '2,841', d: '↓ 3.2%', c: '#ef4444' },
    { l: 'Total Stock Value', v: '$842K', d: '↑ 8.1%', c: '#22c55e' },
    { l: 'Low Stock Items', v: '14', d: '↑ 4', c: '#ef4444' },
    { l: 'Inventory Turnover', v: '6.4x', d: '↑ 0.8', c: '#22c55e' },
  ]

  return (
    <div>
      <PageHeader
        title="Inventory Management"
        subtitle="Stock levels, reorder recommendations, and warehouse overview"
        actions={<><Btn variant="outline">↓ Export</Btn><Btn>+ Add Stock</Btn></>}
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {kpis.map(k => (
          <Card key={k.l} style={{ padding: 18 }}>
            <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{k.l}</p>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: dark ? '#f8fafc' : '#0f172a' }}>{k.v}</p>
            <p style={{ fontSize: 12, margin: '4px 0 0', fontWeight: 600, color: k.c }}>{k.d} vs last month</p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Inventory Table */}
        <Card>
          <div style={{ padding: '20px 20px 0' }}>
            <SectionHeader title="Stock Levels" subtitle="All SKUs · sorted by status" />
          </div>
          <Table headers={['SKU', 'Product', 'Category', 'In Stock', 'Reorder At', 'Value', 'Movement', 'Status']}>
            {inventoryItems.map(item => (
              <Tr key={item.id}>
                <Td><span style={{ fontFamily: 'monospace', fontSize: 11, color: dark ? '#64748b' : '#94a3b8' }}>{item.id}</span></Td>
                <Td><span style={{ fontWeight: 500, fontSize: 13 }}>{item.name}</span></Td>
                <Td><span style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{item.category}</span></Td>
                <Td>
                  <div>
                    <span style={{ fontWeight: 600, color: item.stock === 0 ? '#ef4444' : item.stock < item.reorder ? '#f59e0b' : (dark ? '#f8fafc' : '#0f172a') }}>{item.stock}</span>
                    <div style={{ marginTop: 4 }}><ProgressBar value={item.stock} max={200} color={item.stock === 0 ? '#ef4444' : item.stock < item.reorder ? '#f59e0b' : '#22c55e'} height={3} /></div>
                  </div>
                </Td>
                <Td style={{ color: dark ? '#64748b' : '#94a3b8', fontSize: 12 }}>{item.reorder}</Td>
                <Td style={{ fontWeight: 600 }}>${item.value.toLocaleString()}</Td>
                <Td><span style={{ fontSize: 12, fontWeight: 600, color: item.movement.startsWith('+') ? '#22c55e' : '#ef4444' }}>{item.movement}</span></Td>
                <Td><Badge status={item.status} /></Td>
              </Tr>
            ))}
          </Table>
          <div style={{ height: 16 }} />
        </Card>

        {/* Warehouse + AI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 22 }}>
            <SectionHeader title="Warehouse Overview" subtitle="Capacity by zone" />
            {warehouseZones.map(z => (
              <div key={z.zone} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: dark ? '#94a3b8' : '#475569', fontWeight: 500 }}>{z.zone}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: z.capacity > 85 ? '#ef4444' : z.capacity > 70 ? '#f59e0b' : '#22c55e' }}>{z.capacity}%</span>
                </div>
                <ProgressBar value={z.capacity} color={z.capacity > 85 ? '#ef4444' : z.capacity > 70 ? '#f59e0b' : '#2563eb'} height={6} />
                {z.alert && <p style={{ fontSize: 11, color: '#ef4444', margin: '3px 0 0' }}>⚠ Near capacity — consider redistribution</p>}
              </div>
            ))}
          </Card>

          <Card style={{ padding: 22 }}>
            <SectionHeader title="AI Reorder Alerts" subtitle="Recommended actions" />
            <AIInsight title="Smart Hub Pro — Critical" body="Current stock: 8 units. At current velocity, stockout in ~6 hours. Place emergency order for 100 units." type="warning" />
            <AIInsight title="Running Shoes — Low" body="Below reorder threshold. Suggested order: 150 units to cover 3-week demand." type="warning" />
            <AIInsight title="Headphones — Optimal" body="Stock levels are healthy. Next reorder recommended in ~3 weeks based on current trend." type="success" />
          </Card>
        </div>
      </div>

      {/* Movement Chart */}
      <Card style={{ padding: 22 }}>
        <SectionHeader title="Inventory Movement" subtitle="Received vs. sold vs. returned · Top 5 products" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={movementData} barGap={4} barCategoryGap="25%">
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="sku" tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }} />
            <Bar dataKey="received" fill="#22c55e" radius={[4, 4, 0, 0]} name="Received" maxBarSize={28} />
            <Bar dataKey="sold" fill="#2563eb" radius={[4, 4, 0, 0]} name="Sold" maxBarSize={28} />
            <Bar dataKey="returned" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Returned" maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          {[['Received', '#22c55e'], ['Sold', '#2563eb'], ['Returned', '#f59e0b']].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: c }} /><span style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{l}</span></div>
          ))}
        </div>
      </Card>
    </div>
  )
}
