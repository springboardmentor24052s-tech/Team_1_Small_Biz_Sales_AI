import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { recommendationProducts } from '../data/mockData'
import { Card, SectionHeader, Badge, AIInsight, ProgressBar, PageHeader, Btn } from '../components/ui'
import { useTheme } from '../components/Layout'

const radarData = [
  { metric: 'Accuracy', value: 94 },
  { metric: 'Coverage', value: 82 },
  { metric: 'Novelty', value: 71 },
  { metric: 'Diversity', value: 88 },
  { metric: 'Serendipity', value: 65 },
  { metric: 'CTR', value: 78 },
]

const fbtData = [
  { pair: 'Headphones + AirPods', frequency: 1240, lift: 3.2 },
  { pair: 'Running Shoes + Hydration Pack', frequency: 980, lift: 3.8 },
  { pair: 'Office Chair + Desk Mat', frequency: 720, lift: 2.9 },
  { pair: 'Skincare Set + Vitamin C', frequency: 840, lift: 2.6 },
  { pair: 'Yoga Mat + Resistance Bands', frequency: 610, lift: 3.1 },
]

export default function ProductRecommendations() {
  const { dark } = useTheme()
  const ax = dark ? '#475569' : '#94a3b8'
  const grid = dark ? '#1e293b' : '#f1f5f9'

  const typeColors: Record<string, string> = { 'cross-sell': '#4f46e5', upsell: '#2563eb', 'frequently-bought': '#22c55e' }

  return (
    <div>
      <PageHeader
        title="Product Recommendations"
        subtitle="AI-generated cross-sell, upsell, and frequently-bought-together insights"
        actions={<><Btn variant="outline">Configure Rules</Btn><Btn>Deploy Campaign</Btn></>}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Recommendations Served', v: '142K', d: '↑ 24%', c: '#22c55e' },
          { l: 'Click-Through Rate', v: '8.4%', d: '↑ 1.2%', c: '#22c55e' },
          { l: 'Incremental Revenue', v: '$284K', d: '↑ 31%', c: '#22c55e' },
          { l: 'Avg. Confidence Score', v: '84.5%', d: '↑ 3.1%', c: '#22c55e' },
        ].map(k => (
          <Card key={k.l} style={{ padding: 18 }}>
            <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{k.l}</p>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: dark ? '#f8fafc' : '#0f172a' }}>{k.v}</p>
            <p style={{ fontSize: 12, margin: '4px 0 0', fontWeight: 600, color: k.c }}>{k.d} this month</p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Recommendation Cards */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Top AI Recommendations" subtitle="Ranked by expected incremental revenue" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {recommendationProducts.map(r => (
              <div key={r.id} style={{ padding: 16, borderRadius: 12, background: dark ? '#0f172a' : '#f8fafc', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <Badge status={r.type} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: typeColors[r.type] ?? '#64748b' }}>{r.confidence}% conf.</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a', margin: '0 0 4px' }}>{r.name}</p>
                <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 10px' }}>{r.category}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 2px' }}>Expected revenue</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#22c55e', margin: 0 }}>${(r.expectedRevenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 2px' }}>Lift</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#2563eb', margin: 0 }}>{r.lift}x</p>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}><ProgressBar value={r.confidence} color={typeColors[r.type] ?? '#2563eb'} height={4} /></div>
              </div>
            ))}
          </div>
        </Card>

        {/* Radar model quality */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Model Quality" subtitle="Recommendation engine metrics" />
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={grid} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: ax, fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <AIInsight title="Recommendation Engine" body="Model performing at 94% accuracy. Coverage gap detected in Beauty category — recommend expanding training data." type="info" />
          <AIInsight title="New Algorithm Available" body="Hybrid collaborative + content-based model ready. A/B test shows +12% CTR uplift." type="success" />
        </Card>
      </div>

      {/* FBT Table */}
      <Card style={{ padding: 22 }}>
        <SectionHeader title="Frequently Bought Together" subtitle="Top product pair associations by purchase frequency" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f1f5f9' }}>
                {['Rank', 'Product Pair', 'Co-Purchase Frequency', 'Lift Score', 'Confidence', 'Action'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: dark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fbtData.map((row, i) => (
                <tr key={row.pair} style={{ borderBottom: dark ? '1px solid #1e293b' : '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>#{i + 1}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: dark ? '#f8fafc' : '#0f172a' }}>{row.pair}</td>
                  <td style={{ padding: '12px 16px', color: dark ? '#94a3b8' : '#475569' }}>{row.frequency.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{row.lift}x</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ProgressBar value={row.frequency} max={1300} color="#4f46e5" />
                      <span style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', whiteSpace: 'nowrap' }}>{Math.round((row.frequency / 1300) * 100)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'transparent', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Enable</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
