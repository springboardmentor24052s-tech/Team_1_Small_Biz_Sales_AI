import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { normalizeSeries } from './normalizeSeries';

const BAR_COLORS = ['#1f5b4f', '#3f8c77', '#c6922b', '#a97a1f', '#5b6473', '#2a3142'];

export default function TopCategoryChart({ data }) {
  const series = normalizeSeries(data);

  if (series.length === 0) {
    return <p className="mm-loading-tag">No category data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={series} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="#d9ddd6" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5b6473' }} />
        <YAxis tick={{ fontSize: 11, fill: '#5b6473' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, borderColor: '#d9ddd6', fontSize: 12 }}
          formatter={(value) => value.toLocaleString()}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {series.map((entry, idx) => (
            <Cell key={entry.name} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
