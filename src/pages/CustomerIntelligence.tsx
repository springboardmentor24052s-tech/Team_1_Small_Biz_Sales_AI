import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { customerSegments, churnRiskData, clvData } from '../data/mockData'
import { Card, SectionHeader, AIInsight, ProgressBar, PageHeader, Btn, StatRow } from '../components/ui'
import { useTheme } from '../components/Layout'

const behaviorData = [
  { hour: '6am', visits: 120, purchases: 18 },
  { hour: '9am', visits: 340, purchases: 52 },
  { hour: '12pm', visits: 580, purchases: 91 },
  { hour: '3pm', visits: 460, purchases: 74 },
  { hour: '6pm', visits: 720, purchases: 128 },
  { hour: '9pm', visits: 640, purchases: 110 },
  { hour: '12am', visits: 180, purchases: 24 },
]

const topCustomers = [
  { name: 'Apex Retail Group', segment: 'Champions', ltv: 84200, orders: 48, lastOrder: '2 days ago' },
  { name: 'NovaTech Electronics', segment: 'Champions', ltv: 62400, orders: 31, lastOrder: '1 week ago' },
  { name: 'Sarah Mitchell', segment: 'Loyal', ltv: 14800, orders: 22, lastOrder: 'Yesterday' },
  { name: 'Momentum Sports LLC', segment: 'Loyal', ltv: 28600, orders: 19, lastOrder: '3 days ago' },
  { name: 'Vertex Beauty Inc.', segment: 'At Risk', ltv: 9400, orders: 8, lastOrder: '45 days ago' },
]

export default function CustomerIntelligence() {
  const { dark } = useTheme()
  const ax = dark ? '#475569' : '#94a3b8'
  const grid = dark ? '#1e293b' : '#f1f5f9'
  const [activeSegment, setActiveSegment] = useState<string | null>(null)

  const TT = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
        {payload.map((p: any) => (
          <p key={p.name} style={{ margin: '2px 0', color: p.color ?? (dark ? '#f8fafc' : '#0f172a') }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Customer Intelligence"
        subtitle="Segmentation, lifetime value, churn risk, and behavioral analytics"
        actions={<><Btn variant="outline">Export Segments</Btn><Btn>+ New Campaign</Btn></>}
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Total Customers', v: '5,124', d: '↑ 31.2%', c: '#22c55e', sub: 'vs last year' },
          { l: 'Avg. LTV', v: '$2,840', d: '↑ 12.4%', c: '#22c55e', sub: 'per customer' },
          { l: 'Avg. Purchase Freq.', v: '4.2 / yr', d: '↑ 0.8', c: '#22c55e', sub: 'vs 3.4 last yr' },
          { l: 'Avg. Churn Risk', v: '18.3%', d: '↓ 2.1%', c: '#22c55e', sub: 'improving' },
        ].map(k => (
          <Card key={k.l} style={{ padding: 18 }}>
            <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{k.l}</p>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: dark ? '#f8fafc' : '#0f172a' }}>{k.v}</p>
            <p style={{ fontSize: 12, margin: '4px 0 0', fontWeight: 600 }}>
              <span style={{ color: k.c }}>{k.d}</span>
              <span style={{ color: dark ? '#64748b' : '#94a3b8' }}> {k.sub}</span>
            </p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Segmentation donut */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Customer Segments" subtitle="RFM segmentation model" />
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={customerSegments} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="count" paddingAngle={2}
                onMouseEnter={(_, idx) => setActiveSegment(customerSegments[idx].segment)}
                onMouseLeave={() => setActiveSegment(null)}>
                {customerSegments.map((s, i) => (
                  <Cell key={i} fill={s.color} opacity={activeSegment && activeSegment !== s.segment ? 0.4 : 1} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {customerSegments.map(s => (
              <div key={s.segment} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 12, color: dark ? '#94a3b8' : '#64748b' }}>{s.segment}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a' }}>{s.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Churn risk */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Churn Risk Score" subtitle="Current customer base" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={churnRiskData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={2}>
                {churnRiskData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {churnRiskData.map(d => (
              <div key={d.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: dark ? '#94a3b8' : '#64748b' }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: d.color }}>{d.value}%</span>
                </div>
                <ProgressBar value={d.value} color={d.color} height={4} />
              </div>
            ))}
          </div>

          <AIInsight title="Retention Opportunity" body="768 customers in High Risk bucket. Recommend loyalty offer to top 200 by LTV (est. $180K recoverable)." type="warning" />
        </Card>

        {/* CLV Cohort */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="CLV by Cohort" subtitle="Avg. lifetime value per acquisition month" />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={clvData} barSize={20}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="cohort" tick={{ fill: ax, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: ax, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<TT />} />
              <Bar dataKey="clv" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Avg. CLV ($)" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12 }}>
            <StatRow label="Best Cohort" value="Jun '25 — $1,810" />
            <StatRow label="Avg. Retention" value="83.3%" />
            <StatRow label="LTV:CAC Ratio" value="4.2x" color="#22c55e" />
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* Behavior */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Customer Behavior Analytics" subtitle="Visit and purchase patterns by time of day" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={behaviorData}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Line dataKey="visits" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Visits" />
              <Line dataKey="purchases" stroke="#22c55e" strokeWidth={2} dot={false} name="Purchases" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 3, borderRadius: 99, background: '#2563eb' }} /><span style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>Site Visits</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 3, borderRadius: 99, background: '#22c55e' }} /><span style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>Purchases</span></div>
          </div>
        </Card>

        {/* Top Customers */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Top Customers" subtitle="By lifetime value" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topCustomers.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: dark ? '#0f172a' : '#f8fafc', border: dark ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: ['#2563eb', '#4f46e5', '#22c55e', '#f59e0b', '#ef4444'][i % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {c.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: dark ? '#f8fafc' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', margin: '2px 0 0' }}>{c.orders} orders · {c.lastOrder}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: dark ? '#f8fafc' : '#0f172a' }}>${(c.ltv / 1000).toFixed(0)}K</p>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: c.segment === 'Champions' ? '#dbeafe' : c.segment === 'At Risk' ? '#fee2e2' : '#f1f5f9', color: c.segment === 'Champions' ? '#1d4ed8' : c.segment === 'At Risk' ? '#dc2626' : '#64748b', fontWeight: 600 }}>{c.segment}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
