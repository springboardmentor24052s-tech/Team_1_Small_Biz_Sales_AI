import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { normalizeSeries } from './normalizeSeries';

export default function SalesTrendChart({ data }) {
  const series = normalizeSeries(data);

  if (series.length === 0) {
    return <p className="mm-loading-tag">No sales trend data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={series} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="#d9ddd6" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5b6473' }} />
        <YAxis tick={{ fontSize: 11, fill: '#5b6473' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, borderColor: '#d9ddd6', fontSize: 12 }}
          formatter={(value) => value.toLocaleString()}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#1f5b4f"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#c6922b' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
