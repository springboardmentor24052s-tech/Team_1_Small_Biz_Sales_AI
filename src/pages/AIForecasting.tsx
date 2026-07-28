import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { forecastData } from '../data/mockData'
import { Card, SectionHeader, AIInsight, Gauge, StatRow, PageHeader, Btn, ProgressBar } from '../components/ui'
import { useTheme } from '../components/Layout'

const seasonalData = [
  { month: 'Jan', index: 82 }, { month: 'Feb', index: 78 }, { month: 'Mar', index: 95 },
  { month: 'Apr', index: 88 }, { month: 'May', index: 102 }, { month: 'Jun', index: 118 },
  { month: 'Jul', index: 110 }, { month: 'Aug', index: 114 }, { month: 'Sep', index: 125 },
  { month: 'Oct', index: 130 }, { month: 'Nov', index: 165 }, { month: 'Dec', index: 185 },
]

const demandItems = [
  { product: 'Wireless Headphones', demand: 4820, trend: '+18%', confidence: 92, color: '#2563eb' },
  { product: 'Running Shoes', demand: 3640, trend: '+24%', confidence: 87, color: '#22c55e' },
  { product: 'Smart Home Hub Pro', demand: 5200, trend: '+41%', confidence: 78, color: '#f59e0b' },
  { product: 'Organic Skincare Set', demand: 2910, trend: '+12%', confidence: 94, color: '#4f46e5' },
  { product: 'Ergonomic Chair', demand: 1380, trend: '-6%', confidence: 81, color: '#ef4444' },
]

export default function AIForecasting() {
  const { dark } = useTheme()
  const ax = dark ? '#475569' : '#94a3b8'
  const grid = dark ? '#1e293b' : '#f1f5f9'

  const TT = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ fontWeight: 600, margin: '0 0 6px', color: dark ? '#f8fafc' : '#0f172a' }}>{label}</p>
        {payload.map((p: any) => p.value != null && (
          <p key={p.dataKey} style={{ margin: '2px 0', color: p.color ?? ax }}>
            {p.name}: ${(p.value / 1000).toFixed(0)}K
          </p>
        ))}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="AI Forecasting"
        subtitle="Demand forecasting, sales prediction, and seasonal intelligence"
        actions={<><Btn variant="outline">↓ Download Report</Btn><Btn>Refresh Forecast</Btn></>}
      />

      {/* Accuracy gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Gauge value={94} label="Overall Accuracy" color="#22c55e" />
          <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '4px 0 0', textAlign: 'center' }}>30-day forecast</p>
        </Card>
        <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Gauge value={87} label="90-Day Accuracy" color="#2563eb" />
          <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '4px 0 0', textAlign: 'center' }}>90-day forecast</p>
        </Card>
        <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Gauge value={78} label="Demand Precision" color="#f59e0b" />
          <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '4px 0 0', textAlign: 'center' }}>SKU-level demand</p>
        </Card>
        <Card style={{ padding: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: dark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Model Stats</p>
          <StatRow label="Training data" value="38 months" />
          <StatRow label="Data points" value="2.4M" />
          <StatRow label="Last retrained" value="6 hours ago" />
          <StatRow label="Algorithm" value="Hybrid LSTM" color="#4f46e5" />
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card style={{ padding: 22, marginBottom: 14 }}>
        <SectionHeader title="Sales Prediction — Next 4 Months" subtitle="Actual + forecast with 90% confidence interval" action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="outline" style={{ fontSize: 12, padding: '5px 12px' }}>90-day</Btn>
            <Btn variant="outline" style={{ fontSize: 12, padding: '5px 12px' }}>180-day</Btn>
          </div>
        } />
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={forecastData}>
            <defs>
              <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: ax, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
            <Tooltip content={<TT />} />
            {/* Confidence band */}
            <Area type="monotone" dataKey="upper" fill="url(#confGrad)" stroke="transparent" name="Upper CI" />
            <Area type="monotone" dataKey="lower" fill={dark ? '#0f172a' : '#f8fafc'} stroke="transparent" name="Lower CI" />
            {/* Forecast line */}
            <Line type="monotone" dataKey="forecast" stroke="#2563eb" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} name="Forecast" />
            {/* Actual line */}
            <Line type="monotone" dataKey="actual" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 4, fill: '#0f172a', stroke: '#fff', strokeWidth: 2 }} name="Actual" />
          </ComposedChart>
        </ResponsiveContainer>

        <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
          {[['Actual', '#0f172a', ''], ['Forecast', '#2563eb', 'dashed'], ['Confidence Interval', '#2563eb', 'filled']].map(([l, c, t]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: t === 'filled' ? 8 : 3, borderRadius: 2, background: t === 'filled' ? `${c}30` : c, border: t === 'filled' ? `1px solid ${c}60` : 'none' }} />
              <span style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Demand forecast by product */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Demand Forecast by Product" subtitle="Next 30 days · units" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {demandItems.map(d => (
              <div key={d.product}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: dark ? '#f8fafc' : '#0f172a' }}>{d.product}</p>
                    <p style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', margin: '2px 0 0' }}>Confidence: {d.confidence}%</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: dark ? '#f8fafc' : '#0f172a' }}>{d.demand.toLocaleString()}</p>
                    <p style={{ fontSize: 12, margin: '2px 0 0', fontWeight: 600, color: d.trend.startsWith('+') ? '#22c55e' : '#ef4444' }}>{d.trend}</p>
                  </div>
                </div>
                <ProgressBar value={d.confidence} color={d.color} height={5} />
              </div>
            ))}
          </div>
        </Card>

        {/* Seasonal index */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Seasonal Demand Index" subtitle="Seasonality factor (100 = baseline)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={seasonalData} barSize={18}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: ax, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: ax, fontSize: 10 }} axisLine={false} tickLine={false} domain={[60, 200]} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }} />
              <Bar dataKey="index" name="Seasonal Index" radius={[4, 4, 0, 0]}
                fill="#4f46e5"
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 16 }}>
            <AIInsight title="Peak Season Alert" body="November shows 65% above baseline demand. Recommend increasing inventory levels by 40% across Electronics and Apparel by Oct 15." type="warning" />
            <AIInsight title="Q1 Dip Predicted" body="January–February seasonally weak. Consider promotional campaigns to sustain revenue momentum." type="info" />
          </div>
        </Card>
      </div>
    </div>
  )
}
